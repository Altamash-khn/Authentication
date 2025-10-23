  const express = require("express");
  const bcrypt = require("bcryptjs");

  const db = require("../data/database");
  const { ObjectId } = require("mongodb");

  const router = express.Router();

  router.get("/", function (req, res) {
    res.render("welcome");
  });

  router.get("/signup", function (req, res) {
    let sessionInputData = req.session.inputData;

    if (!sessionInputData) {
      sessionInputData = {
        hasError: false,
        email: "",
        confirmEmail: "",
        password: "",
      };
    }

    req.session.inputData = {};
    res.render("signup", { inputData: sessionInputData });
  });

  router.get("/login", function (req, res) {
    let sessionInputData = req.session.inputData;

    if (!sessionInputData) {
      sessionInputData = {
        hasError: false,
        email: "",
        password: "",
      };
    }

    req.session.inputData = {};

    res.render("login", { inputData: sessionInputData });
  });

  router.post("/signup", async function (req, res) {
    const { email, password } = req.body;
    const confirmEmail = req.body["confirm-email"];

    console.log(password < 6);

    if (
      !email ||
      !password ||
      !confirmEmail ||
      password.trim() < 6 ||
      email !== confirmEmail ||
      !confirmEmail.includes("@")
    ) {
      req.session.inputData = {
        hasError: true,
        message: "Invalid input - please check your data.",
        email: email,
        confirmEmail: confirmEmail,
        password: password,
      };
      req.session.save(function () {
        // return res.render("signup");
        return res.redirect("/signup");
      });
      return;
    }

    const existingUser = await db
      .getDb()
      .collection("users")
      .findOne({ email: email });

    if (existingUser) {
      req.session.inputData = {
        hasError: true,
        message: "User already exists",
        email: email,
        confirmEmail: confirmEmail,
        password: password,
      };
      req.session.save(function () {
        res.redirect("/signup");
      });
      return;
    }
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
      req.session.inputData = {
        hasError: true,
        message: "Could not login - check your credentials!",
        email: email,
        password: password,
      };
      req.session.save(function () {
        res.redirect("/login");
      });
      return;
    }

    const passwordCheck = await bcrypt.compare(password, existingUser.password);

    if (!passwordCheck) {
      req.session.inputData = {
        hasError: true,
        message: "Invalid input - please check your data.",
        email: email,
        password: password,
      };
      req.session.save(function () {
        res.redirect("/login");
      });
      return;
    }
    console.log("existingUser._id.toString()", existingUser._id.toString());
    console.log("existingUser", existingUser._id);

    req.session.user = {
      id: existingUser._id.toString(),
      email: existingUser.email,
    };
    req.session.isAuthenticated = true;

    req.session.save(function () {
      res.redirect("/profile");
    });
  });

  router.get("/admin", async function (req, res) {
    if (!req.session.isAuthenticated) {
      return res.status(401).render("401");
    }

    const user = await db
      .getDb()
      .collection("users")
      .findOne({ _id: ObjectId.createFromHexString(req.session.user.id) });
    console.log("user", user);

    if (!user || !user.isAdmin) {
      return res.status(403).render("403");
    }
    res.render("admin");
  });

  router.get("/profile", function (req, res) {
    if (!req.session.isAuthenticated) {
      return res.status(401).render("401");
    }

    res.render("profile");
  });

  router.post("/logout", function (req, res) {
    req.session.user = null;
    req.session.isAuthenticated = false;
    res.redirect("/");
  });

  module.exports = router;
