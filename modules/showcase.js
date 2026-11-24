import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

import profiles from "./profile.js";

const ARTIFACT_PROPS = {
  FIGHT_PROP_HP: 0,
  FIGHT_PROP_ATTACK: 1,
  FIGHT_PROP_DEFENSE: 2,
  FIGHT_PROP_HP_PERCENT: 3,
  FIGHT_PROP_ATTACK_PERCENT: 4,
  FIGHT_PROP_DEFENSE_PERCENT: 5,
  FIGHT_PROP_CRITICAL: 6,
  FIGHT_PROP_CRITICAL_HURT: 7,
  FIGHT_PROP_CHARGE_EFFICIENCY: 8,
  FIGHT_PROP_HEAL_ADD: 9,
  FIGHT_PROP_ELEMENT_MASTERY: 10,
  FIGHT_PROP_PHYSICAL_ADD_HURT: 11,
  FIGHT_PROP_FIRE_ADD_HURT: 12,
  FIGHT_PROP_ELEC_ADD_HURT: 13,
  FIGHT_PROP_WATER_ADD_HURT: 14,
  FIGHT_PROP_WIND_ADD_HURT: 15,
  FIGHT_PROP_ICE_ADD_HURT: 16,
  FIGHT_PROP_ROCK_ADD_HURT: 17,
  FIGHT_PROP_GRASS_ADD_HURT: 18,
};

const loadResource = (filename) => {
  try {
    const content = fs.readFileSync(`./resources/${filename}.json`, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(error);
    return null;
  }
};

const resources = {
  characters: loadResource("characters"),
  textMap: loadResource("text_map"),
  artifacts: loadResource("artifacts"),
  weapons: loadResource("weapons"),
  scores: loadResource("scores"),
};

const loadData = async (uid, filename) => {
  const dirpath = path.join("./data/showcase", uid);
  const filepath = path.join(dirpath, `${filename}.json`);

  await fsPromises.mkdir(dirpath, { recursive: true });

  try {
    const content = await fsPromises.readFile(filepath, "utf-8");
    return JSON.parse(content) ?? {};
  } catch (error) {
    return {};
  }
};

const writeData = async (uid, filename, data) => {
  const dirpath = path.join("./data/showcase", uid);
  const filepath = path.join(dirpath, `${filename}.json`);
  const tempPath = `${filepath}.tmp`;

  await fsPromises.mkdir(dirpath, { recursive: true });

  try {
    const json = JSON.stringify(data);

    await fsPromises.writeFile(tempPath, json, "utf-8");
    await fsPromises.rename(tempPath, filepath);

    return true;
  } catch (error) {
    await fsPromises.rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }
};

const getIconUrl = (iconName) => {
  if (!iconName) {
    return null;
  }

  const formatted = iconName.replace(/\/ui\/(.*)\.png/, "$1");
  return `https://enka.network/ui/${formatted}.png`;
};

const generateArtifactId = (artifact) => {
  const artifactSet = resources.artifacts.Items?.[artifact.itemId];
  const setId = artifactSet?.SetId;
  const type = artifactSet?.EquipType;

  const mainstat = `${artifact.mainstat?.[0]}:${Math.round(artifact.mainstat?.[1] * 10)}`;

  const substats = artifact.substats
    .map(([propId, value]) => ({
      id: propId,
      value: Math.round(value * 10),
    }))
    .sort((a, b) => a.id - b.id)
    .map(({ id, value }) => `${id}:${value}`)
    .join("-");

  return [setId, type, mainstat, substats].join("-");
};

const getArtifactInfoList = (equipList = []) => {
  const artifacts = [];

  for (const equip of equipList) {
    if (equip?.flat?.itemType !== "ITEM_RELIQUARY") {
      continue;
    }

    const artifact = {
      itemId: equip?.itemId,
      level: equip?.reliquary?.level - 1,
      mainstat: [
        ARTIFACT_PROPS?.[equip?.flat?.reliquaryMainstat?.mainPropId],
        equip?.flat?.reliquaryMainstat?.statValue,
      ],
      substats: equip?.flat?.reliquarySubstats.map((substat) => {
        return [ARTIFACT_PROPS?.[substat?.appendPropId], substat?.statValue];
      }),
    };

    const critScore =
      (artifact.substats.find((substat) => substat[0] === 6)?.[1] ?? 0) * 2 +
      (artifact.substats.find((substat) => substat[0] === 7)?.[1] ?? 0);

    const scores = {
      crit: Math.round(critScore * 10) / 10,
      hp: Math.round((critScore + (artifact.substats.find((substat) => substat[0] === 3)?.[1] ?? 0)) * 10) / 10,
      atk: Math.round((critScore + (artifact.substats.find((substat) => substat[0] === 4)?.[1] ?? 0)) * 10) / 10,
      def: Math.round((critScore + (artifact.substats.find((substat) => substat[0] === 5)?.[1] ?? 0)) * 10) / 10,
      er: Math.round((critScore + (artifact.substats.find((substat) => substat[0] === 8)?.[1] ?? 0)) * 10) / 10,
      em: Math.round((critScore + (artifact.substats.find((substat) => substat[0] === 10)?.[1] ?? 0) / 4) * 10) / 10,
    };

    const id = generateArtifactId(artifact);
    artifacts.push({ id, ...artifact, scores });
  }

  return artifacts;
};

const getWeaponInfo = (equipList = []) => {
  for (const equip of equipList) {
    if (!(equip.itemId in resources.weapons)) {
      continue;
    }

    const stats = equip?.flat?.weaponStats.map((stat) => Object.values(stat));

    return {
      id: equip?.itemId,
      level: equip?.weapon?.level,
      refinement: Object.values(equip?.weapon?.affixMap)?.[0] + 1,
      atk: stats.find((stat) => stat?.[0] === "FIGHT_PROP_BASE_ATTACK"),
      stat: stats.find((stat) => stat?.[0] !== "FIGHT_PROP_BASE_ATTACK"),
    };
  }
};

const getShowcaseCharacters = async (uid) => {
  try {
    const profile = await profiles.getProfile(uid);
    const characterInfoList = profile.avatarInfoList;

    const result = [];

    for (const characterInfo of characterInfoList) {
      const characterBasicInfo = resources.characters?.[characterInfo.avatarId];
      const artifactInfoList = getArtifactInfoList(characterInfo?.equipList);
      const weaponInfo = getWeaponInfo(characterInfo?.equipList);

      result.push({
        characterInfo: {
          id: characterInfo?.avatarId,
          level: characterInfo?.propMap?.["4001"]?.val,
          consts: "talentIdList" in characterInfo ? characterInfo.talentIdList.length : 0,
          talents: Object.fromEntries(
            characterBasicInfo?.SkillOrder.map((id) => {
              return [
                id,
                {
                  level: characterInfo?.skillLevelMap?.[id],
                  extra: characterInfo?.proudSkillExtraLevelMap?.[characterBasicInfo?.ProudMap?.[id]] ?? 0,
                },
              ];
            }),
          ),
          stats: {
            cr: characterInfo?.fightPropMap?.["20"],
            cd: characterInfo?.fightPropMap?.["22"],
            er: characterInfo?.fightPropMap?.["23"],
            hb: characterInfo?.fightPropMap?.["26"],
            ihb: characterInfo?.fightPropMap?.["27"],
            em: characterInfo?.fightPropMap?.["28"],
            hp: characterInfo?.fightPropMap?.["2000"],
            atk: characterInfo?.fightPropMap?.["2001"],
            def: characterInfo?.fightPropMap?.["2002"],
            dmg: {
              phys: characterInfo?.fightPropMap?.["30"],
              pyro: characterInfo?.fightPropMap?.["40"],
              electro: characterInfo?.fightPropMap?.["41"],
              hydro: characterInfo?.fightPropMap?.["42"],
              dendro: characterInfo?.fightPropMap?.["43"],
              anemo: characterInfo?.fightPropMap?.["44"],
              geo: characterInfo?.fightPropMap?.["45"],
              cryo: characterInfo?.fightPropMap?.["46"],
            },
          },
          friendship: characterInfo?.fetterInfo?.expLevel,
          ...("costumeId" in characterInfo ? { costume: characterInfo.costumeId } : {}),
          artifacts: artifactInfoList.map((artifact) => artifact.id),
          scores: Object.fromEntries(
            Object.entries(
              artifactInfoList
                .map((artifactInfo) => artifactInfo.scores)
                .reduce((acc, score) => {
                  for (const key in score) {
                    acc[key] = (acc[key] ?? 0) + score[key];
                  }
                  return acc;
                }, {}),
            ).map(([key, value]) => [key, Math.round(value * 10) / 10]),
          ),
          weaponInfo: weaponInfo,
        },
        artifactInfoList: artifactInfoList,
      });
    }

    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getArtifactSets = (artifactIds) => {
  const setIds = artifactIds.map((artifact) => {
    return parseInt(artifact.split("-")[0]);
  });

  const setList = [...new Set(setIds)].map((setId) => {
    return [setId, setIds.filter((id) => id === setId).length];
  });

  const artifactItems = Object.values(resources.artifacts?.Items);
  const icons = Object.fromEntries(
    setList.map(([id, num]) => {
      const artifact = artifactItems.filter((artifact) => artifact?.SetId === id && artifact?.EquipType === 0)?.[0];
      return [id, getIconUrl(artifact.Icon)];
    }),
  );

  return setList
    .filter(([id, num]) => num >= 2)
    .map(([id, num]) => {
      const name = resources.textMap?.[resources.artifacts?.Sets?.[id]?.Name];
      return { name, icon: icons[id] };
    });
};

const enrichCharacterInfo = (rawCharacterInfo) => {
  const characterInfo = structuredClone(rawCharacterInfo);
  const weaponInfo = characterInfo.weaponInfo;

  const characterBasicInfo = resources.characters?.[characterInfo.id];
  const weaponBasicInfo = resources.weapons?.[weaponInfo.id];

  Object.assign(characterInfo, {
    name: resources.textMap?.[characterBasicInfo?.NameTextMapHash],
    element: characterBasicInfo?.Element,
    constsIcon: characterBasicInfo?.Consts.map(getIconUrl),
    quality: characterBasicInfo?.QualityType,
    talents: Object.fromEntries(
      Object.entries(characterInfo.talents).map(([id, value]) => {
        return [id, { ...value, icon: getIconUrl(characterBasicInfo?.Skills?.[id]) }];
      }),
    ),
    icon:
      "costume" in characterInfo
        ? getIconUrl(characterBasicInfo?.Costumes?.[characterInfo?.costume]?.Icon)
        : getIconUrl(characterBasicInfo?.SideIconName.replace(/_Side/g, "")),
    scoreReference: resources.scores?.[characterInfo?.id],
    artifactSets: getArtifactSets(characterInfo.artifacts),
  });

  Object.assign(characterInfo.weaponInfo, {
    rarity: weaponBasicInfo?.Rarity,
    type: weaponBasicInfo?.WeaponType,
    name: resources.textMap?.[weaponBasicInfo?.NameTextMapHash],
    icon: getIconUrl(weaponBasicInfo?.Icon),
  });

  return characterInfo;
};

const enrichArtifactInfo = (rawArtifactInfo) => {
  const artifactInfo = structuredClone(rawArtifactInfo);
  const artifactSet = resources.artifacts.Items?.[artifactInfo.itemId];

  Object.assign(artifactInfo, {
    setId: artifactSet?.SetId,
    setName: resources.textMap?.[resources.artifacts.Sets?.[artifactSet?.SetId]?.Name],
    rarity: artifactSet?.Rarity,
    type: artifactSet?.EquipType,
    icon: getIconUrl(artifactSet?.Icon),
  });

  return artifactInfo;
};

const updateShowcaseData = async (uid) => {
  const showcaseCharacters = await getShowcaseCharacters(uid);

  const charactersData = await loadData(uid, "characters");
  const artifactsData = await loadData(uid, "artifacts");

  const updatedAt = new Date().toISOString();

  for (const showcaseCharacter of showcaseCharacters) {
    showcaseCharacter.characterInfo.updatedAt = updatedAt;
    charactersData[showcaseCharacter.characterInfo.id] = showcaseCharacter.characterInfo;
    for (const artifactInfo of showcaseCharacter.artifactInfoList) {
      artifactInfo.updatedAt = updatedAt;
      artifactsData[artifactInfo.id] = artifactInfo;
    }
  }

  writeData(uid, "showcase", showcaseCharacters);
  writeData(uid, "characters", charactersData);
  writeData(uid, "artifacts", artifactsData);

  return showcaseCharacters;
};

const getCharacters = async (uid, showcaseOnly = false) => {
  const showcaseData = await updateShowcaseData(uid);

  if (showcaseOnly) {
    return showcaseData.map((datum) => enrichCharacterInfo(datum.characterInfo));
  }

  const characters = await loadData(uid, "characters");
  return Object.values(characters).map((datum) => enrichCharacterInfo(datum));
};

const getCacheCharacters = async (uid, showcaseOnly = false) => {
  if (showcaseOnly) {
    const characters = await loadData(uid, "showcase");
    return characters.map((datum) => enrichCharacterInfo(datum.characterInfo));
  }

  const characters = await loadData(uid, "characters");
  return Object.values(characters).map((datum) => enrichCharacterInfo(datum));
};

const getArtifacts = async (uid) => {
  await updateShowcaseData(uid);

  const artifacts = await loadData(uid, "artifacts");
  return Object.values(artifacts).map((datum) => enrichArtifactInfo(datum));
};

const getCacheArtifacts = async (uid) => {
  const artifacts = await loadData(uid, "artifacts");
  return Object.values(artifacts).map((datum) => enrichArtifactInfo(datum));
};

export default {
  updateShowcaseData,
  getCharacters,
  getCacheCharacters,
  getArtifacts,
  getCacheArtifacts,
};
