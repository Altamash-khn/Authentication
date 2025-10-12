const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../data/database");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  res.render("signup");
});

router.get("/login", function (req, res) {
  res.render("login");
});

router.post("/signup", async function (req, res) {
  const { email, password } = req.body;
  const confirmPassword = req.body["confirm-email"];
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = { email, password: hashedPassword };

  await db.getDb().collection("users").insertOne(user);
  res.redirect("/login");
});

router.post("/login", async function (req, res) {
  const { email, password } = req.body;

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: email });

  if (!existingUser) {
    console.log("could not found");
    return res.redirect("/login");
  }

  const passwordCheck = await bcrypt.compare(password, existingUser.password);

  if (!passwordCheck) {
    console.log("password didn't matched");
    return res.redirect("/login");
  }

  console.log("user found");
  res.redirect('/admin')
});

router.get("/admin", function (req, res) {
  res.render("admin");
});

router.post("/logout", function (req, res) {});

module.exports = router;
