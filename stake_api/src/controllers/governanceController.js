import { token, staking } from "../config/contract.js";
import Proposal from "../models/Proposal.js";
import Vote from "../models/Vote.js";
import Stake from "../models/Stake.js";



// POST /propose
export const propose = async (req, res) => {
  try {
    const { description, durationInMinutes, proposer } = req.body;
    const tx = await staking.propose(description, durationInMinutes);
    const receipt = await tx.wait();

    const event = receipt.logs.find(l => l.fragment?.name === "ProposalCreated");
    const proposalId = event?.args?.id.toString();

    const newProposal = await Proposal.create({
      proposalId,
      description,
      proposer
    });

    res.json({ success: true, txHash: tx.hash, proposal: newProposal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const voteProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { support, voter } = req.body; // voter must be provided

    if (!voter) {
      return res.status(400).json({ error: "Voter address is required" });
    }

    // Get the voting power from Stake collection
    const stakeRecord = await Stake.findOne({ user: voter });
    const power = stakeRecord ? stakeRecord.votingPower : "0";

    // Call the smart contract vote
    const tx = await staking.vote(proposalId, support);
    await tx.wait();

    // Update the Proposal document
    const proposal = await Proposal.findOne({ proposalId });
    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    if (support) {
      proposal.votesFor = ((proposal.votesFor).toString() || 0) + power.toString();
    } else {
      proposal.votesAgainst = (proposal.votesAgainst || 0) + power;
    }

    await proposal.save();

    // Save the vote in the Vote collection
    const newVote = await Vote.create({
      proposalId: Number(proposalId),
      voter,   // entered by user
      support,
      power:power.toString(),   // fetched from Stake collection
      txHash: tx.hash,
    });

    res.json({ success: true, txHash: tx.hash, proposal, vote: newVote });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

