import fs from "fs";
import path from "path";

import express from "express";
import nunjucks from "nunjucks";

const app = express();
const port = 3000;

nunjucks.configure("views");

app.engine("njk", nunjucks.render);
app.set("view engine", "njk");
app.use(express.static("public"));

const setupPagesRouting = (dir, route = "") => {
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

// pages

const pagesDir = path.join(process.cwd(), "views/pages");
setupPagesRouting(pagesDir);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
