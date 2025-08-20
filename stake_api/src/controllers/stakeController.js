import Stake from "../models/Stake.js";
import { ethers } from "ethers";
import { token, staking } from "../config/contract.js";

// POST /stake
export const stakeTokens = async (req, res) => {
  try {
    const { user, amount } = req.body;
    if (!amount || !user) {
      return res.status(400).json({ error: "User and amount are required" });
    }

    // Parse amount to correct decimals
    const parsedAmount = ethers.parseEther(amount.toString());    

    // 1️⃣ Approve tokens first
    const tx1 = await token.approve(process.env.CONTRACT_ADDRESS, parsedAmount);
    await tx1.wait();

    // 2️⃣ Stake tokens
    const tx2 = await staking.stake(parsedAmount);
    await tx2.wait();

        const userInfo = await staking.userInfo(user);
       
      const stakeData = {
      user,
      amount: ethers.formatEther(userInfo.stakeAmount),
      rewards: ethers.formatEther(userInfo.rewards),
      rewardClaim: ethers.formatEther(userInfo.rewardClaim),
      votingPower: userInfo.votingPower,
      lastStakeTime: new Date(Number(userInfo.lastStakeTime) * 1000),
      unlockAt: new Date(Number(userInfo.unlockAt) * 1000),
      approveTxHash: tx1.hash,
      stakeTxHash: tx2.hash
    };
    // Save in DB
    const newStake = await Stake.create(stakeData);

    res.json({
      success: true,
      stake: newStake
    });
  } catch (error) {
    res.status(500).json({ error: error.reason || error.message });
  }
};

export const getStakeDetails = async (req, res) => {
  try {
    const { user } = req.params;

    // try {
    //   const claimTx = await staking.claimAllRewards({ from: user });
    //   await claimTx.wait();
    // } catch (claimError) {
    //   // If claim fails (e.g., 0 rewards), just log it
    //   console.log("Claim rewards skipped or failed:", claimError.reason || claimError.message);
    // }

    const userInfo = await staking.userInfo(user);

      const response = {
      user,
      amount: ethers.formatEther(userInfo.stakeAmount),
      rewards: ethers.formatEther(userInfo.rewards),
      rewardClaim: ethers.formatEther(userInfo.rewardClaim),
      votingPower: userInfo.votingPower.toString(), 
      lastStakeTime: new Date(Number(userInfo.lastStakeTime) * 1000),
      unlockAt: new Date(Number(userInfo.unlockAt) * 1000),
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.reason || error.message });
  }
};
