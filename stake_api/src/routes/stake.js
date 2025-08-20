import express from "express";
import { stakeTokens, getStakeDetails } from "../controllers/stakeController.js";

const router = express.Router();

router.post("/stake", stakeTokens);
router.get("/getStakeDetails/:user", getStakeDetails);

export default router;
