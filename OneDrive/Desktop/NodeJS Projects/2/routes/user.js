import express from "express";
import { handleUserLogin, handleUserSignUp } from "../controller/user.js";
import { getGoogleLoginCallback, getGoogleLoginPage } from "../controller/google.js";


const router = express.Router();

router.get("/register", (req, res) => {
  res.render("register", { errors: req.flash("errors") });
});

router.get("/login", (req, res) => {
  res.render("login", { errors: req.flash("errors") });
});

router.post("/register", handleUserSignUp);
router.post("/login", handleUserLogin);
router.route("/google").get(getGoogleLoginPage);
router.route("/google/callback").get(getGoogleLoginCallback);
export default router;
