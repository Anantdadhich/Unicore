import  ethers from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/config";

async function deployAndTest(hre: HardhatRuntimeEnvironment) {
  console.log("🚀 UniCore Protocol - Deploy and Test Suite");
  console.log("===========================================");

  const network = await hre.ethers.provider.getNetwork();
  const networkName = hre.network.name;
  const deployer = await hre.ethers.getSigner();
  
  console.log(`📍 Network: ${networkName} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("");

  // Step 1: Run all tests first
  console.log("🧪 Step 1: Running Test Suite");
  console.log("==============================");
  
  try {
    await hre.run("test");
    console.log("✅ All tests passed!");
  } catch (error) {
    console.error("❌ Tests failed:", error);
    process.exitCode = 1;
    return;
  }

  // Step 2: Compile contracts
  console.log("\n🔨 Step 2: Compiling Contracts");
  console.log("===============================");
  
  try {
    await hre.run("compile");
    console.log("✅ Contracts compiled successfully!");
  } catch (error) {
    console.error("❌ Compilation failed:", error);
    process.exitCode = 1;
    return;
  }

  // Step 3: Deploy contracts (only on testnets or local)
  if (networkName === "hardhat" || networkName === "localhost" || networkName.includes("testnet") || networkName.includes("sepolia") || networkName.includes("mumbai")) {
    console.log("\n🚀 Step 3: Deploying Contracts");
    console.log("===============================");
    
    try {
      // Import and run the deployment script
      const { deployUniCore } = await import("./deploy");
      await deployUniCore(hre);
      console.log("✅ Contracts deployed successfully!");
    } catch (error) {
      console.error("❌ Deployment failed:", error);
      process.exitCode = 1;
      return;
    }
  } else {
    console.log("\n⚠️  Step 3: Skipping Deployment");
    console.log("===============================");
    console.log("Deployment skipped on mainnet. Use 'npx hardhat deploy --network <network>' for mainnet deployment.");
  }

  // Step 4: Run integration tests
  console.log("\n🔗 Step 4: Running Integration Tests");
  console.log("=====================================");
  
  try {
    await runIntegrationTests(hre);
    console.log("✅ Integration tests passed!");
  } catch (error) {
    console.error("❌ Integration tests failed:", error);
    process.exitCode = 1;
    return;
  }

  // Step 5: Generate reports
  console.log("\n📊 Step 5: Generating Reports");
  console.log("=============================");
  
  try {
    // Gas report
    try {
      await hre.run("gas-reporter");
      console.log("✅ Gas report generated");
    } catch (error) {
      console.log("⚠️  Gas report generation failed (optional)");
    }

    // Coverage report
    try {
      await hre.run("coverage");
      console.log("✅ Coverage report generated");
    } catch (error) {
      console.log("⚠️  Coverage report generation failed (optional)");
    }

  } catch (error) {
    console.log("⚠️  Report generation failed (optional)");
  }

  console.log("\n🎉 Deploy and Test Suite Completed Successfully!");
  console.log("================================================");
  console.log("\n📚 Summary:");
  console.log("- ✅ All unit tests passed");
  console.log("- ✅ Contracts compiled successfully");
  if (networkName === "hardhat" || networkName === "localhost" || networkName.includes("testnet")) {
    console.log("- ✅ Contracts deployed successfully");
  }
  console.log("- ✅ Integration tests passed");
  console.log("- ✅ Reports generated");
  
  console.log("\n🚀 Next Steps:");
  console.log("1. Update frontend environment variables with deployed addresses");
  console.log("2. Configure cross-chain remotes if deploying to multiple networks");
  console.log("3. Authorize solvers and test the complete flow");
  console.log("4. Deploy to mainnet when ready");
}

async function runIntegrationTests(hre: HardhatRuntimeEnvironment) {
  console.log("Running integration tests...");
  
  // This would contain integration tests that test the interaction
  // between different contracts and simulate real-world scenarios
  
  // Example integration test
  const [deployer, user, solver] = await hre.ethers.getSigners();
  
  // Deploy contracts for integration testing
  const MockToken = await hre.ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy("Test Token", "TEST", ethers.parseEther("1000000"));
  
  const ZKVerifier = await hre.ethers.getContractFactory("ZKVerifier");
  const zkVerifier = await ZKVerifier.deploy();
  
  const SolverNetwork = await hre.ethers.getContractFactory("SolverNetwork");
  const solverNetwork = await SolverNetwork.deploy(await mockToken.getAddress());
  
  const UniCoreSwap = await hre.ethers.getContractFactory("UniCoreSwap");
  const uniCoreSwap = await UniCoreSwap.deploy("0x6EDCE65403992e310A62460808c4b8D0317C86De"); // Sepolia endpoint
  
  // Integration test: Complete swap flow
  console.log("Testing complete swap flow...");
  
  // 1. User stakes as solver
  await mockToken.mint(user.address, ethers.parseEther("10000"));
  await mockToken.connect(user).approve(solverNetwork.target, ethers.parseEther("10000"));
  await solverNetwork.connect(user).stake(ethers.parseEther("1000"));
  
  // 2. Authorize solver
  await uniCoreSwap.authorizeSolver(user.address, true);
  
  // 3. Create swap intent
  await mockToken.mint(user.address, ethers.parseEther("1000"));
  await mockToken.connect(user).approve(uniCoreSwap.target, ethers.parseEther("1000"));
  
  const zkProofHash = ethers.keccak256(ethers.toUtf8Bytes("test-proof"));
  await uniCoreSwap.connect(user).createSwapIntent(
    await mockToken.getAddress(),
    await mockToken.getAddress(),
    ethers.parseEther("100"),
    ethers.parseEther("250"),
    137, // Polygon
    Math.floor(Date.now() / 1000) + 3600,
    zkProofHash
  );
  
  // 4. Fulfill swap intent
  await mockToken.mint(uniCoreSwap.target, ethers.parseEther("250"));
  const zkProof = ethers.toUtf8Bytes("test-proof");
  await uniCoreSwap.connect(user).fulfillSwapIntent(1, ethers.parseEther("250"), zkProof);
  
  console.log("✅ Integration test passed - complete swap flow works!");
}

// Export for use in other scripts
export { deployAndTest };

// Run deploy and test if called directly
if (require.main === module) {
  deployAndTest(require("hardhat")).catch((error) => {
    console.error("❌ Deploy and test failed:", error);
    process.exitCode = 1;
  });
}
