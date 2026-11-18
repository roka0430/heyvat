import fs from "fs";
import path from "path";

import express from "express";
import nunjucks from "nunjucks";

import getProfile from "./modules/profile.js";
import settings from "./modules/settings.js";

const app = express();
const port = 3000;

nunjucks.configure("views");

app.engine("njk", nunjucks.render);
app.set("view engine", "njk");
app.use(express.static("public"));

app.use(async (req, res, next) => {
  try {
    res.locals.uid = await settings.get("uid");
    next();
  } catch (error) {
    next(error);
  }
});

const setupPagesRouting = async (dir, route = "") => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      setupPagesRouting(fullPath, `${route}/${entry.name}`);
    }

    if (entry.isFile() && entry.name === "index.njk") {
      app.get(route || "/", (req, res) => {
        const template = path
          .relative("views", fullPath)
          .replaceAll("\\", "/")
          .replace(/\.njk$/, "");

        res.render(template);
      });
    }
  }
};

// api

app.get("/api/backup", async (req, res) => {
  const content = fs.readFileSync("data/backup.json", "utf-8");
  const stored = JSON.parse(content);
  res.json(stored.data.avatarInfoList);
});

app.get("/api/profile", async (req, res) => {
  try {
    const uid = await settings.get("uid");
    const data = await getProfile(uid);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.get("/api/uid", async (req, res) => {
  try {
    const uid = await settings.get("uid");
    res.json({ uid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get uid" });
  }
});

app.put("/api/uid", async (req, res) => {
  try {
    const { uid } = req.body;
    await settings.set("uid", String(uid));
    res.json({ uid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update uid" });
  }
});

// pages

const pagesDir = path.join(process.cwd(), "views/pages");
setupPagesRouting(pagesDir);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
