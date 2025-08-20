import { useState, useEffect } from "react";
import { useStakeContract } from "../utils/contract";
import Loader from "../components/Loader";

export default function Governance() {
  const contract = useStakeContract();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);

  const fetchProposals = async () => {
    if (!contract) return;
    const ids = await contract.nextProposalId();
    const list = [];
    for (let i = 1; i <= ids; i++) {
      const prop = await contract.proposals(i);
      list.push(prop);
    }
    setProposals(list);
  };

  useEffect(() => {
    fetchProposals();
  }, [contract]);

  const handleCreateProposal = async () => {
    if (!contract || !description) return;
    setLoading(true);
    try {
      const tx = await contract.propose(description, 60); // 1 min voting
      await tx.wait();
      fetchProposals();
      setDescription("");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleVote = async (id: number, support: boolean) => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.vote(id, support);
      await tx.wait();
      fetchProposals();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Governance</h2>
      {loading && <Loader />}
      <div className="mb-4 flex space-x-2">
        <input 
          type="text" 
          placeholder="Proposal Description" 
          className="border p-2 rounded flex-1"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button className="bg-blue-600 text-white p-2 rounded" onClick={handleCreateProposal}>Create Proposal</button>
      </div>
      <div>
        {proposals.map((p, idx) => (
          <div key={idx} className="border p-3 rounded mb-2">
            <p><strong>ID:</strong> {p.id.toString()}</p>
            <p><strong>Description:</strong> {p.description}</p>
            <p><strong>For:</strong> {p.forVotes.toString()} | <strong>Against:</strong> {p.againstVotes.toString()}</p>
            <div className="flex space-x-2 mt-2">
              <button className="bg-green-600 text-white p-1 rounded" onClick={() => handleVote(p.id, true)}>Vote FOR</button>
              <button className="bg-red-600 text-white p-1 rounded" onClick={() => handleVote(p.id, false)}>Vote AGAINST</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
