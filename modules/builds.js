import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

const textMap = JSON.parse(fs.readFileSync("./resources/text_map.json", "utf-8"));
const characters = JSON.parse(fs.readFileSync("./resources/characters.json", "utf-8"));

// TODO path変換していろいろするところから

const refreshResource = async (url, file) => {
  // console.log(path.join(...file.split("/")));

  console.log(path.parse(file));

  const tempPath = "./resources/characters.tmp.json";
  const filePath = "./resources/characters.json";

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`GitHub download failed: ${res.status}`);
    }

    const data = await res.json();

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Invalid characters data format");
    }

    await fsPromises.writeFile(tempPath, JSON.stringify(data), "utf-8");
    await fsPromises.rename(tempPath, filePath);

    return true;
  } catch (error) {
    console.error("Failed to refresh characters:", error);
    await fsPromises.rm(tempPath, { force: true }).catch(() => {});
    return false;
  }
};

const refreshResources = async () => {
  await refreshResource(
    "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/characters.json",
    "./resources/characters.json",
  );
};

const getCharacterDataByAvatarId = (avatarId) => {
  try {
    const character = characters[String(avatarId)];
    const name = textMap[String(character.NameTextMapHash)];
    return { ...character, NameJA: name };
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default {
  refreshResources,
  getCharacterDataByAvatarId,
};
