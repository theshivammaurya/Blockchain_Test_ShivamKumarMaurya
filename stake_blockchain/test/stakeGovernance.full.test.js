const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakeGovernance - Full Flow Test", function () {
  let rewardToken, staking;
  let owner, shubham, shivam;

  beforeEach(async function () {
    [owner, shubham, shivam] = await ethers.getSigners();

    // Deploy a  reward token
    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy("StakingToken", "ST");
    await rewardToken.waitForDeployment();

    // Deploy the staking governance contract
    const StakeGovernance = await ethers.getContractFactory("StakeGovernance");
    staking = await StakeGovernance.deploy(await rewardToken.getAddress());
    await staking.waitForDeployment();

    // Fund the staking contract with rewards
    const rewardPool = ethers.parseUnits("10000", 18);
    await rewardToken.transfer(await staking.getAddress(), rewardPool);

    // Fund users so they can stake
    const initialAmount = ethers.parseUnits("1000", 18);
    await rewardToken.transfer(shubham.address, initialAmount);
    await rewardToken.transfer(shivam.address, initialAmount);

    // Users approve staking contract to spend their tokens
    await rewardToken.connect(shubham).approve(await staking.getAddress(), initialAmount);
    await rewardToken.connect(shivam).approve(await staking.getAddress(), initialAmount);
  });

  it("should handle multiple stakes, unstake, proposals, and reward claim", async function () {
    console.log("\n--- STAKING PHASE ---");

    const stakeShubham1 = ethers.parseUnits("100", 18);
    const stakeShubham2 = ethers.parseUnits("150", 18);
    const stakeShivam = ethers.parseUnits("200", 18);

    // Shubham stakes first batch
    const tx1 = await staking.connect(shubham).stake(stakeShubham1);
    console.log("Shubham staked 100 tokens, tx:", tx1.hash);
    await tx1.wait();

    // Shubham stakes second batch
    const tx2 = await staking.connect(shubham).stake(stakeShubham2);
    console.log("Shubham staked 150 tokens, tx:", tx2.hash);
    await tx2.wait();

    // Shivam stakes
    const tx3 = await staking.connect(shivam).stake(stakeShivam);
    console.log("Shivam staked 200 tokens, tx:", tx3.hash);
    await tx3.wait();

    // Fast forward 30 days to unlock stakes
    const thirtyDays = 30 * 24 * 60 * 60;
    await ethers.provider.send("evm_increaseTime", [thirtyDays]);
    await ethers.provider.send("evm_mine");

    // Shubham unstakes his first stake
    const txUnstake = await staking.connect(shubham).unstake(0);
    console.log("Shubham unstaked first stake, tx:", txUnstake.hash);
    await txUnstake.wait();

    console.log("\n--- GOVERNANCE PHASE ---");

    // Create two proposals
    const durationMinutes = 1; // 1 minute voting window for testing

    const txProp1 = await staking.connect(shubham).propose("Increase APY", durationMinutes);
    const proposalId1 = (await staking.nextProposalId()).toString();
    console.log("Proposal 1 created (Increase APY), tx:", txProp1.hash, "id:", proposalId1);

    const txProp2 = await staking.connect(shivam).propose("Decrease APY", durationMinutes);
    const proposalId2 = (await staking.nextProposalId()).toString();
    console.log("Proposal 2 created (Decrease APY), tx:", txProp2.hash, "id:", proposalId2);

    // Voting: Proposal 1 should pass
    const vote1 = await staking.connect(shubham).vote(proposalId1, true);
    console.log("Shubham voted FOR proposal 1, tx:", vote1.hash);
    await vote1.wait();

    const vote2 = await staking.connect(shivam).vote(proposalId1, true);
    console.log("Shivam voted FOR proposal 1, tx:", vote2.hash);
    await vote2.wait();

    // Voting: Proposal 2 should be rejected
    const vote3 = await staking.connect(shubham).vote(proposalId2, false);
    console.log("Shubham voted AGAINST proposal 2, tx:", vote3.hash);
    await vote3.wait();

    const vote4 = await staking.connect(shivam).vote(proposalId2, false);
    console.log("Shivam voted AGAINST proposal 2, tx:", vote4.hash);
    await vote4.wait();

    // Move time forward past voting period
    const twoMinutes = 2 * 60;
    await ethers.provider.send("evm_increaseTime", [twoMinutes]);
    await ethers.provider.send("evm_mine");

    // Execute proposals
    const exec1 = await staking.execute(proposalId1);
    await exec1.wait();
    const prop1 = await staking.proposals(proposalId1);
    console.log("Executed proposal 1, passed:", prop1.forVotes > prop1.againstVotes);

    const exec2 = await staking.execute(proposalId2);
    await exec2.wait();
    const prop2 = await staking.proposals(proposalId2);
    console.log("Executed proposal 2, passed:", prop2.forVotes > prop2.againstVotes);

    console.log("\n--- REWARD CLAIM PHASE ---");

    // Shubham claims his rewards
    const beforeClaim = await rewardToken.balanceOf(shubham.address);
    console.log("Shubham balance before reward claim:", beforeClaim.toString());

    const claimTx = await staking.connect(shubham).claimAllRewards();
    console.log("Shubham claimed rewards, tx:", claimTx.hash);
    await claimTx.wait();

    const afterClaim = await rewardToken.balanceOf(shubham.address);
    console.log("Shubham balance after reward claim:", afterClaim.toString());

    // ===== ASSERTIONS =====
    expect(afterClaim > beforeClaim).to.be.true;
    expect(prop1.forVotes > prop1.againstVotes).to.be.true; // Proposal 1 passed
    expect(prop2.againstVotes > prop2.forVotes).to.be.true; // Proposal 2 rejected

    // Final balances for logging
    const contractBalance = await rewardToken.balanceOf(await staking.getAddress());
    console.log("\nFinal contract balance:", contractBalance.toString());
    console.log("Shubham final balance:", afterClaim.toString());
    console.log("Shivam final balance:", (await rewardToken.balanceOf(shivam.address)).toString());
  });
});
