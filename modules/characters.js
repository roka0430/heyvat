import fs from "node:fs/promises";

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
      const avatarId = avatarInfo?.avatarId;
      const avatarTextMapHash = avatars?.[avatarId]?.NameTextMapHash;
      const avatarNameJa = text_map?.[avatarTextMapHash];

      result.push({
        avatarId,
        avatarNameJa,
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
  console.log(avatarsInfo);
};

main();
