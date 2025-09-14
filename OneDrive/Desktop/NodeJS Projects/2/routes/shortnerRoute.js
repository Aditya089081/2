import express from "express";
import {
  renderHome,
  handleShortner,
  handleRedirect,
  getMe,
} from "../controller/shortnerController.js";
import { restrictToLoggedInOnly } from "../middleware/auth.js";
import { deleteLink, getEdit, postEdit } from "../controller/editController.js";
import { getVerifyEmail, sendVaridicationLink,verifyCode } from "../controller/verify.js";

const router = express.Router();

router.route("/edit/:id").get(getEdit).post(postEdit);
router.route("/delete/:id").post(deleteLink);
router.get("/",renderHome);
router.post("/shorten", handleShortner);
router.get("/profile", getMe);
router.get("/profile/verify/email",getVerifyEmail);
router.post("/profile/varify/email/send-code",sendVaridicationLink);
router.get("/profile/varify/email/verify-code",verifyCode);
router.get("/:shortId", handleRedirect);

export default router;
