import express from "express";
import nunjucks from "nunjucks";

const app = express();
const port = 3000;

nunjucks.configure("views");

app.engine("njk", nunjucks.render);
app.set("view engine", "njk");
app.use(express.static("public"));

// pages

app.get("/", (req, res) => {
  res.render("pages/home/index");
});

app.get("/aaa", (req, res) => {
  res.render("pages/aaa/index");
});

app.get("/bbb", (req, res) => {
  res.render("pages/bbb/index");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
