// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract StakeGovernance is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public stakingToken;

    struct Stake {
        uint256 amount;
        uint256 claimedReward;
        uint64 start;
        uint64 unlockAt;
    }

    struct Proposal {
        address proposer;      
        uint64  end;           
        bool    executed;
        uint256 id;
        uint256 forVotes;      
        uint256 againstVotes;  
        string  description; 
    }

    uint256 public constant APY = 500;          // 5% (500 basis points)
    uint256 public constant LOCK_PERIOD = 30 days;
    uint256 public constant BURN_BPS = 100;     // 1% burn of rewards
    uint256 public totalStaked;
    uint256 public nextProposalId;

    mapping(address => Stake[]) public userStakes;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event Staked(address indexed user, uint256 amount, uint256 unlockAt);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event Claimed(address indexed user, uint256 reward, uint256 burn);
    event ProposalCreated(uint256 id, address proposer, string description, uint256 end);
    event Voted(uint256 id, address voter, bool support, uint256 power);
    event ProposalExecuted(uint256 id, bool passed);

    constructor(IERC20 _stakingToken) Ownable(msg.sender) {
        require(address(_stakingToken) != address(0), "Invalid staking token");
        stakingToken = _stakingToken;
    }

    // ---------------- Stake Logic ----------------

    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot stake 0");
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);

        userStakes[msg.sender].push(Stake({
            amount: _amount,
            start: uint64(block.timestamp),
            unlockAt: uint64(block.timestamp + LOCK_PERIOD),
            claimedReward: 0
        }));

        totalStaked += _amount;
        emit Staked(msg.sender, _amount, block.timestamp + LOCK_PERIOD);
    }

    function unstake(uint256 index) external nonReentrant {
        require(index < userStakes[msg.sender].length, "Invalid index");

        Stake storage s = userStakes[msg.sender][index];
        require(block.timestamp >= s.unlockAt, "Stake locked");

        uint256 reward = _pendingReward(s);
        uint256 totalAmount = s.amount + reward;

        totalStaked -= s.amount;

        // delete stake by swapping last
        uint256 lastIndex = userStakes[msg.sender].length - 1;
        if (index != lastIndex) {
        userStakes[msg.sender][index] = userStakes[msg.sender][lastIndex];
        }
        userStakes[msg.sender].pop();

        stakingToken.safeTransfer(msg.sender, totalAmount);
        emit Unstaked(msg.sender, s.amount, reward);
    }


    function claimAllRewards() external nonReentrant {
        Stake[] storage stakes = userStakes[msg.sender];
        require(stakes.length > 0, "No stakes");

        uint256 totalReward;
        for (uint256 i = 0; i < stakes.length; i++) {
            uint256 reward = _pendingReward(stakes[i]);
            stakes[i].claimedReward += reward;
            totalReward += reward;
        }

        require(totalReward > 0, "No rewards");

        uint256 burn = (totalReward * BURN_BPS) / 10000;
        uint256 net = totalReward - burn;

        stakingToken.safeTransfer(address(0xdead), burn);
        stakingToken.safeTransfer(msg.sender, net);

        emit Claimed(msg.sender, net, burn);
    }

    function _pendingReward(Stake memory s) internal view returns (uint256) {
        if (s.amount == 0) return 0;
        uint256 elapsed = block.timestamp - s.start;
        uint256 grossReward = (s.amount * APY * elapsed) / (365 days * 10000);
        if (grossReward <= s.claimedReward) return 0;
        return grossReward - s.claimedReward;
    }

    function pendingReward(address _user) external view returns (uint256 total) {
        Stake[] memory stakes = userStakes[_user];
        for (uint256 i = 0; i < stakes.length; i++) {
            total += _pendingReward(stakes[i]);
        }
    }

    function votingPower(address _user) public view returns (uint256 power) {
        Stake[] memory stakes = userStakes[_user];
        for (uint256 i = 0; i < stakes.length; i++) {
            power += stakes[i].amount / 1e18; // 1 token = 1 vote
        }
    }

    // ---------------- Governance ----------------

    function propose(string calldata description, uint256 durationInMinutes) external returns (uint256) {
        require(votingPower(msg.sender) > 0, "No voting power");
        ++nextProposalId;
        proposals[nextProposalId] = Proposal({
            id: nextProposalId,
            proposer: msg.sender,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            end: uint64(block.timestamp + durationInMinutes * 60)
        });
        emit ProposalCreated(nextProposalId, msg.sender, description, block.timestamp + durationInMinutes * 60);
        return nextProposalId;
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp < p.end, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        uint256 power = votingPower(msg.sender);
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
