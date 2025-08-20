# NOTE
Note 1: Instead of creating POST APIs to call blockchain functions through the backend and storing data in the database, we can simply use an event listener in the backend to store data OFFCHAIN in the database. The smart contract can then be directly bound with the frontend using Wagmi to call the functions.

Note 2: A sample folder of code is provided demonstrating how to use event listeners to achieve this. Through events emitted by the smart contract, we can automatically capture and store data in the database without calling the contract functions via backend APIs.

# ------------------------------------ POST and GET API ---------------------------------------------------

# Staking & Governance API

This is a Node.js + Express API for a staking and governance system on Ethereum.
It allows users to stake tokens, create proposals, and vote on proposals. Data is stored in MongoDB.

---

## **Prerequisites**

* Node.js >= 18
* MongoDB running locally or remotely
* `.env` file with your configuration:

```env
PORT=5000
MONGO_URI=mongodb+srv://shivam05046:463urL3iWzyYQbPT@cluster0.afevocb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
RPC_URL=https://bsc-testnet-rpc.publicnode.com
WS_URL= wss://bsc-testnet-rpc.publicnode.com
PRIVATE_KEY=bfc8ad3aad0df2f0c6b12dd0b434a07631a3dd5ef138374371b7c10c8ee86a36
CONTRACT_ADDRESS=0xdEc7f926b99c741D10594bc10AC62F5CAbf7BF72
TOKEN_ADDRESS=0xa1792630C4BC581CADCcDCd946C1baA169c693f2


```

* Install dependencies:

```bash
npm install
```

---

## **Run the Server**

```bash
npm run dev
```

Server will run at `http://localhost:5000`

---

## **API Endpoints**

### 1. **Stake Tokens**

* **URL:** `/api/stake`
* **Method:** `POST`
* **Body Parameters:**

```json
{
  "user": "0x52FB68387a96702A48f279438e951948Eb2224e7",
  "amount": "10"
}
```

* **Curl Example:**

```bash
curl -X POST http://localhost:5000/api/stake \
  -H "Content-Type: application/json" \
  -d '{
    "user": "0x52FB68387a96702A48f279438e951948Eb2224e7",
    "amount": "10"
  }'
```

* **Get Stake Details:**

```
http://localhost:5000/api/getStakeDetails/0x52FB68387a96702A48f279438e951948Eb2224e7
```

---

### 2. **Create Proposal**

* **URL:** `/api/propose`
* **Method:** `POST`
* **Body Parameters:**

```json
{
  "description": "Increase staking rewards by 10%",
  "durationInMinutes": 60,
  "proposer": "0x52FB68387a96702A48f279438e951948Eb2224e7"
}
```

* **Curl Example:**

```bash
curl -X POST http://localhost:5000/api/propose \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Increase staking rewards by 10%",
    "durationInMinutes": 60,
    "proposer": "0x52FB68387a96702A48f279438e951948Eb2224e7"
  }'
```

---

### 3. **Vote on Proposal**

* **URL:** `/api/vote/:proposalId`
* **Method:** `POST`
* **Body Parameters:**

```json
{
  "voter": "0x52FB68387a96702A48f279438e951948Eb2224e7",
  "support": true
}
```

* **Parameters:**

  * `proposalId` → ID of the proposal to vote for
  * `voter` → Ethereum address of the voter
  * `support` → `true` for vote in favor, `false` for against

* **Curl Example:**

```bash
curl -X POST http://localhost:5000/api/vote/1 \
  -H "Content-Type: application/json" \
  -d '{
    "voter": "0x52FB68387a96702A48f279438e951948Eb2224e7",
    "support": true
  }'
```

---

## **Notes**

* Proposal votes (`votesFor` / `votesAgainst`) are counted using **voting power** from the `Stake` table.
* Ensure `voter` exists in the Stake table before voting.
* MongoDB collections used:

  * `Stake` → stores user stakes and voting power
  * `Proposal` → stores proposals and total votes
  * `Vote` → stores individual votes with power and transaction hash

---

## **Folder Structure**

```
├── src/
│   ├── controllers/
│   │   ├── stakeController.js
│   │   └── governanceController.js
│   ├── models/
│   │   ├── Stake.js
│   │   ├── Proposal.js
│   │   └── Vote.js
│   ├── routes/
│   │   ├── stakeRoutes.js
│   │   └── governanceRoutes.js
│   └── index.js
├── package.json
├── .env
└── README.md
```

---

## **Start the App**

```bash
npm install
npm npm run dev
```

Server will start at `http://localhost:5000`
