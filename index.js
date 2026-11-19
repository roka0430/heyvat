import fs from "node:fs";
import path from "node:path";

import express from "express";
import nunjucks from "nunjucks";

import settings from "./modules/settings.js";
import version from "./modules/version.js";
import profiles from "./modules/profile.js";
import builds from "./modules/builds.js";

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

app.post("/api/resources/refresh", async (req, res) => {});

app.get("/api/versions/current", async (req, res) => {
  try {
    const versions = await version.getCurrentVersion();
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: "Failed to get current version" });
  }
});

app.get("/api/versions", async (req, res) => {
  const { date, dateFrom, dateTo, version: versionValue, versionFrom, versionTo } = req.query;

  const conditions = {
    date: Boolean(date),
    dateRange: Boolean(dateFrom && dateTo),
    version: Boolean(versionValue),
    versionRange: Boolean(versionFrom && versionTo),
  };

  const specifiedCount = Object.values(conditions).filter(Boolean).length;

  if (specifiedCount !== 1) {
    return res.status(400).json({
      error: "Specify exactly one search condition",
    });
  }

  if (conditions.date) {
    try {
      const versionData = await version.getVersionByDate(date);
      return res.json(versionData);
    } catch (error) {
      return res.status(400).json({
        error: "Invalid date",
      });
    }
  }

  if (conditions.dateRange) {
    try {
      const versions = await version.getVersionsByDateRange(dateFrom, dateTo);
      return res.json(versions);
    } catch (error) {
      return res.status(400).json({
        error: "Invalid date range",
      });
    }
  }

  if (conditions.version) {
    try {
      const versionData = await version.getVersionByVersionName(versionValue);
      return res.json(versionData);
    } catch (error) {
      return res.status(400).json({
        error: "Invalid version",
      });
    }
  }

  if (conditions.versionRange) {
    try {
      const versions = await version.getVersionsByVersionRange(versionFrom, versionTo);
      return res.json(versions);
    } catch (error) {
      return res.status(400).json({
        error: "Invalid version range",
      });
    }
  }
});

app.get("/api/profile", async (req, res) => {
  try {
    const uid = await settings.get("uid");
    const data = await profiles.getProfiles(uid);
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
