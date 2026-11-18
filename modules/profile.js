import fs from "fs/promises";
import path from "path";

const CACHE_FILE = path.join("data", "cache", "profile.json");

const pending = new Map();

const readCache = async () => {
  try {
    const content = await fs.readFile(CACHE_FILE, "utf-8");
    const cache = JSON.parse(content);

    if (Date.now() < cache.expiresAt) {
      return cache.data;
    }

    return null;
  } catch {
    return null;
  }
};

const writeCache = async (uid, data, ttl) => {
  const file = path.parse(CACHE_FILE);
  const tempFile = path.format({ dir: file.dir, name: file.name, ext: ".tmp" });

  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });

  const cache = {
    uid,
    data,
    expiresAt: Date.now() + ttl,
  };

  await fs.writeFile(tempFile, JSON.stringify(cache), "utf-8");
  await fs.rename(tempFile, CACHE_FILE);
};

const fetchWithCache = async (uid, url) => {
  const cached = await readCache();

  if (cached) {
    return cached;
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

      await writeCache(uid, data, data.ttl * 1000);

      return data;
    } finally {
      pending.delete(uid);
    }
  })();

  pending.set(uid, promise);

  return promise;
};

export default function getProfile(uid) {
  const url = `https://enka.network/api/uid/${uid}/`;
  return fetchWithCache(uid, url);
}
