import { useState, useEffect } from "react";
import { useStakeContract } from "../utils/contract";
import Loader from "../components/Loader";
import { ethers } from "ethers";

export default function Dashboard() {
  const contract = useStakeContract();
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeIndex, setUnstakeIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState("0");
  const [reward, setReward] = useState("0");

  const fetchBalance = async () => {
    if (!contract) return;
    const signer = await contract.signer.getAddress();
    const bal = await contract.stakingToken.balanceOf(signer);
    setBalance(ethers.utils.formatUnits(bal, 18));
    const rewards = await contract.pendingReward(signer);
    setReward(ethers.utils.formatUnits(rewards, 18));
  };

  useEffect(() => {
    fetchBalance();
  }, [contract]);

  const handleStake = async () => {
    if (!contract || !stakeAmount) return;
    setLoading(true);
    try {
      const tx = await contract.stake(ethers.utils.parseUnits(stakeAmount, 18));
      await tx.wait();
      fetchBalance();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleUnstake = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.unstake(unstakeIndex);
      await tx.wait();
      fetchBalance();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleClaim = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.claimAllRewards();
      await tx.wait();
      fetchBalance();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Staking Dashboard</h2>
      {loading && <Loader />}
      <div className="mb-4">
        <p><strong>Balance:</strong> {balance} ST</p>
        <p><strong>Pending Rewards:</strong> {reward} ST</p>
      </div>
      <div className="flex space-x-2 mb-4">
        <input 
          type="number" 
          placeholder="Amount to stake" 
          className="border p-2 rounded"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
        />
        <button className="bg-blue-600 text-white p-2 rounded" onClick={handleStake}>Stake</button>
      </div>
      <div className="flex space-x-2 mb-4">
        <input 
          type="number" 
          placeholder="Stake Index to Unstake" 
          className="border p-2 rounded"
          value={unstakeIndex}
          onChange={(e) => setUnstakeIndex(Number(e.target.value))}
        />
        <button className="bg-red-600 text-white p-2 rounded" onClick={handleUnstake}>Unstake</button>
      </div>
      <button className="bg-green-600 text-white p-2 rounded" onClick={handleClaim}>Claim All Rewards</button>
    </div>
  );
}
