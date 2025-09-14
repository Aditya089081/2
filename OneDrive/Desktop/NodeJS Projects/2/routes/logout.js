import express from "express";
import { restrictToLoggedInOnly } from "../middleware/auth.js";
import { handleLogout } from "../controller/logout.js";

const router = express.Router();

router.get("/logout", handleLogout);

export default router;
