import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

async function runAllTests(hre: HardhatRuntimeEnvironment) {
  console.log("🧪 Running UniCore Protocol Test Suite");
  console.log("=====================================");

  const network = await hre.ethers.provider.getNetwork();
  const networkName = hre.network.name;
  
  console.log(`📍 Network: ${networkName} (Chain ID: ${network.chainId})`);
  console.log("");

  try {
    // Run individual test files
    console.log("🔍 Running UniCoreSwap tests...");
    await hre.run("test", { testFiles: ["test/UniCoreSwap.test.ts"] });
    console.log("✅ UniCoreSwap tests passed");

    console.log("\n🤖 Running SolverNetwork tests...");
    await hre.run("test", { testFiles: ["test/SolverNetwork.test.ts"] });
    console.log("✅ SolverNetwork tests passed");

    console.log("\n🔐 Running ZKVerifier tests...");
    await hre.run("test", { testFiles: ["test/ZKVerifier.test.ts"] });
    console.log("✅ ZKVerifier tests passed");

    console.log("\n🎉 All tests passed successfully!");
    
    // Generate test coverage report
    console.log("\n📊 Generating test coverage report...");
    try {
      await hre.run("coverage");
      console.log("✅ Coverage report generated");
    } catch (error) {
      console.log("⚠️  Coverage report generation failed (this is optional)");
    }

    // Run gas optimization analysis
    console.log("\n⛽ Running gas analysis...");
    try {
      await hre.run("gas-reporter");
      console.log("✅ Gas analysis completed");
    } catch (error) {
      console.log("⚠️  Gas analysis failed (this is optional)");
    }

  } catch (error) {
    console.error("❌ Test suite failed:", error);
    process.exitCode = 1;
  }
}

// Export for use in other scripts
export { runAllTests };

// Run tests if called directly
if (require.main === module) {
  runAllTests(require("hardhat")).catch((error) => {
    console.error("❌ Test execution failed:", error);
    process.exitCode = 1;
  });
}
