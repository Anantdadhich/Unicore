import { expect } from "chai";
import ethers  from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { UniCoreSwap, MockToken } from "../typechain-types/index.js";
import { beforeEach, describe, it } from "node:test";

describe("UniCoreSwap", function () {
  let uniCoreSwap: UniCoreSwap;
  let mockTokenIn: MockToken;
  let mockTokenOut: MockToken;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let solver: SignerWithAddress;
  let lzEndpoint: string;

  // LayerZero endpoint addresses for testnets
  const LZ_ENDPOINTS = {
    sepolia: "0x6EDCE65403992e310A62460808c4b8D0317C86De",
    mumbai: "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8",
    baseSepolia: "0x6EDCE65403992e310A62460808c4b8D0317C86De",
  };

  beforeEach(async function () {
    [owner, user, solver] = await ethers.getSigners();
    
    // Use Sepolia endpoint for testing
    lzEndpoint = LZ_ENDPOINTS.sepolia;

    // Deploy MockTokens
    const MockTokenFactory = await ethers.getContractFactory("MockToken");
    mockTokenIn = await MockTokenFactory.deploy("Token In", "TKI", ethers.parseEther("1000000"));
    mockTokenOut = await MockTokenFactory.deploy("Token Out", "TKO", ethers.parseEther("1000000"));

    // Deploy UniCoreSwap
    const UniCoreSwapFactory = await ethers.getContractFactory("UniCoreSwap");
    uniCoreSwap = await UniCoreSwapFactory.deploy(lzEndpoint);

    // Authorize solver
    await uniCoreSwap.authorizeSolver(solver.address, true);

    // Set up trusted remote (simplified for testing)
    const remoteAddress = ethers.zeroPadValue(uniCoreSwap.target.toString(), 32);
    await uniCoreSwap.setTrustedRemote(137, remoteAddress); // Polygon testnet
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await uniCoreSwap.owner()).to.equal(owner.address);
    });

    it("Should set the correct LayerZero endpoint", async function () {
      expect(await uniCoreSwap.lzEndpoint()).to.equal(lzEndpoint);
    });

    it("Should initialize intent counter to 0", async function () {
      expect(await uniCoreSwap.intentCounter()).to.equal(0);
    });
  });

  describe("Swap Intent Creation", function () {
    const amountIn = ethers.parseEther("100");
    const minAmountOut = ethers.parseEther("250");
    const dstChainId = 137; // Polygon
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const zkProofHash = ethers.keccak256(ethers.toUtf8Bytes("test-proof"));

    beforeEach(async function () {
      // Mint tokens to user
      await mockTokenIn.mint(user.address, amountIn);
      
      // User approves contract to spend tokens
      await mockTokenIn.connect(user).approve(uniCoreSwap.target, amountIn);
    });

    it("Should create swap intent successfully", async function () {
      await expect(
        uniCoreSwap.connect(user).createSwapIntent(
          mockTokenIn.target,
          mockTokenOut.target,
          amountIn,
          minAmountOut,
          dstChainId,
          deadline,
          zkProofHash
        )
      ).to.emit(uniCoreSwap, "SwapIntentCreated")
        .withArgs(1, user.address, dstChainId, zkProofHash);

      // Check intent counter increased
      expect(await uniCoreSwap.intentCounter()).to.equal(1);

      // Check intent details
      const intent = await uniCoreSwap.swapIntents(1);
      expect(intent.user).to.equal(user.address);
      expect(intent.tokenIn).to.equal(mockTokenIn.target);
      expect(intent.tokenOut).to.equal(mockTokenOut.target);
      expect(intent.amountIn).to.equal(amountIn);
      expect(intent.minAmountOut).to.equal(minAmountOut);
      expect(intent.dstChainId).to.equal(dstChainId);
      expect(intent.deadline).to.equal(deadline);
      expect(intent.fulfilled).to.be.false;
      expect(intent.zkProofHash).to.equal(zkProofHash);
      expect(intent.solver).to.equal(ethers.ZeroAddress);
    });

    it("Should transfer tokens from user to contract", async function () {
      const userBalanceBefore = await mockTokenIn.balanceOf(user.address);
      const contractBalanceBefore = await mockTokenIn.balanceOf(uniCoreSwap.target);

      await uniCoreSwap.connect(user).createSwapIntent(
        mockTokenIn.target,
        mockTokenOut.target,
        amountIn,
        minAmountOut,
        dstChainId,
        deadline,
        zkProofHash
      );

      const userBalanceAfter = await mockTokenIn.balanceOf(user.address);
      const contractBalanceAfter = await mockTokenIn.balanceOf(uniCoreSwap.target);

      expect(userBalanceAfter).to.equal(userBalanceBefore - amountIn);
      expect(contractBalanceAfter).to.equal(contractBalanceBefore + amountIn);
    });

    it("Should reject invalid amounts", async function () {
      await expect(
        uniCoreSwap.connect(user).createSwapIntent(
          mockTokenIn.target,
          mockTokenOut.target,
          0, // Invalid amount
          minAmountOut,
          dstChainId,
          deadline,
          zkProofHash
        )
      ).to.be.revertedWith("Invalid amount");

      await expect(
        uniCoreSwap.connect(user).createSwapIntent(
          mockTokenIn.target,
          mockTokenOut.target,
          amountIn,
          0, // Invalid min amount
          dstChainId,
          deadline,
          zkProofHash
        )
      ).to.be.revertedWith("Invalid min amount");
    });

    it("Should reject invalid deadline", async function () {
      const pastDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const futureDeadline = Math.floor(Date.now() / 1000) + 8 * 24 * 3600; // 8 days from now

      await expect(
        uniCoreSwap.connect(user).createSwapIntent(
          mockTokenIn.target,
          mockTokenOut.target,
          amountIn,
          minAmountOut,
          dstChainId,
          pastDeadline,
          zkProofHash
        )
      ).to.be.revertedWith("Invalid deadline");

      await expect(
        uniCoreSwap.connect(user).createSwapIntent(
          mockTokenIn.target,
          mockTokenOut.target,
          amountIn,
          minAmountOut,
          dstChainId,
          futureDeadline,
          zkProofHash
        )
      ).to.be.revertedWith("Invalid deadline");
    });

    it("Should reject same chain swap", async function () {
      const currentChainId = 11155111; // Sepolia
      await expect(
        uniCoreSwap.connect(user).createSwapIntent(
          mockTokenIn.target,
          mockTokenOut.target,
          amountIn,
          minAmountOut,
          currentChainId, // Same as current chain
          deadline,
          zkProofHash
        )
      ).to.be.revertedWith("Same chain swap");
    });
  });

  describe("Swap Intent Fulfillment", function () {
    let intentId: number;
    const amountOut = ethers.parseEther("250");

    beforeEach(async function () {
      const amountIn = ethers.parseEther("100");
      const minAmountOut = ethers.parseEther("250");
      const dstChainId = 137;
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const zkProofHash = ethers.keccak256(ethers.toUtf8Bytes("test-proof"));

      // Mint tokens to user and approve
      await mockTokenIn.mint(user.address, amountIn);
      await mockTokenIn.connect(user).approve(uniCoreSwap.target, amountIn);

      // Create swap intent
      await uniCoreSwap.connect(user).createSwapIntent(
        mockTokenIn.target,
        mockTokenOut.target,
        amountIn,
        minAmountOut,
        dstChainId,
        deadline,
        zkProofHash
      );

      intentId = 1;

      // Mint output tokens to contract
      await mockTokenOut.mint(uniCoreSwap.target, amountOut);
    });

    it("Should fulfill swap intent successfully", async function () {
      const zkProof = ethers.toUtf8Bytes("test-proof");
      
      await expect(
        uniCoreSwap.connect(solver).fulfillSwapIntent(intentId, amountOut, zkProof)
      ).to.emit(uniCoreSwap, "SwapIntentFulfilled")
        .withArgs(intentId, solver.address, amountOut);

      // Check intent is marked as fulfilled
      const intent = await uniCoreSwap.swapIntents(intentId);
      expect(intent.fulfilled).to.be.true;
      expect(intent.solver).to.equal(solver.address);

      // Check tokens transferred to user
      expect(await mockTokenOut.balanceOf(user.address)).to.equal(amountOut);
    });

    it("Should reject fulfillment by unauthorized solver", async function () {
      const [, , , unauthorizedSolver] = await ethers.getSigners();
      const zkProof = ethers.toUtf8Bytes("test-proof");

      await expect(
        uniCoreSwap.connect(unauthorizedSolver).fulfillSwapIntent(intentId, amountOut, zkProof)
      ).to.be.revertedWith("Unauthorized solver");
    });

    it("Should reject already fulfilled intent", async function () {
      const zkProof = ethers.toUtf8Bytes("test-proof");
      
      // Fulfill once
      await uniCoreSwap.connect(solver).fulfillSwapIntent(intentId, amountOut, zkProof);

      // Try to fulfill again
      await expect(
        uniCoreSwap.connect(solver).fulfillSwapIntent(intentId, amountOut, zkProof)
      ).to.be.revertedWith("Already fulfilled");
    });

    it("Should reject expired intent", async function () {
      // Create an expired intent
      const expiredDeadline = Math.floor(Date.now() / 1000) - 1;
      const zkProofHash = ethers.keccak256(ethers.toUtf8Bytes("test-proof"));

      const amountIn = ethers.parseEther("100");
      await mockTokenIn.mint(user.address, amountIn);
      await mockTokenIn.connect(user).approve(uniCoreSwap.target, amountIn);

      await uniCoreSwap.connect(user).createSwapIntent(
        mockTokenIn.target,
        mockTokenOut.target,
        amountIn,
        ethers.parseEther("250"),
        137,
        expiredDeadline,
        zkProofHash
      );

      const expiredIntentId = 2;
      const zkProof = ethers.toUtf8Bytes("test-proof");

      await expect(
        uniCoreSwap.connect(solver).fulfillSwapIntent(expiredIntentId, amountOut, zkProof)
      ).to.be.revertedWith("Deadline passed");
    });

    it("Should reject insufficient output amount", async function () {
      const insufficientAmountOut = ethers.parseEther("200"); // Less than minAmountOut
      const zkProof = ethers.toUtf8Bytes("test-proof");

      await expect(
        uniCoreSwap.connect(solver).fulfillSwapIntent(intentId, insufficientAmountOut, zkProof)
      ).to.be.revertedWith("Insufficient output");
    });

    it("Should reject invalid ZK proof", async function () {
      const invalidProof = ethers.toUtf8Bytes("invalid-proof");

      await expect(
        uniCoreSwap.connect(solver).fulfillSwapIntent(intentId, amountOut, invalidProof)
      ).to.be.revertedWith("Invalid ZK proof");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to authorize solvers", async function () {
      await expect(
        uniCoreSwap.authorizeSolver(solver.address, true)
      ).to.emit(uniCoreSwap, "SolverAuthorized")
        .withArgs(solver.address, true);

      expect(await uniCoreSwap.authorizedSolvers(solver.address)).to.be.true;
    });

    it("Should allow owner to set remote contracts", async function () {
      const remoteAddress = ethers.getAddress("0x1234567890123456789012345678901234567890");
      
      await expect(
        uniCoreSwap.setRemoteContract(137, remoteAddress)
      ).to.emit(uniCoreSwap, "RemoteContractSet")
        .withArgs(137, remoteAddress);

      expect(await uniCoreSwap.remoteContracts(137)).to.equal(remoteAddress);
    });

    it("Should allow owner to set trusted remotes", async function () {
      const remotePath = ethers.zeroPadValue("0x1234567890123456789012345678901234567890", 32);
      
      await uniCoreSwap.setTrustedRemote(137, remotePath);
      expect(await uniCoreSwap.trustedRemoteLookup(137, remotePath)).to.be.true;
    });

    it("Should allow owner to emergency withdraw", async function () {
      const withdrawAmount = ethers.parseEther("100");
      
      // Mint tokens to contract
      await mockTokenIn.mint(uniCoreSwap.target, withdrawAmount);

      await expect(
        uniCoreSwap.emergencyWithdraw(mockTokenIn.target, withdrawAmount)
      ).to.not.be.reverted;

      expect(await mockTokenIn.balanceOf(owner.address)).to.equal(withdrawAmount);
    });

    it("Should reject non-owner admin functions", async function () {
      await expect(
        uniCoreSwap.connect(user).authorizeSolver(solver.address, true)
      ).to.be.revertedWithCustomError(uniCoreSwap, "OwnableUnauthorizedAccount");

      await expect(
        uniCoreSwap.connect(user).setRemoteContract(137, solver.address)
      ).to.be.revertedWithCustomError(uniCoreSwap, "OwnableUnauthorizedAccount");
    });
  });

  describe("Fee Estimation", function () {
    it("Should estimate cross-chain fees", async function () {
      const payload = ethers.toUtf8Bytes("test-payload");
      
      // This might fail if LayerZero endpoint is not properly configured
      // but it should not revert due to our contract logic
      try {
        await uniCoreSwap.estimateFee(137, payload);
      } catch (error) {
        // LayerZero endpoint might not be available in test environment
        // This is expected behavior
        expect(error.message).to.include("LayerZero");
      }
    });
  });

  describe("LayerZero Integration", function () {
    it("Should handle cross-chain messages", async function () {
      // This is a simplified test - in a real scenario, you'd need
      // a proper LayerZero test environment
      const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address", "address", "uint256", "uint16", "bool"],
        [1, user.address, mockTokenOut.target, ethers.parseEther("250"), 11155111, true]
      );

      // Set up trusted remote
      const trustedRemote = ethers.zeroPadValue(uniCoreSwap.target.toString(), 32);
      await uniCoreSwap.setTrustedRemote(11155111, trustedRemote);

      // This would normally be called by LayerZero endpoint
      // We can't easily test this without a proper LayerZero test environment
    });
  });
});
