const mongoose = require("mongoose");

const VoteSchema = new mongoose.Schema(
  {
    proposalId:  { type: Number, required: true },
    voter: { type: String, required: true },
    support:{type: Boolean,require:true },
    power: { type: String, required: true },
    txHash: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vote", VoteSchema);
