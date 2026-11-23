import fs from "node:fs";
import fsPromises from "node:fs/promises";

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
  avatars: loadResource("avatars"),
  textMap: loadResource("text_map"),
  artifacts: loadResource("artifacts"),
  weapons: loadResource("weapons"),
};

// TODO この関数はprofile moduleのものを使用する
const getProfile = async () => {
  try {
    const content = await fsPromises.readFile("./data/profile.json", "utf-8");
    const backup = JSON.parse(content);
    return backup.data;
  } catch (error) {
    console.error(error);
    return null;
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

    const id = generateArtifactId(artifact);
    artifacts.push({ id, ...artifact });
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

const getShowcaseAvatars = async (uid) => {
  try {
    const profile = await getProfile(uid);
    const avatarInfoList = profile.avatarInfoList;

    const result = [];

    for (const avatarInfo of avatarInfoList) {
      const avatarBasicInfo = resources.avatars?.[avatarInfo.avatarId];
      const artifactInfoList = getArtifactInfoList(avatarInfo?.equipList);
      const weaponInfo = getWeaponInfo(avatarInfo?.equipList);

      result.push({
        avatarInfo: {
          id: avatarInfo?.avatarId,
          level: avatarInfo?.propMap?.["4001"]?.val,
          consts: "talentIdList" in avatarInfo ? avatarInfo.talentIdList.length : 0,
          talents: Object.fromEntries(
            avatarBasicInfo?.SkillOrder.map((id) => {
              return [
                id,
                {
                  level: avatarInfo?.skillLevelMap?.[id],
                  extra: avatarInfo?.proudSkillExtraLevelMap?.[avatarBasicInfo?.ProudMap?.[id]] ?? 0,
                },
              ];
            }),
          ),
          stats: {
            cr: avatarInfo?.fightPropMap?.["20"],
            cd: avatarInfo?.fightPropMap?.["22"],
            er: avatarInfo?.fightPropMap?.["23"],
            hb: avatarInfo?.fightPropMap?.["26"],
            ihb: avatarInfo?.fightPropMap?.["27"],
            em: avatarInfo?.fightPropMap?.["28"],
            hp: avatarInfo?.fightPropMap?.["2000"],
            atk: avatarInfo?.fightPropMap?.["2001"],
            def: avatarInfo?.fightPropMap?.["2002"],
            dmg: {
              phys: avatarInfo?.fightPropMap?.["30"],
              pyro: avatarInfo?.fightPropMap?.["40"],
              electro: avatarInfo?.fightPropMap?.["41"],
              hydro: avatarInfo?.fightPropMap?.["42"],
              dendro: avatarInfo?.fightPropMap?.["43"],
              anemo: avatarInfo?.fightPropMap?.["44"],
              geo: avatarInfo?.fightPropMap?.["45"],
              cryo: avatarInfo?.fightPropMap?.["46"],
            },
          },
          friendship: avatarInfo?.fetterInfo?.expLevel,
          ...("costumeId" in avatarInfo ? { costume: avatarInfo.costumeId } : {}),
          artifacts: artifactInfoList.map((artifact) => artifact.id),
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

const enrichAvatarInfo = (rawAvatarInfo) => {
  const avatarInfo = structuredClone(rawAvatarInfo);
  const weaponInfo = avatarInfo.weaponInfo;

  const avatarBasicInfo = resources.avatars?.[avatarInfo.id];
  const weaponBasicInfo = resources.weapons?.[weaponInfo.id];

  Object.assign(avatarInfo, {
    name: resources.textMap?.[avatarBasicInfo?.NameTextMapHash],
    element: avatarBasicInfo?.Element,
    constsIcon: avatarBasicInfo?.Consts.map(getIconUrl),
    quality: avatarBasicInfo?.QualityType,
    talents: Object.fromEntries(
      Object.entries(avatarInfo.talents).map(([id, value]) => {
        return [id, { ...value, icon: getIconUrl(avatarBasicInfo?.Skills?.[id]) }];
      }),
    ),
    icon:
      "costume" in avatarInfo
        ? getIconUrl(avatarBasicInfo?.Costumes?.[avatarInfo?.costume]?.Icon)
        : getIconUrl(avatarBasicInfo?.SideIconName.replace(/_Side/g, "")),
  });

  Object.assign(avatarInfo.weaponInfo, {
    rarity: weaponBasicInfo?.Rarity,
    type: weaponBasicInfo?.WeaponType,
    name: resources.textMap?.[weaponBasicInfo?.NameTextMapHash],
    icon: getIconUrl(weaponBasicInfo?.Icon),
  });

  return avatarInfo;
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

const main = async () => {
  const showcaseAvatars = await getShowcaseAvatars("889572498");
  // fsPromises.writeFile("./data/avatars.json", JSON.stringify(showcaseAvatars), "utf-8");

  const enrichedAvatarInfo = enrichAvatarInfo(showcaseAvatars[0].avatarInfo);
  const enrichedArtifactInfo = enrichArtifactInfo(showcaseAvatars[0].artifactInfoList[0]);

  console.log(enrichedAvatarInfo);
};

main();
