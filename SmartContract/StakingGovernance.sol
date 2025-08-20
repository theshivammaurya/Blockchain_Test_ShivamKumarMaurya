// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract StakeGovernance is Ownable,ReentrancyGuard  {
    using SafeERC20 for IERC20;
    IERC20 public stakingToken;

    
    struct UserInfo {
        uint256 stakeAmount;
        uint256 votingPower;
        uint256 rewards;               
        uint256 rewardClaim;
        uint256 lastStakeTime; 
        uint256 unlockAt;        
    }

     struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        uint256 end;
    }


    uint256 public constant APY = 500;        // 5% in basis points (10000 = 100%)
    uint256 public constant LOCK_PERIOD = 30 days;
    uint256 public constant REWARD_PERIOD = 365 days;
    uint256 public constant BURN_BPS = 100;      // 1% burn of rewards
    uint256 public totalStaked;
    uint256 public nextProposalId;


    mapping(address => UserInfo) public userInfo;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

  
    event stakeToken(address indexed user, uint256 indexed amount, uint256 indexed votingPower);
    event UnstakeToken( address indexed user, uint256 indexed amount, uint256 indexed reward);
    event claim(address indexed user, uint256 indexed amount, uint256 burn);
    event ProposalCreated(uint256 id, address proposer, string description, uint256 end);
    event Voted(uint256 id, address voter, bool support, uint256 power);
    event ProposalExecuted(uint256 id, bool passed);

    constructor(IERC20 _stakingToken) Ownable(msg.sender){
        require(address(_stakingToken) != address(0), "Invalid staking token");
        stakingToken = _stakingToken;
    }

    function emergencyRewardWithdraw(uint256 amount) external onlyOwner nonReentrant  {
        uint256 contractBalance = stakingToken.balanceOf(address(this));
        require(amount <= contractBalance, "Insufficient contract balance");
        stakingToken.safeTransfer(msg.sender, amount);
    }
   
    function stake(uint256 _amount) external nonReentrant  {
        require(_amount > 0 , "Cannot deposit zero");

        UserInfo storage user = userInfo[msg.sender];
        require(user.stakeAmount >0, "Cannot Stake more than one time");
        
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        totalStaked += _amount;

        user.stakeAmount = _amount;
        user.votingPower = user.stakeAmount ;
        user.lastStakeTime = block.timestamp;
        user.unlockAt = block.timestamp + LOCK_PERIOD ; 

        emit stakeToken(msg.sender, _amount, user.votingPower);
    }


    function Unstake() external nonReentrant {
       
        UserInfo storage user = userInfo[msg.sender];
        require(user.stakeAmount > 0, "You have no stake");
        require(block.timestamp >= user.unlockAt, "Amount is locked!");

        // Accumulate reward
        uint256 reward = pendingReward(msg.sender);
        user.rewards += reward;
        uint256 totalAmount = user.stakeAmount + reward;

        require(stakingToken.balanceOf(address(this)) >= totalAmount, "Contract Balance is Insufficient for WithdrawStake");

        user.stakeAmount = 0;
        user.votingPower = 0;
        user.rewardClaim += reward ;
        user.lastStakeTime = block.timestamp;

        stakingToken.safeTransfer(msg.sender, totalAmount);

        emit UnstakeToken(msg.sender, totalAmount- reward, reward);
    }

    function claimReward() external {
        UserInfo storage user = userInfo[msg.sender];

        uint256 reward = pendingReward(msg.sender);
        require(reward > 0, "no rewards");
        user.rewards = 0;

        uint256 burn = reward * BURN_BPS / 10000;
        uint256 net = reward - burn;

        stakingToken.safeTransfer(address(0xdead), burn);
        stakingToken.safeTransfer(msg.sender, net);

        emit claim(msg.sender, net , burn);
    }

    function pendingReward(address _user) public view returns (uint256) {
        UserInfo memory user = userInfo[_user];

        if (user.stakeAmount == 0 ) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - user.lastStakeTime;
        uint256 newReward = calculateReward(user.stakeAmount, timeElapsed);
        uint256 totalReward = user.rewards + newReward;

        return totalReward;
    }

    function calculateReward(uint256 _amount, uint256 _time) public pure returns (uint256) {
       //  return (_amount * APY * _time) / (365 days * 10000);

          return (_amount * APY * _time) / (60 minutes * 10000);
    }
 
    // ---------------- Governance Logic ----------------

   function propose(string calldata description, uint256 durationInMinutes) external returns (uint256) {
        require(userInfo[msg.sender].votingPower > 0, "No voting power");
        nextProposalId++;
        proposals[nextProposalId] = Proposal({
            id: nextProposalId,
            proposer: msg.sender,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            end: block.timestamp + durationInMinutes * 60
        });
        emit ProposalCreated(nextProposalId, msg.sender, description, block.timestamp + durationInMinutes * 60);
        return nextProposalId;
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp < p.end, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        uint256 power = userInfo[msg.sender].votingPower;
        require(power > 0, "No voting power");

        if (support) {
            p.forVotes += power;
        } else {
            p.againstVotes += power;
        }

        hasVoted[proposalId][msg.sender] = true;
        emit Voted(proposalId, msg.sender, support, power);
    }

    function execute(uint256 proposalId) external returns (bool) {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.end, "Voting not ended");
        require(!p.executed, "Already executed");

        p.executed = true;
        bool passed = p.forVotes > p.againstVotes;
        emit ProposalExecuted(proposalId, passed);
        return passed;
    }
}
