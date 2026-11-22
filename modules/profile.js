import fs from "node:fs/promises";
import path from "node:path";

const STORED_FILE = path.join("data", "profile.json");

const pending = new Map();

const getIconUrl = (iconName) => {
  return `https://enka.network/ui/${iconName}.png`;
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

const readStoredProfile = async () => {
  try {
    const content = await fs.readFile(STORED_FILE, "utf-8");
    const stored = JSON.parse(content);

    if (Date.now() < stored.expiresAt) {
      return stored.data;
    }

    return null;
  } catch {
    return null;
  }
};

const writeStoredProfile = async (uid, data, ttl) => {
  const file = path.parse(STORED_FILE);
  const tempFile = path.format({ dir: file.dir, name: file.name, ext: ".tmp" });

  await fs.mkdir(path.dirname(STORED_FILE), { recursive: true });

  const stored = {
    uid,
    data,
    expiresAt: Date.now() + ttl,
  };

  await fs.writeFile(tempFile, JSON.stringify(stored), "utf-8");
  await fs.rename(tempFile, STORED_FILE);
};

const fetchWithCache = async (uid, url) => {
  const stored = await readStoredProfile();

  if (stored) {
    return stored;
  }

  if (pending.has(uid)) {
    return pending.get(uid);
  }

  const promise = (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Heyvat/1.0 (your-contact-or-project-url)",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      await writeStoredProfile(uid, data, data.ttl * 1000);

      return data;
    } finally {
      pending.delete(uid);
    }
  })();

  pending.set(uid, promise);

  return promise;
};

const getProfile = async (uid) => {
  const url = `https://enka.network/api/uid/${uid}/`;
  return await fetchWithCache(uid, url);
};

const getUserInfo = async (uid) => {
  try {
    const profile = await getProfile(uid);
    const playerInfo = profile.playerInfo;

    const namecards = await loadResource("namecards");
    const circle_icons = await loadResource("circle_icons");

    const nameCardUrl = getIconUrl(namecards[playerInfo.nameCardId]?.icon);
    const iconUrl = getIconUrl(circle_icons[playerInfo.profilePicture.id]);

    delete playerInfo.nameCardId;
    delete playerInfo.profilePicture;
    delete playerInfo.showNameCardIdList;
    delete playerInfo.showAvatarInfoList;

    return { ...playerInfo, nameCardUrl, iconUrl };
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

export default {
  getProfile,
  getUserInfo,
  getAvatarsInfo,
};
