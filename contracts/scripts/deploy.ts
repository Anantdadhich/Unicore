import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// LayerZero endpoint addresses for different networks
const LZ_ENDPOINTS = {
  // Mainnets
  ethereum: "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675",
  polygon: "0x3c2269811836af69497E5F486A85D7316753cf62",
  base: "0xb6319cC6c8c27A8F5dAF0dD3DF3EA178459752B",
  arbitrum: "0x3c2269811836af69497E5F486A85D7316753cf62",
  optimism: "0x3c2269811836af69497E5F486A85D7316753cf62",
  
  // Testnets
  sepolia: "0x6EDCE65403992e310A62460808c4b8D0317C86De",
  polygonMumbai: "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8",
  baseSepolia: "0x6EDCE65403992e310A62460808c4b8D0317C86De",
  arbitrumSepolia: "0x6EDCE65403992e310A62460808c4b8D0317C86De",
  optimismSepolia: "0x6EDCE65403992e310A62460808c4b8D0317C86De",
};

interface DeploymentConfig {
  network: string;
  lzEndpoint: string;
  verifyContracts: boolean;
  saveAddresses: boolean;
}

async function main(hre: HardhatRuntimeEnvironment) {
  console.log("🚀 Starting UniCore Protocol Deployment");
  console.log("=====================================");

  const network = await hre.ethers.provider.getNetwork();
  const networkName = hre.network.name;
  const deployer = await hre.ethers.getSigner();
  
  console.log(`📍 Network: ${networkName} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("");

  // Get LayerZero endpoint for current network
  const lzEndpoint = LZ_ENDPOINTS[networkName as keyof typeof LZ_ENDPOINTS];
  if (!lzEndpoint) {
    throw new Error(`LayerZero endpoint not configured for network: ${networkName}`);
  }

  console.log(`🔗 LayerZero Endpoint: ${lzEndpoint}`);

  // Deploy MockToken for testing (skip on mainnets)
  let mockTokenAddress: string | undefined;
  if (networkName.includes("testnet") || networkName.includes("sepolia") || networkName.includes("mumbai")) {
    console.log("\n📝 Deploying MockToken for testing...");
    const MockToken = await hre.ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy(
      "UniCore Test Token",
      "UCT",
      ethers.parseEther("1000000")
    );
    await mockToken.waitForDeployment();
    mockTokenAddress = await mockToken.getAddress();
    console.log(`✅ MockToken deployed to: ${mockTokenAddress}`);
  }

  // Deploy ZKVerifier
  console.log("\n🔐 Deploying ZKVerifier...");
  const ZKVerifier = await hre.ethers.getContractFactory("ZKVerifier");
  const zkVerifier = await ZKVerifier.deploy();
  await zkVerifier.waitForDeployment();
  const zkVerifierAddress = await zkVerifier.getAddress();
  console.log(`✅ ZKVerifier deployed to: ${zkVerifierAddress}`);

  // Deploy SolverNetwork
  console.log("\n🤖 Deploying SolverNetwork...");
  const SolverNetwork = await hre.ethers.getContractFactory("SolverNetwork");
  const solverNetwork = await SolverNetwork.deploy(
    mockTokenAddress || ethers.getAddress("0x0000000000000000000000000000000000000000")
  );
  await solverNetwork.waitForDeployment();
  const solverNetworkAddress = await solverNetwork.getAddress();
  console.log(`✅ SolverNetwork deployed to: ${solverNetworkAddress}`);

  // Deploy UniCoreSwap
  console.log("\n💱 Deploying UniCoreSwap...");
  const UniCoreSwap = await hre.ethers.getContractFactory("UniCoreSwap");
  const uniCoreSwap = await UniCoreSwap.deploy(lzEndpoint);
  await uniCoreSwap.waitForDeployment();
  const uniCoreSwapAddress = await uniCoreSwap.getAddress();
  console.log(`✅ UniCoreSwap deployed to: ${uniCoreSwapAddress}`);

  // Configure contracts
  console.log("\n⚙️  Configuring contracts...");

  // Authorize deployer as solver (for testing)
  if (networkName.includes("testnet") || networkName.includes("sepolia") || networkName.includes("mumbai")) {
    console.log("🔑 Authorizing deployer as solver...");
    await uniCoreSwap.authorizeSolver(deployer.address, true);
    console.log("✅ Deployer authorized as solver");
  }

  // Set remote contracts (example for Polygon)
  if (networkName === "sepolia") {
    console.log("🌐 Setting up cross-chain configuration...");
    const polygonRemoteAddress = ethers.getAddress("0x1234567890123456789012345678901234567890"); // Replace with actual Polygon contract address
    await uniCoreSwap.setRemoteContract(137, polygonRemoteAddress);
    console.log("✅ Remote contract set for Polygon");
  }

  // Verify contracts on Etherscan (if configured)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: zkVerifierAddress,
        constructorArguments: [],
      });
      console.log("✅ ZKVerifier verified");
    } catch (error) {
      console.log("⚠️  ZKVerifier verification failed:", error);
    }

    try {
      await hre.run("verify:verify", {
        address: solverNetworkAddress,
        constructorArguments: [mockTokenAddress || ethers.getAddress("0x0000000000000000000000000000000000000000")],
      });
      console.log("✅ SolverNetwork verified");
    } catch (error) {
      console.log("⚠️  SolverNetwork verification failed:", error);
    }

    try {
      await hre.run("verify:verify", {
        address: uniCoreSwapAddress,
        constructorArguments: [lzEndpoint],
      });
      console.log("✅ UniCoreSwap verified");
    } catch (error) {
      console.log("⚠️  UniCoreSwap verification failed:", error);
    }
  }

  // Save deployment addresses
  const deploymentInfo = {
    network: networkName,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      zkVerifier: zkVerifierAddress,
      solverNetwork: solverNetworkAddress,
      uniCoreSwap: uniCoreSwapAddress,
      ...(mockTokenAddress && { mockToken: mockTokenAddress })
    },
    layerZeroEndpoint: lzEndpoint
  };

  console.log("\n📋 Deployment Summary");
  console.log("====================");
  console.log(`Network: ${networkName}`);
  console.log(`Chain ID: ${network.chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`ZKVerifier: ${zkVerifierAddress}`);
  console.log(`SolverNetwork: ${solverNetworkAddress}`);
  console.log(`UniCoreSwap: ${uniCoreSwapAddress}`);
  if (mockTokenAddress) {
    console.log(`MockToken: ${mockTokenAddress}`);
  }
  console.log(`LayerZero Endpoint: ${lzEndpoint}`);

  // Save to file
  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Generate environment variables for frontend
  console.log("\n🔧 Environment Variables for Frontend:");
  console.log("=====================================");
  console.log(`NEXT_PUBLIC_ZK_VERIFIER_ADDRESS=${zkVerifierAddress}`);
  console.log(`NEXT_PUBLIC_SOLVER_NETWORK_ADDRESS=${solverNetworkAddress}`);
  console.log(`NEXT_PUBLIC_UNICORE_SWAP_ADDRESS=${uniCoreSwapAddress}`);
  if (mockTokenAddress) {
    console.log(`NEXT_PUBLIC_MOCK_TOKEN_ADDRESS=${mockTokenAddress}`);
  }
  console.log(`NEXT_PUBLIC_${networkName.toUpperCase()}_RPC_URL=<your_rpc_url>`);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📚 Next Steps:");
  console.log("1. Update your frontend .env.local with the contract addresses");
  console.log("2. Configure cross-chain remotes if deploying to multiple networks");
  console.log("3. Authorize additional solvers as needed");
  console.log("4. Test the contracts with the provided test suite");
}

// Export for use in other scripts
export { main as deployUniCore };

// Run deployment if called directly
if (require.main === module) {
  main(require("hardhat")).catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
  });
}