import mongoose from "mongoose";

const proposalSchema = new mongoose.Schema({
  proposalId: { type: Number, required: true },
  description: { type: String, required: true },
  proposer: { type: String, required: true },
  votesFor: { type: String, default: "0" },
  votesAgainst: { type: String, default: "0" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Proposal", proposalSchema);
