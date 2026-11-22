import fs from "node:fs/promises";

const getIconUrl = (iconName) => {
  const formatted = iconName.replace(/\/ui\/(.*)\.png/g, "$1");
  return `https://enka.network/ui/${formatted}.png`;
};

const getProfile = async () => {
  try {
    const content = await fs.readFile("./data/backup.json", "utf-8");
    const backup = JSON.parse(content);
    return backup.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const loadResource = async (filename) => {
  try {
    const content = await fs.readFile(`./resources/${filename}.json`, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getAvatarsInfo = async (uid) => {
  try {
    const profile = await getProfile(uid);
    const avatarInfoList = profile.avatarInfoList;

    const avatars = await loadResource("avatars");
    const text_map = await loadResource("text_map");

    const result = [];

    for (const avatarInfo of avatarInfoList) {
      const avatar = avatars?.[avatarInfo?.avatarId];

      result.push({
        id: avatarInfo?.avatarId,
        name: text_map?.[avatar?.NameTextMapHash],
        element: avatar?.Element,
        level: avatarInfo?.propMap?.["4001"]?.val,
        consts: "talentIdList" in avatarInfo ? avatarInfo.talentIdList.length : 0,
        constsIcon: avatar?.Consts.map(getIconUrl),
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
          avatar?.SkillOrder.map((id) => {
            return [
              id,
              {
                icon: getIconUrl(avatar?.Skills?.[id]),
                level: avatarInfo?.skillLevelMap?.[id],
                extra: avatarInfo?.proudSkillExtraLevelMap?.[avatar?.ProudMap?.[id]] ?? 0,
              },
            ];
          }),
        ),
        quality: avatar?.QualityType,
        friendship: avatarInfo?.fetterInfo?.expLevel,
        icon:
          "costumeId" in avatarInfo
            ? getIconUrl(avatar?.Costumes?.[avatarInfo?.costumeId]?.icon)
            : getIconUrl(avatar?.SideIconName.replace(/_Side/g, "")),
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
    console.log(avatar);
  }
};

main();
