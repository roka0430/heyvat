import fs from "node:fs";
import fsPromises from "node:fs/promises";

const loadResource = (filename) => {
  try {
    const content = fs.readFileSync(`./resources/${filename}.json`, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(error);
    return null;
  }
};

const RELIC_TYPES = {
  EQUIP_BRACER: 0,
  EQUIP_NECKLACE: 1,
  EQUIP_SHOES: 2,
  EQUIP_RING: 3,
  EQUIP_DRESS: 4,
};

const RELIC_PROPS = {
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

const resources = {
  avatars: loadResource("avatars"),
  textMap: loadResource("text_map"),
  relicSets: loadResource("relic_sets"),
  weapons: loadResource("weapons"),
};

const getIconUrl = (iconName) => {
  if (!iconName) {
    return null;
  }

  const formatted = iconName.replace(/\/ui\/(.*)\.png/, "$1");
  return `https://enka.network/ui/${formatted}.png`;
};

const getProfile = async () => {
  try {
    const content = await fsPromises.readFile("./data/backup.json", "utf-8");
    const backup = JSON.parse(content);
    return backup.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const generateRelicId = (artifact) => {
  const mainstat = `${RELIC_PROPS[artifact.mainstat.mainPropId]}:${Math.round(artifact.mainstat.statValue * 10)}`;

  const substats = artifact.substats
    .map(({ appendPropId, statValue }) => ({
      id: RELIC_PROPS[appendPropId],
      value: Math.round(statValue * 10),
    }))
    .sort((a, b) => a.id - b.id)
    .map(({ id, value }) => `${id}:${value}`)
    .join("-");

  return [artifact.setId, artifact.type, mainstat, substats].join("-");
};

const getRelicInfoList = (equipList = []) => {
  const relics = [];

  for (const equip of equipList) {
    if (equip?.flat?.itemType !== "ITEM_RELIQUARY") {
      continue;
    }

    const relic = {
      itemId: equip?.itemId,
      setId: equip?.flat?.setId,
      setName: resources.textMap?.[resources.relicSets?.[equip?.flat?.setId]?.Name],
      rarity: equip?.flat?.rankLevel,
      type: RELIC_TYPES?.[equip?.flat?.equipType],
      level: equip?.reliquary?.level - 1,
      icon: getIconUrl(equip?.flat?.icon),
      mainstat: equip?.flat?.reliquaryMainstat,
      substats: equip?.flat?.reliquarySubstats,
    };

    const id = generateRelicId(relic);
    relics.push({ id, ...relic });
  }

  return relics;
};

const getWeaponInfo = (equipList = []) => {
  for (const equip of equipList) {
    if (!(equip.itemId in resources.weapons)) {
      continue;
    }

    const weaponBasicInfo = resources.weapons?.[equip?.itemId];
    const stats = equip?.flat?.weaponStats.map((stat) => Object.values(stat));

    return {
      rarity: equip?.flat?.rankLevel,
      type: weaponBasicInfo?.WeaponType,
      level: equip?.weapon?.level,
      refinement: Object.values(equip?.weapon?.affixMap)?.[0] + 1,
      name: resources.textMap?.[equip?.flat?.nameTextMapHash],
      icon: getIconUrl(equip?.flat?.icon),
      atk: stats.find((stat) => stat?.[0] === "FIGHT_PROP_BASE_ATTACK"),
      stat: stats.find((stat) => stat?.[0] !== "FIGHT_PROP_BASE_ATTACK"),
    };
  }
};

const getAvatarsInfo = async (uid) => {
  try {
    const profile = await getProfile(uid);
    const avatarInfoList = profile.avatarInfoList;

    const result = [];

    for (const avatarInfo of avatarInfoList) {
      const avatarBasicInfo = resources.avatars?.[avatarInfo?.avatarId];
      const relicInfoList = getRelicInfoList(avatarInfo?.equipList);
      const weaponInfo = getWeaponInfo(avatarInfo?.equipList);

      result.push({
        id: avatarInfo?.avatarId,
        name: resources.textMap?.[avatarBasicInfo?.NameTextMapHash],
        element: avatarBasicInfo?.Element,
        level: avatarInfo?.propMap?.["4001"]?.val,
        consts: "talentIdList" in avatarInfo ? avatarInfo.talentIdList.length : 0,
        constsIcon: avatarBasicInfo?.Consts.map(getIconUrl),
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
        talents: Object.fromEntries(
          avatarBasicInfo?.SkillOrder.map((id) => {
            return [
              id,
              {
                icon: getIconUrl(avatarBasicInfo?.Skills?.[id]),
                level: avatarInfo?.skillLevelMap?.[id],
                extra: avatarInfo?.proudSkillExtraLevelMap?.[avatarBasicInfo?.ProudMap?.[id]] ?? 0,
              },
            ];
          }),
        ),
        quality: avatarBasicInfo?.QualityType,
        friendship: avatarInfo?.fetterInfo?.expLevel,
        icon:
          "costumeId" in avatarInfo
            ? getIconUrl(avatarBasicInfo?.Costumes?.[avatarInfo?.costumeId]?.Icon)
            : getIconUrl(avatarBasicInfo?.SideIconName.replace(/_Side/g, "")),
        relics: relicInfoList,
        weapon: weaponInfo,
      });
    }

    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const main = async () => {
  const avatarsInfo = await getAvatarsInfo("889572498");
  // for (const avatar of avatarsInfo) {
  //   console.log(avatar);
  // }
  fsPromises.writeFile("./data/avatars.json", JSON.stringify(avatarsInfo), "utf-8");
};

main();
