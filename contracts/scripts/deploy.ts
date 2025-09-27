import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying UniCore Protocol Contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // LayerZero endpoint addresses for different networks
  const layerZeroEndpoints: Record<string, string> = {
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

  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  const layerZeroEndpoint = layerZeroEndpoints[networkName];

  if (!layerZeroEndpoint) {
    throw new Error(`LayerZero endpoint not found for network: ${networkName}`);
  }

  console.log(`\n📡 Network: ${networkName} (Chain ID: ${network.chainId})`);
  console.log(`LayerZero Endpoint: ${layerZeroEndpoint}`);

  // Deploy ZKVerifier
  console.log("\n🔒 Deploying ZKVerifier...");
  const ZKVerifier = await ethers.getContractFactory("ZKVerifier");
  const zkVerifier = await ZKVerifier.deploy();
  await zkVerifier.waitForDeployment();
  const zkVerifierAddress = await zkVerifier.getAddress();
  console.log("ZKVerifier deployed to:", zkVerifierAddress);

  // Deploy SolverNetwork
  console.log("\n👥 Deploying SolverNetwork...");
  const SolverNetwork = await ethers.getContractFactory("SolverNetwork");
  
  // Use a mock ERC20 token for staking (in production, this would be a real token)
  const MockToken = await ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy("UniCore Token", "UCORE", ethers.parseEther("1000000"));
  await mockToken.waitForDeployment();
  const mockTokenAddress = await mockToken.getAddress();
  console.log("MockToken deployed to:", mockTokenAddress);

  const stakingAmount = ethers.parseEther("1000"); // 1000 tokens required to stake
  const solverNetwork = await SolverNetwork.deploy(mockTokenAddress, stakingAmount);
  await solverNetwork.waitForDeployment();
  const solverNetworkAddress = await solverNetwork.getAddress();
  console.log("SolverNetwork deployed to:", solverNetworkAddress);

  // Deploy UniCoreSwap
  console.log("\n🔄 Deploying UniCoreSwap...");
  const UniCoreSwap = await ethers.getContractFactory("UniCoreSwap");
  const uniCoreSwap = await UniCoreSwap.deploy(layerZeroEndpoint);
  await uniCoreSwap.waitForDeployment();
  const uniCoreSwapAddress = await uniCoreSwap.getAddress();
  console.log("UniCoreSwap deployed to:", uniCoreSwapAddress);

  // Configure contracts
  console.log("\n⚙️ Configuring contracts...");
  
  // Authorize UniCoreSwap to manage solvers
  await solverNetwork.authorizeSolver(uniCoreSwapAddress, true);
  console.log("Authorized UniCoreSwap as solver manager");

  // Set remote contracts for cross-chain communication
  // Note: In production, you would set these after deploying to all chains
  console.log("Cross-chain configuration will be set after deploying to all chains");

  // Print deployment summary
  console.log("\n✅ Deployment Summary:");
  console.log("======================");
  console.log(`Network: ${networkName} (${network.chainId})`);
  console.log(`ZKVerifier: ${zkVerifierAddress}`);
  console.log(`SolverNetwork: ${solverNetworkAddress}`);
  console.log(`UniCoreSwap: ${uniCoreSwapAddress}`);
  console.log(`MockToken: ${mockTokenAddress}`);
  console.log(`LayerZero Endpoint: ${layerZeroEndpoint}`);

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: network.chainId,
    contracts: {
      ZKVerifier: zkVerifierAddress,
      SolverNetwork: solverNetworkAddress,
      UniCoreSwap: uniCoreSwapAddress,
      MockToken: mockTokenAddress,
    },
    layerZeroEndpoint,
    timestamp: new Date().toISOString(),
  };

  console.log("\n📄 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Deploy to other chains (Base, Polygon, Arbitrum, Optimism)");
  console.log("2. Set remote contract addresses for cross-chain communication");
  console.log("3. Configure trusted remotes for LayerZero");
  console.log("4. Update frontend configuration with contract addresses");
  console.log("5. Test cross-chain functionality");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
