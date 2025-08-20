# StakeGovernance - Token Staking & Governance

This project implements a reward-based token staking and governance system using **Hardhat**. Users can stake ERC20 tokens, earn rewards, create and vote on proposals, and claim rewards after a lock period.

---

## Features

* Stake ERC20 tokens and earn time-based rewards (APY).
* Unstake tokens after a 30-day lock period.
* Claim all accumulated rewards at once.
* Create and vote on governance proposals using stake-weighted voting.
* Secure contract using OpenZeppelin libraries (**ReentrancyGuard**, **SafeERC20**, **Ownable**).

---

## Steps to Run the Project

### 1. Clone the repository

```bash
git clone https://github.com/theshivammaurya/Blockchain_Test_ShivamKumarMaurya.git
```

### 2. Go to the project folder

```bash
cd stake_blockchain
```

### 3. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 4. Compile the smart contracts

```bash
npx hardhat compile
```

### 5. Deploy contracts

```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```


### 6. Run tests

```bash
npx hardhat test ```

> Tests cover multiple staking operations, governance proposals, voting, execution, and reward claiming. Transaction hashes are logged for reference.

---

## Test Flow Example

### Staking

* Shubham stakes 100 tokens, then 150 tokens.
* Shivam stakes 200 tokens.

### Unstaking

* Shubham unstakes the first stake.

### Governance

* Proposal 1 (Increase APY) → both vote **FOR** → passes.
* Proposal 2 (Decrease APY) → both vote **AGAINST** → rejected.

### Rewards

* Shubham claims all rewards.
* Balances checked before and after claiming.

---

## Notes

* Tests use Hardhat’s local EVM and time manipulation to simulate lock periods and voting windows.
* Ensure the staking contract has sufficient reward tokens before testing.
* Events provide transaction hashes for all actions.

---

## Acknowledgements

* OpenZeppelin for secure contracts.
* ChatGPT for meaningful comments.
