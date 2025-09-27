import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition-ethers";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Mainnets
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
      gas: "auto",
      gasPrice: "auto",
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon.llamarpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 137,
      gas: "auto",
      gasPrice: "auto",
    },
    base: {
      url: process.env.BASE_RPC_URL || "https://base.llamarpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
      gas: "auto",
      gasPrice: "auto",
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL || "https://arbitrum.llamarpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42161,
      gas: "auto",
      gasPrice: "auto",
    },
    optimism: {
      url: process.env.OPTIMISM_RPC_URL || "https://optimism.llamarpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 10,
      gas: "auto",
      gasPrice: "auto",
    },
    
    // Testnets
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.llamarpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gas: "auto",
      gasPrice: "auto",
    },
    polygonMumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://polygon-mumbai.llamarpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
      gas: "auto",
      gasPrice: "auto",
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://base-sepolia.llamarpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
      gas: "auto",
      gasPrice: "auto",
    },
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 421614,
      gas: "auto",
      gasPrice: "auto",
    },
    optimismSepolia: {
      url: process.env.OPTIMISM_SEPOLIA_RPC_URL || "https://sepolia.optimism.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155420,
      gas: "auto",
      gasPrice: "auto",
    },
  },
  
  // LayerZero configuration
  layerZero: {
    endpoint: {
      // Mainnet endpoints
      ethereum: "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675",
      polygon: "0x3c2269811836af69497E5F486A85D7316753cf62",
      base: "0xb6319cC6c8c27A8F5dAF0dD3DF3EA178459752B",
      arbitrum: "0x3c2269811836af69497E5F486A85D7316753cf62",
      optimism: "0x3c2269811836af69497E5F486A85D7316753cf62",
      
      // Testnet endpoints
      sepolia: "0x6EDCE65403992e310A62460808c4b8D0317C86De",
      polygonMumbai: "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8",
      baseSepolia: "0x6EDCE65403992e310A62460808c4b8D0317C86De",
      arbitrumSepolia: "0x6EDCE65403992e310A62460808c4b8D0317C86De",
      optimismSepolia: "0x6EDCE65403992e310A62460808c4b8D0317C86De",
    }
  },
  
  // Gas configuration
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  
  // Etherscan verification
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      base: process.env.BASESCAN_API_KEY || "",
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
      optimisticEthereum: process.env.OPTIMISTIC_ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
      optimisticSepolia: process.env.OPTIMISTIC_ETHERSCAN_API_KEY || "",
    },
  },
  
  // TypeChain configuration
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  
  // Test configuration
  mocha: {
    timeout: 40000,
  },
  
  // Gas reporter configuration
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 20,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  
  // Coverage configuration
  solidityCoverage: {
    enabled: process.env.COVERAGE !== undefined,
  },
};

export default config;