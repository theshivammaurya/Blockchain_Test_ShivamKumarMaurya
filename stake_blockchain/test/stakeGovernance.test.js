const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakeGovernance - Stake & Unstake", function () {
  let rewardToken, staking;
  let owner, shubham, shivam;

  beforeEach(async function () {
    [owner, shubham, shivam] = await ethers.getSigners();

    // Deploy  reward token
    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy("StakingToken", "ST");
    await rewardToken.waitForDeployment();

    // Deploy StakeGovernance contract
    const StakeGovernance = await ethers.getContractFactory("StakeGovernance");
    staking = await StakeGovernance.deploy(await rewardToken.getAddress());
    await staking.waitForDeployment();

    // Send some tokens to staking contract
    const rewardPool = ethers.parseUnits("10000", 18);
    await rewardToken.transfer(await staking.getAddress(), rewardPool);

    // Give Shubham and Shivam some tokens for testing
    const initialAmount = ethers.parseUnits("1000", 18);
    await rewardToken.transfer(shubham.address, initialAmount);
    await rewardToken.transfer(shivam.address, initialAmount);

    // Approve staking contract to spend their tokens
    await rewardToken.connect(shubham).approve(await staking.getAddress(), initialAmount);
    await rewardToken.connect(shivam).approve(await staking.getAddress(), initialAmount);
  });

  it("should allow Shubham to stake and unstake after lock period", async function () {
    const stakeAmount = ethers.parseUnits("100", 18);

    // Shubham stakes tokens
    const stakeTx = await staking.connect(shubham).stake(stakeAmount);
    console.log("Shubham stake tx:", stakeTx.hash);

    // Move time forward by 30 days (lock period)
    const thirtyDays = 30 * 24 * 60 * 60;
    await ethers.provider.send("evm_increaseTime", [thirtyDays]);
    await ethers.provider.send("evm_mine");

    // Shubham unstakes after lock period
    const unstakeTx = await staking.connect(shubham).unstake(0);
    console.log("Shubham unstake tx:", unstakeTx.hash);

    // Check balances after unstake
    const contractBalance = await rewardToken.balanceOf(await staking.getAddress());
    const shubhamBalance = await rewardToken.balanceOf(shubham.address);

    console.log("Contract balance after unstake:", contractBalance.toString());
    console.log("Shubham balance after unstake:", shubhamBalance.toString());

    // Shubham should have at least his original tokens back (plus any reward)
    expect(Number(shubhamBalance)).to.be.greaterThanOrEqual(Number(ethers.parseUnits("1000", 18)));

    // Contract should still have most of the reward pool left
    expect(Number(contractBalance)).to.be.greaterThanOrEqual(Number(ethers.parseUnits("9000", 18)));
  });

  it("should allow Shivam to stake multiple times", async function () {
    const stake1 = ethers.parseUnits("50", 18);
    const stake2 = ethers.parseUnits("75", 18);

    // Shivam stakes first amount
    await staking.connect(shivam).stake(stake1);

    // Shivam stakes again
    await staking.connect(shivam).stake(stake2);

    // Check contract balance after multiple stakes
    const contractBalance = await rewardToken.balanceOf(await staking.getAddress());
    console.log("Contract balance after Shivam stakes:", contractBalance.toString());

    // Contract balance should reflect Shivam’s total staked tokens
    expect(Number(contractBalance)).to.be.greaterThanOrEqual(Number(stake1 + stake2));
  });
});
