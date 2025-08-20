import express from "express";
import { propose, voteProposal } from "../controllers/governanceController.js";

const router = express.Router();

router.post("/propose", propose);
router.post("/vote/:proposalId", voteProposal);

export default router;
