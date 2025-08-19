const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  try {
    // Get the contract factories
    const RewardToken = await hre.ethers.getContractFactory("RewardToken");
    const Staking = await hre.ethers.getContractFactory("StakeGovernance");

    // Deploy the RewardToken contract
    let rewardToken;
    try {
      rewardToken = await RewardToken.deploy("StarX", "STRX");
      await rewardToken.waitForDeployment();
      console.log("RewardToken deployed to:", rewardToken.target);
    } catch (error) {
      console.error("Error deploying RewardToken:", error);
      throw new Error("RewardToken deployment failed");
    }

    // Define deployment parameters
    const stakingTokenAddress = rewardToken.target;

    // Deploy the Staking contract
    let staking;
    try {
    staking = await Staking.deploy(stakingTokenAddress);
    await staking.waitForDeployment();
    console.log("Staking deployed to:", staking.target);
    } 
    catch (error) {
      console.error("Error deeploying StakingGovernance:", error);
      throw new Error("Staking contract deployment failed");
    }

    // Transfer tokens to the staking contract
    console.log("Transferings ST token to Staking contract... ");
    try {
      const transferAmount = hre.ethers.parseUnits("1000000000", 18); 
      const transferTx = await rewardToken.transfer(staking.target, transferAmount);
      await transferTx.wait();
      console.log(`Transferred ${hre.ethers.formatUnits(transferAmount, 18)} STRX to Staking contract`);
    } catch (error) {
      console.error("Error transferring RewardToken to staking contract:", error);
      throw new Error("Token transfer to staking contract failed");
    }

  } catch (error) {
    console.error("Deployment script failed:", error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exitCode = 1;
});