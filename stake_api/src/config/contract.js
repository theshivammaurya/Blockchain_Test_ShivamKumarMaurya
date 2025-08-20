import { ethers } from "ethers";
import stakingABI from "../abi/Staking.json" assert { type: "json" };
import tokenAbi from "../abi/Token.json" assert { type: "json" };
import dotenv from "dotenv";
dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

export const staking = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  stakingABI,
  wallet
);

export const token = new ethers.Contract(process.env.TOKEN_ADDRESS, tokenAbi, wallet);


