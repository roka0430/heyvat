import express from "express";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
