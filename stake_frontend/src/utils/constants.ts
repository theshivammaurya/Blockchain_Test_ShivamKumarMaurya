import { STAKE_CONTRACT_ADDRESS, STAKE_CONTRACT_ABI } from "./constants";
import { useContract, useSigner } from "wagmi";

export const useStakeContract = () => {
  const { data: signer } = useSigner();
  return useContract({
    address: STAKE_CONTRACT_ADDRESS,
    abi: STAKE_CONTRACT_ABI,
    signerOrProvider: signer,
  });
};
