import mongoose from "mongoose";

const stakeSchema = new mongoose.Schema({
  user: { type: String, required: true },
  amount: { type: String, required: true },
  rewards: { type: String, default: "0" },
  rewardClaim: { type: String, default: "0" },
  votingPower: { type: String, default: "0" },
  lastStakeTime: { type: Date, default: null },
  unlockAt: { type: Date, default: null },
  approveTxHash: { type: String, default: null },
  stakeTxHash: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Stake", stakeSchema);
