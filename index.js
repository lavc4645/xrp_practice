const mongoose = require("mongoose");
const express = require("express");
const bp = require("body-parser");

const app = express();
app.use(bp.json());
app.use(require("./route/route")); // Setting routes

app.get("/", (req, res) => {
  res.send({ msg: "Server ON" });
});

app.listen(4000, () => {
  console.log("Server connected ;)");
});
