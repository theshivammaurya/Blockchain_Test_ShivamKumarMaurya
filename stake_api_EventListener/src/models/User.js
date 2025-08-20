const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    address: { type: String, unique: true },
    totalStakeAmount: { type: String, default: "0" },   // Ether as string
    votingPower: { type: String, default: "0" },        // Ether as string
    totalRewards: { type: String, default: "0" },       // Ether as string
    totalRewardClaimed: { type: String, default: "0" }, // Ether as string
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
