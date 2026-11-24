import fs from "node:fs/promises";
import path from "node:path";

const STORED_FILE = path.join("data", "profile.json");

const pending = new Map();

const getIconUrl = (iconName) => {
  return `https://enka.network/ui/${iconName}.png`;
};

const loadData = async (uid, filename) => {
  const dirpath = path.join("./data/showcase", uid);
  const filepath = path.join(dirpath, `${filename}.json`);

  await fs.mkdir(dirpath, { recursive: true });

  try {
    const content = await fs.readFile(filepath, "utf-8");
    return JSON.parse(content) ?? {};
  } catch (error) {
    return {};
  }
};

const writeData = async (uid, filename, data) => {
  const dirpath = path.join("./data/showcase", uid);
  const filepath = path.join(dirpath, `${filename}.json`);
  const tempPath = `${filepath}.tmp`;

  await fs.mkdir(dirpath, { recursive: true });

  try {
    const json = JSON.stringify(data);

    await fs.writeFile(tempPath, json, "utf-8");
    await fs.rename(tempPath, filepath);

    return true;
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => {});
    throw error;
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

const readStoredProfile = async () => {
  try {
    const content = await fs.readFile(STORED_FILE, "utf-8");
    const stored = JSON.parse(content);
    return { data: stored.data, expiresAt: stored.expiresAt };
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
  const { data: stored, expiresAt } = await readStoredProfile();

  if (Date.now() < expiresAt) {
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
      return stored;
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

    const nameCardUrl = getIconUrl(namecards[playerInfo.nameCardId]);
    const iconUrl = getIconUrl(circle_icons[playerInfo.profilePicture.id]);

    delete playerInfo.nameCardId;
    delete playerInfo.profilePicture;
    delete playerInfo.showNameCardIdList;
    delete playerInfo.showAvatarInfoList;

    const userInfo = { ...playerInfo, nameCardUrl, iconUrl };
    await writeData(uid, "user", userInfo);

    return userInfo;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getCacheUserInfo = async (uid) => {
  return await loadData(uid, "user");
};

export default {
  getProfile,
  getUserInfo,
  getCacheUserInfo,
};
