import fs from "node:fs/promises";
import path from "node:path";

const SETTINGS_FILE = path.join("data", "settings.json");

const read = async () => {
  const content = await fs.readFile(SETTINGS_FILE, "utf-8");
  return JSON.parse(content);
};

const write = async (settings) => {
  const content = JSON.stringify(settings, null, 2);
  await fs.writeFile(SETTINGS_FILE, content, "utf-8");
};

const settings = {
  async get(key) {
    const data = await read();
    return key ? data[key] : data;
  },

  async set(key, value) {
    const data = await read();
    data[key] = value;
    await write(data);
  },
};

export default settings;
