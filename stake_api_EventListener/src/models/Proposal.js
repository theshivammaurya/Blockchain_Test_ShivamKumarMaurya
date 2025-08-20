// models/Proposal.js
const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema({
  proposalId: { type: Number, required: true },
  proposer: { type: String, required: true },
  description: { type: String, required: true },
  end: { type: Number, required: true },
  txHash: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Proposal", proposalSchema);
