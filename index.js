import express from "express";
import expressLayouts from "express-ejs-layouts";

const app = express();
const port = 3000;

app.set("view engine", "ejs");

app.use(expressLayouts);
app.use(express.static("public"));

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
