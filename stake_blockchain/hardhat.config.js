// require("@nomicfoundation/hardhat-toolbox");

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.27",
// };




require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");
require('dotenv').config();
const { ethers, JsonRpcProvider } = require("ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks:{
    bscTestnet: {
      chainId: 97,
      url: "https://bsc-testnet-rpc.publicnode.com",
      accounts: ["bfc8ad3aad0df2f0c6b12dd0b434a07631a3dd5ef138374371b7c10c8ee86a36"],
    },
    },
  }
  


  // Explorer URL -    https://devnet.taralscan.com/