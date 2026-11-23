import fs from "node:fs/promises";
import path, { format } from "node:path";

const fetchCanonicalResource = async (url) => {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (error) {
    console.log(error);
    return null;
  }
};

const updateLocalResource = async (filename, resource) => {
  const filepath = path.join("./resources", `${filename}.json`);
  const tempPath = `${filepath}.tmp`;

  try {
    const json = JSON.stringify(resource);

    await fs.writeFile(tempPath, json, "utf-8");
    await fs.rename(tempPath, filepath);

    return true;
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }
};

const refreshAvatars = async () => {
  const url = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/refs/heads/master/store/gi/avatars.json";
  const avatars = await fetchCanonicalResource(url);

  updateLocalResource("avatars", avatars);
};

const refreshCircleIcons = async () => {
  const url = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/refs/heads/master/store/gi/pfps.json";
  const circleIcons = await fetchCanonicalResource(url);

  const formattedCircleIcons = Object.fromEntries(
    Object.entries(circleIcons).map(([id, value]) => {
      return [id, value.IconPath.replace(/\/ui\/(.*)\.png/, "$1")];
    }),
  );

  updateLocalResource("circle_icons", formattedCircleIcons);
};

const refreshNameCards = async () => {
  const url = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/refs/heads/master/store/gi/namecards.json";
  const nameCards = await fetchCanonicalResource(url);

  const formattedNameCards = Object.fromEntries(
    Object.entries(nameCards).map(([id, value]) => {
      return [id, value.Icon.replace(/\/ui\/(.*)\.jpg/, "$1")];
    }),
  );

  updateLocalResource("namecards", formattedNameCards);
};

const refreshTextMap = async () => {
  const url = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/refs/heads/master/store/gi/locs.json";
  const textMap = await fetchCanonicalResource(url);

  const textMapJa = textMap.ja;
  const textMapEn = textMap.en;

  const formattedTextMap = Object.fromEntries(
    Object.entries(textMapJa).map(([id, ja]) => {
      return [id, { ja, en: textMapEn[id] }];
    }),
  );

  updateLocalResource("text_map", formattedTextMap);
};

const refreshRelics = async () => {
  const url = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/refs/heads/master/store/gi/relics.json";
  const artifacts = await fetchCanonicalResource(url);

  updateLocalResource("artifacts", artifacts);
};

const refreshWeapons = async () => {
  const url = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/refs/heads/master/store/gi/weapons.json";
  const weapons = await fetchCanonicalResource(url);

  updateLocalResource("weapons", weapons);
};

const refresh = async () => {
  await refreshAvatars();
  await refreshCircleIcons();
  await refreshNameCards();
  await refreshTextMap();
  await refreshRelics();
  await refreshWeapons();
};

const resources = {
  refresh,
};

export default resources;
