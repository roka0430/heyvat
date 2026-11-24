import fs from "node:fs";
import path from "node:path";

import express from "express";
import nunjucks from "nunjucks";

import settings from "./modules/settings.js";
import resources from "./modules/resources.js";
import version from "./modules/version.js";
import profiles from "./modules/profile.js";
import simulator from "./modules/simulator.js";
import showcase from "./modules/showcase.js";

const app = express();
const port = 3000;

nunjucks.configure("views");

app.engine("njk", nunjucks.render);
app.set("view engine", "njk");
app.use(express.static("public"));
app.use(express.json());

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

app.post("/api/resources/refresh", async (req, res) => {
  try {
    await resources.refresh();
    return { message: "Resources update successfully" };
  } catch (error) {
    console.error(error);
    return { message: "Failed to update resources" };
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

  if (specifiedCount > 1) {
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

  try {
    const versionData = await version.getCurrentVersion();
    return res.json(versionData);
  } catch (error) {
    return res.status(400).json({
      error: "Failed to get current version",
    });
  }
});

app.get("/api/profile", async (req, res) => {
  try {
    const uid = await settings.get("uid");
    const data = await profiles.getProfile(uid);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.get("/api/user", async (req, res) => {
  try {
    const uid = await settings.get("uid");
    const data = await profiles.getUserInfo(uid);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

app.get("/api/user/events", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    const uid = await settings.get("uid");

    const cacheUserInfo = await profiles.getCacheUserInfo(uid);
    res.write(`event: cache\n`);
    res.write(`data: ${JSON.stringify(cacheUserInfo)}\n\n`);

    const userInfo = await profiles.getUserInfo(uid);
    res.write(`event: update\n`);
    res.write(`data: ${JSON.stringify(userInfo)}\n\n`);
  } catch (error) {
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: "Failed to update user info" })}\n\n`);
  } finally {
    res.end();
  }
});

app.get("/api/characters", async (req, res) => {
  try {
    const { showcase: showcaseOnly = false } = req.query;
    const uid = await settings.get("uid");
    const data = await showcase.getCharacters(uid, showcaseOnly);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get characters" });
  }
});

app.get("/api/characters/events", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const { showcase: showcaseOnly = false } = req.query;

  try {
    const uid = await settings.get("uid");

    const cacheCharacters = await showcase.getCacheCharacters(uid, showcaseOnly);
    res.write(`event: cache\n`);
    res.write(`data: ${JSON.stringify(cacheCharacters)}\n\n`);

    const characters = await showcase.getCharacters(uid, showcaseOnly);
    res.write(`event: update\n`);
    res.write(`data: ${JSON.stringify(characters)}\n\n`);
  } catch (error) {
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: "failed to update characters" })}\n\n`);
  } finally {
    res.end();
  }
});

app.get("/api/artifacts", async (req, res) => {
  try {
    const uid = await settings.get("uid");
    const data = await showcase.getArtifacts(uid);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get artifacts" });
  }
});

app.get("/api/artifacts/events", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    const uid = await settings.get("uid");

    const cacheArtifacts = await showcase.getCacheArtifacts(uid);
    res.write(`event: cache\n`);
    res.write(`data: ${JSON.stringify(cacheArtifacts)}\n\n`);

    const artifacts = await showcase.getArtifacts(uid);
    res.write(`event: update\n`);
    res.write(`data: ${JSON.stringify(artifacts)}\n\n`);
  } catch (error) {
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: "failed to update artifacts" })}\n\n`);
  } finally {
    res.end();
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

app.post("/api/simulate", async (req, res) => {
  try {
    const { pullsList, target, guaranteed = false } = req.body;
    const maxPulls = Math.max(...pullsList);

    const probabilities = simulator.calculateProbabilities(maxPulls, target, { guaranteed });

    const probabilitiesEntries = pullsList.map((pulls) => [
      pulls,
      pulls < probabilities.length ? probabilities[pulls] : 1,
    ]);

    res.json(Object.fromEntries(probabilitiesEntries));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to simulate" });
  }
});

// pages

const pagesDir = path.join(process.cwd(), "views/pages");
setupPagesRouting(pagesDir);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
