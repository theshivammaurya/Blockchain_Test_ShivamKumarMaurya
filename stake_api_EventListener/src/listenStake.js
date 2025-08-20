const { ethers } = require("ethers");
require("dotenv").config();
const mongoose = require("mongoose");
const ABI = require("./contractABI.json");
const EventModel = require("./models/Event");
const ProposalModel = require("./models/Proposal");
const VoteModel = require("./models/Vote");
const UserModel = require("./models/User");



const provider = new ethers.WebSocketProvider(process.env.WS_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new ethers.Contract(contractAddress, ABI, provider);

async function main() {
  //  Connect MongoDB first
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("MongoDB connected");

  console.log("Listening for Staked events...");

  contract.on("Staked", async (user, amount, unlockAt, event) => {
    try {
      console.log("New Stake Event");
      console.log("User:", user);
      console.log("Amount:", ethers.formatEther(amount));
      console.log("Unlock At:", unlockAt.toString());
      console.log("Tx:", event.log.transactionHash);

          await updateUserData(user);

      // 👇 Call pendingReward from contract
      let pendingReward;
      try {
        pendingReward = await contract.pendingReward(user);
        pendingReward = ethers.formatEther(pendingReward);
        console.log("Pending Reward:", pendingReward);
      } catch (err) {
        console.error("⚠️ Error calling pendingReward:", err.message);
        pendingReward = "0";
      }

      const newEvent = new EventModel({
        user,
        amount: ethers.formatEther(amount),
        unlockAt: new Date(Number(unlockAt) * 1000),
        votingPower: ethers.formatEther(amount),
        txHash: event.log.transactionHash,
        rewards: pendingReward, 
      });

      await newEvent.save();
      console.log("Event + Reward stored in DB");
      console.log("-------------------------------");
    } catch (err) {
      if (err.code === 11000) {
        console.log("Duplicate event (already saved)");
      } else {
        console.error("Error saving event:", err.message);
      }
    }
  });

  contract.on("ProposalCreated", async (id, proposer, description, end, event) => {
  try {
    console.log("📢 New Proposal Created");
    console.log("ID:", id.toString());
    console.log("Proposer:", proposer);
    console.log("Description:", description);
    console.log("End Time:", new Date(Number(end) * 1000));
    console.log("Tx:", event.log.transactionHash);

    const newProposal = new ProposalModel({
      proposalId: Number(id),
      proposer,
      description,
      end: new Date(Number(end) * 1000),
      txHash: event.log.transactionHash,
    });

    await newProposal.save();
    console.log("✅ Proposal stored in DB");
    console.log("-------------------------------");
  } catch (err) {
    if (err.code === 11000) {
      console.log(" Duplicate proposal (already saved)");
    } else {
      console.error(" Error saving proposal:", err.message);
    }
  }
  });

  contract.on("Voted", async (id, voter, support, power, event) => {
  try {
    console.log("New Vote Cast");
    console.log("Proposal ID:", id.toString());
    console.log("Voter:", voter);
    console.log("Support:", support);
    console.log("Power:", ethers.formatEther(power));
    console.log("Tx:", event.log.transactionHash);

    const newVote = new VoteModel({
      proposalId: Number(id),
      voter,
      support,
      power: power,
      txHash: event.log.transactionHash,
    });

    await newVote.save();
    console.log("Vote stored in DB");
    console.log("-------------------------------");
  } catch (err) {
    if (err.code === 11000) {
      console.log("Duplicate vote (already saved)");
    } else {
      console.error("Error saving vote:", err.message);
    }
  }
});


// also add Claimed listener
contract.on("Claimed", async (user, reward, burn, event) => {
  try {
    console.log("💰 Reward Claimed", user);

    await UserModel.findOneAndUpdate(
      { address: user },
      {
        $inc: {
          totalRewardClaimed: Number(ethers.formatEther(reward)),
        },
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("Error in Claimed handler:", err.message);
  }
});

}

async function updateUserData(userAddress) {
  try {
    // Fetch latest data from contract
    const votingPower = await contract.votingPower(userAddress);
    const pendingReward = await contract.pendingReward(userAddress);


    // Convert everything to Ether strings
    const rewardString = ethers.formatEther(pendingReward);

    await UserModel.findOneAndUpdate(
      { address: userAddress },
      {
        $set: {
          votingPower: votingPower,
          totalStakeAmount: votingPower,
          totalRewards: rewardString, 
        },
      },
      { upsert: true, new: true }
    );

    console.log(`User ${userAddress} updated in Ether units`);
  } catch (err) {
    console.error(" Error updating user data:", err.message);
  }
}




main().catch(console.error);
