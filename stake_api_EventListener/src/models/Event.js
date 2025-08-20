// models/Event.js
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  user: { type: String, required: true },
  amount: { type: String, required: true }, 
  unlockAt: { type: Date, required: true },
  votingPower:{ type: String, required: true },
  rewards:{ type: String, required: true },
  txHash: { type: String, required: true, unique: true },
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
