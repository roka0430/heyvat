import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

const textMap = JSON.parse(fs.readFileSync("./resources/text_map.json", "utf-8"));
const characters = JSON.parse(fs.readFileSync("./resources/characters.json", "utf-8"));

export default function getCharacterDataByAvatarId(avatarId) {
  try {
    const character = characters[String(avatarId)];
    const name = textMap[String(character.NameTextMapHash)];
    return { ...character, NameJA: name };
  } catch (error) {
    console.error(error);
    return null;
  }
}
