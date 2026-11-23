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

const resources = {
  avatars: loadResource("avatars"),
  textMap: loadResource("text_map"),
  weapons: loadResource("weapons"),
};

const getIconUrl = (iconName) => {
  return `https://enka.network/ui/${iconName}.png`;
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

const getRelicInfoList = async (equipList = []) => {
  for (const equip of equipList) {
    if (equip?.flat?.itemType !== "ITEM_RELIQUARY") {
      continue;
    }

    console.log(equip?.flat);
  }
};

const getWeaponInfoList = async (equipList = []) => {
  for (const equip of equipList) {
    if (!(equip.itemId in resources.weapons)) {
      continue;
    }

    const weapon = resources.weapons?.[equip.itemId];
    console.log(weapon);
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
      const weaponInfoList = getWeaponInfoList(avatarInfo?.equipList);

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
            ? getIconUrl(avatarBasicInfo?.Costumes?.[avatarInfo?.costumeId]?.icon)
            : getIconUrl(avatarBasicInfo?.SideIconName.replace(/_Side/g, "")),
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
  for (const avatar of avatarsInfo) {
    // console.log(avatar);
  }
};

main();
