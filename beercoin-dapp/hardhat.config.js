require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    gnosis: {
      url: "https://rpc.gnosischain.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 100,
      gasPrice: 1000000000, // 1 gwei
    },
    chiado: {
      url: "https://rpc.chiadochain.net",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 10200,
      gasPrice: 1000000000, // 1 gwei
    }
  },
  etherscan: {
    apiKey: {
      gnosis: "api-key", // Not needed for verification but required by plugin
      chiado: "api-key"
    },
    customChains: [
      {
        network: "gnosis",
        chainId: 100,
        urls: {
          apiURL: "https://api.gnosisscan.io/api",
          browserURL: "https://gnosisscan.io/"
        }
      },
      {
        network: "chiado",
        chainId: 10200,
        urls: {
          apiURL: "https://gnosis-chiado.blockscout.com/api",
          browserURL: "https://gnosis-chiado.blockscout.com/"
        }
      }
    ]
  }
};

