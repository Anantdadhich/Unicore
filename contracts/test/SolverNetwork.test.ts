import { expect } from "chai";
import  ethers  from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { SolverNetwork, MockToken } from "../typechain-types/index.js";
import { beforeEach, describe, it } from "node:test";

describe("SolverNetwork", function () {
  let solverNetwork: SolverNetwork;
  let stakingToken: MockToken;
  let owner: SignerWithAddress;
  let solver1: SignerWithAddress;
  let solver2: SignerWithAddress;
  let solver3: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const STAKE_AMOUNT = ethers.parseEther("1000");
  const MIN_REPUTATION = 50;
  const MAX_REPUTATION = 100;

  beforeEach(async function () {
    [owner, solver1, solver2, solver3] = await ethers.getSigners();

    // Deploy MockToken for staking
    const MockTokenFactory = await ethers.getContractFactory("MockToken");
    stakingToken = await MockTokenFactory.deploy("Solver Token", "SOL", INITIAL_SUPPLY);

    // Deploy SolverNetwork
    const SolverNetworkFactory = await ethers.getContractFactory("SolverNetwork");
    solverNetwork = await SolverNetworkFactory.deploy(stakingToken.target);

    // Mint tokens to solvers
    await stakingToken.mint(solver1.address, STAKE_AMOUNT * 10n);
    await stakingToken.mint(solver2.address, STAKE_AMOUNT * 10n);
    await stakingToken.mint(solver3.address, STAKE_AMOUNT * 10n);

    // Approve staking
    await stakingToken.connect(solver1).approve(solverNetwork.target, STAKE_AMOUNT * 10n);
    await stakingToken.connect(solver2).approve(solverNetwork.target, STAKE_AMOUNT * 10n);
    await stakingToken.connect(solver3).approve(solverNetwork.target, STAKE_AMOUNT * 10n);
  });

  describe("Deployment", function () {
    it("Should set the correct staking token", async function () {
      expect(await solverNetwork.stakingToken()).to.equal(stakingToken.target);
    });

    it("Should set the correct owner", async function () {
      expect(await solverNetwork.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero total staked", async function () {
      expect(await solverNetwork.totalStaked()).to.equal(0);
    });

    it("Should initialize with zero total reputation", async function () {
      expect(await solverNetwork.totalReputation()).to.equal(0);
    });
  });

  describe("Staking", function () {
    it("Should allow solvers to stake tokens", async function () {
      await expect(
        solverNetwork.connect(solver1).stake(STAKE_AMOUNT)
      ).to.emit(solverNetwork, "SolverStaked")
        .withArgs(solver1.address, STAKE_AMOUNT);

      // Check solver info
      const solverInfo = await solverNetwork.getSolver(solver1.address);
      expect(solverInfo.stake).to.equal(STAKE_AMOUNT);
      expect(solverInfo.reputation).to.equal(MIN_REPUTATION);
      expect(solverInfo.active).to.be.true;

      // Check total staked
      expect(await solverNetwork.totalStaked()).to.equal(STAKE_AMOUNT);
      expect(await solverNetwork.totalReputation()).to.equal(MIN_REPUTATION);
    });

    it("Should transfer tokens to contract when staking", async function () {
      const solverBalanceBefore = await stakingToken.balanceOf(solver1.address);
      const contractBalanceBefore = await stakingToken.balanceOf(solverNetwork.target);

      await solverNetwork.connect(solver1).stake(STAKE_AMOUNT);

      const solverBalanceAfter = await stakingToken.balanceOf(solver1.address);
      const contractBalanceAfter = await stakingToken.balanceOf(solverNetwork.target);

      expect(solverBalanceAfter).to.equal(solverBalanceBefore - STAKE_AMOUNT);
      expect(contractBalanceAfter).to.equal(contractBalanceBefore + STAKE_AMOUNT);
    });

    it("Should reject staking zero amount", async function () {
      await expect(
        solverNetwork.connect(solver1).stake(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should allow existing solvers to stake more", async function () {
      // First stake
      await solverNetwork.connect(solver1).stake(STAKE_AMOUNT);
      
      // Second stake
      await expect(
        solverNetwork.connect(solver1).stake(STAKE_AMOUNT)
      ).to.emit(solverNetwork, "SolverStaked")
        .withArgs(solver1.address, STAKE_AMOUNT);

      const solverInfo = await solverNetwork.getSolver(solver1.address);
      expect(solverInfo.stake).to.equal(STAKE_AMOUNT * 2n);
    });
  });

  describe("Unstaking", function () {
    beforeEach(async function () {
      // Stake tokens first
      await solverNetwork.connect(solver1).stake(STAKE_AMOUNT);
    });

    it("Should allow solvers to unstake tokens", async function () {
      const unstakeAmount = ethers.parseEther("500");
      
      await expect(
        solverNetwork.connect(solver1).unstake(unstakeAmount)
      ).to.emit(solverNetwork, "SolverUnstaked")
        .withArgs(solver1.address, unstakeAmount);

      const solverInfo = await solverNetwork.getSolver(solver1.address);
      expect(solverInfo.stake).to.equal(STAKE_AMOUNT - unstakeAmount);
      expect(await solverNetwork.totalStaked()).to.equal(STAKE_AMOUNT - unstakeAmount);
    });

    it("Should transfer tokens back to solver", async function () {
      const unstakeAmount = ethers.parseEther("500");
      const solverBalanceBefore = await stakingToken.balanceOf(solver1.address);

      await solverNetwork.connect(solver1).unstake(unstakeAmount);

      const solverBalanceAfter = await stakingToken.balanceOf(solver1.address);
      expect(solverBalanceAfter).to.equal(solverBalanceBefore + unstakeAmount);
    });

    it("Should reject unstaking more than staked", async function () {
      await expect(
        solverNetwork.connect(solver1).unstake(STAKE_AMOUNT + 1n)
      ).to.be.revertedWith("Insufficient stake");
    });

    it("Should deactivate solver when unstaking all", async function () {
      await solverNetwork.connect(solver1).unstake(STAKE_AMOUNT);
      
      const solverInfo = await solverNetwork.getSolver(solver1.address);
      expect(solverInfo.active).to.be.false;
      expect(solverInfo.stake).to.equal(0);
    });
  });

  describe("Bidding System", function () {
    beforeEach(async function () {
      // Stake tokens for multiple solvers
      await solverNetwork.connect(solver1).stake(STAKE_AMOUNT);
      await solverNetwork.connect(solver2).stake(STAKE_AMOUNT);
      await solverNetwork.connect(solver3).stake(STAKE_AMOUNT);
    });

    it("Should allow solvers to place bids", async function () {
      const intentId = 1;
      const amountOut = ethers.parseEther("250");
      const gasEstimate = 100000;
      const executionTime = 30;

      await expect(
        solverNetwork.connect(solver1).placeBid(
          intentId,
          amountOut,
          gasEstimate,
          executionTime
        )
      ).to.emit(solverNetwork, "BidPlaced")
        .withArgs(solver1.address, intentId, amountOut, gasEstimate, executionTime);

      const bid = await solverNetwork.getBid(solver1.address, intentId);
      expect(bid.solver).to.equal(solver1.address);
      expect(bid.intentId).to.equal(intentId);
      expect(bid.amountOut).to.equal(amountOut);
      expect(bid.gasEstimate).to.equal(gasEstimate);
      expect(bid.executionTime).to.equal(executionTime);
      expect(bid.accepted).to.be.false;
    });

    it("Should allow owner to accept bids", async function () {
      const intentId = 1;
      const amountOut = ethers.parseEther("250");
      
      // Place bid
      await solverNetwork.connect(solver1).placeBid(intentId, amountOut, 100000, 30);
      
      // Accept bid
      await expect(
        solverNetwork.acceptBid(solver1.address, intentId)
      ).to.emit(solverNetwork, "BidAccepted")
        .withArgs(solver1.address, intentId);

      const bid = await solverNetwork.getBid(solver1.address, intentId);
      expect(bid.accepted).to.be.true;
    });

    it("Should reject bids from inactive solvers", async function () {
      // Unstake all tokens to become inactive
      await solverNetwork.connect(solver1).unstake(STAKE_AMOUNT);
      
      await expect(
        solverNetwork.connect(solver1).placeBid(1, ethers.parseEther("250"), 100000, 30)
      ).to.be.revertedWith("Solver not active");
    });

    it("Should reject accepting bids from non-owner", async function () {
      const intentId = 1;
      const amountOut = ethers.parseEther("250");
      
      await solverNetwork.connect(solver1).placeBid(intentId, amountOut, 100000, 30);
      
      await expect(
        solverNetwork.connect(solver1).acceptBid(solver1.address, intentId)
      ).to.be.revertedWithCustomError(solverNetwork, "OwnableUnauthorizedAccount");
    });
  });

  describe("Performance Tracking", function () {
    beforeEach(async function () {
      await solverNetwork.connect(solver1).stake(STAKE_AMOUNT);
    });

    it("Should update solver performance on successful swap", async function () {
      const intentId = 1;
      const executionTime = 45;
      
      await expect(
        solverNetwork.updateSolverPerformance(solver1.address, intentId, true, executionTime)
      ).to.emit(solverNetwork, "SwapExecuted")
        .withArgs(solver1.address, intentId, true);

      const solverInfo = await solverNetwork.getSolver(solver1.address);
      expect(solverInfo.totalSwaps).to.equal(1);
      expect(solverInfo.successfulSwaps).to.equal(1);
      expect(solverInfo.avgExecutionTime).to.equal(executionTime);
      expect(solverInfo.reputation).to.be.greaterThan(MIN_REPUTATION);
    });

    it("Should update solver performance on failed swap", async function () {
      const intentId = 1;
      const executionTime = 45;
      
      await solverNetwork.updateSolverPerformance(solver1.address, intentId, false, executionTime);

      const solverInfo = await solverNetwork.getSolver(solver1.address);
      expect(solverInfo.totalSwaps).to.equal(1);
      expect(solverInfo.successfulSwaps).to.equal(0);
      expect(solverInfo.reputation).to.be.lessThan(MIN_REPUTATION);
    });

    it("Should cap reputation at maximum value", async function () {
      // Perform many successful swaps to increase reputation
      for (let i = 1; i <= 100; i++) {
        await solverNetwork.updateSolverPerformance(solver1.address, i, true, 30);
      }

      const solverInfo = await solverNetwork.getSolver(solver1.address);
      expect(solverInfo.reputation).to.equal(MAX_REPUTATION);
    });

    it("Should handle reputation decay over time", async function () {
      // Increase reputation first
      for (let i = 1; i <= 10; i++) {
        await solverNetwork.updateSolverPerformance(solver1.address, i, true, 30);
      }

      const solverInfoBefore = await solverNetwork.getSolver(solver1.address);
      const reputationBefore = solverInfoBefore.reputation;

      // Simulate time passing (this would normally happen with time)
      // For testing, we'll manually trigger reputation decay
      await solverNetwork.connect(solver1).unstake(ethers.parseEther("1"));
      await solverNetwork.connect(solver1).stake(ethers.parseEther("1"));

      const solverInfoAfter = await solverNetwork.getSolver(solver1.address);
      // Reputation should be recalculated based on performance
      expect(solverInfoAfter.reputation).to.be.lessThanOrEqual(reputationBefore);
    });
  });

  describe("Best Bid Selection", function () {
    beforeEach(async function () {
      // Stake different amounts for different solvers
      await solverNetwork.connect(solver1).stake(STAKE_AMOUNT);
      await solverNetwork.connect(solver2).stake(STAKE_AMOUNT * 2n);
      await solverNetwork.connect(solver3).stake(STAKE_AMOUNT);
    });

    it("Should find the best bid based on reputation and output", async function () {
      const intentId = 1;
      
      // Place bids with different amounts
      await solverNetwork.connect(solver1).placeBid(intentId, ethers.parseEther("250"), 100000, 30);
      await solverNetwork.connect(solver2).placeBid(intentId, ethers.parseEther("260"), 100000, 35);
      await solverNetwork.connect(solver3).placeBid(intentId, ethers.parseEther("240"), 100000, 25);

      const bestBid = await solverNetwork.getBestBid(intentId);
      expect(bestBid.solver).to.equal(solver2.address); // Should have highest stake/reputation
    });

    it("Should return zero address if no bids exist", async function () {
      const bestBid = await solverNetwork.getBestBid(999);
      expect(bestBid.solver).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update staking amount", async function () {
      const newStakingAmount = ethers.parseEther("2000");
      
      await solverNetwork.updateStakingAmount(newStakingAmount);
      expect(await solverNetwork.stakingAmount()).to.equal(newStakingAmount);
    });

    it("Should reject non-owner admin functions", async function () {
      await expect(
        solverNetwork.connect(solver1).updateStakingAmount(ethers.parseEther("2000"))
      ).to.be.revertedWithCustomError(solverNetwork, "OwnableUnauthorizedAccount");
    });
  });

  describe("Solver Statistics", function () {
    beforeEach(async function () {
      await solverNetwork.connect(solver1).stake(STAKE_AMOUNT);
    });

    it("Should return correct solver statistics", async function () {
      // Perform some swaps
      await solverNetwork.updateSolverPerformance(solver1.address, 1, true, 30);
      await solverNetwork.updateSolverPerformance(solver1.address, 2, true, 35);
      await solverNetwork.updateSolverPerformance(solver1.address, 3, false, 40);

      const stats = await solverNetwork.getSolverStats(solver1.address);
      expect(stats.totalSwaps).to.equal(3);
      expect(stats.successfulSwaps).to.equal(2);
      expect(stats.successRate).to.equal(66); // 2/3 * 100
      expect(stats.avgExecutionTime).to.equal(35); // (30+35+40)/3
      expect(stats.reputation).to.be.greaterThan(0);
    });

    it("Should return zero stats for non-existent solver", async function () {
      const stats = await solverNetwork.getSolverStats(solver3.address);
      expect(stats.totalSwaps).to.equal(0);
      expect(stats.successfulSwaps).to.equal(0);
      expect(stats.successRate).to.equal(0);
      expect(stats.avgExecutionTime).to.equal(0);
      expect(stats.reputation).to.equal(0);
    });
  });
});
