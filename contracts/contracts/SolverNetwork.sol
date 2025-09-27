// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SolverNetwork is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IERC20 public stakingToken;
    uint256 public stakingAmount;
    uint256 public constant REPUTATION_DECAY_PERIOD = 30 days;
    uint256 public constant REPUTATION_DECAY_RATE = 5; // 5% decay per period

    struct Solver {
        uint256 stake;
        uint256 reputation;
        uint256 lastReputationUpdate;
        bool active;
        uint256 totalSwaps;
        uint256 successfulSwaps;
        uint256 totalVolume;
        uint256 avgExecutionTime;
    }

    struct Bid {
        address solver;
        uint256 intentId;
        uint256 amountOut;
        uint256 gasEstimate;
        uint256 executionTime;
        uint256 bidTime;
        bool accepted;
    }

    mapping(address => Solver) public solvers;
    mapping(uint256 => Bid[]) public intentBids; // intentId => bids
    mapping(address => uint256[]) public solverBids; // solver => bid indices
    
    uint256 public totalStaked;
    uint256 public totalReputation;
    uint256 public constant MIN_REPUTATION = 50;
    uint256 public constant MAX_REPUTATION = 1000;

    event SolverStaked(address indexed solver, uint256 amount);
    event SolverUnstaked(address indexed solver, uint256 amount);
    event ReputationUpdated(address indexed solver, uint256 newReputation, uint256 delta);
    event BidPlaced(uint256 indexed intentId, address indexed solver, uint256 amountOut);
    event BidAccepted(uint256 indexed intentId, address indexed solver);
    event SwapExecuted(uint256 indexed intentId, address indexed solver, bool success, uint256 executionTime);

    constructor(address _stakingToken, uint256 _stakingAmount) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        stakingAmount = _stakingAmount;
    }

    /**
     * @notice Stake tokens to become a solver
     */
    function stake() external nonReentrant {
        require(!solvers[msg.sender].active, "Already staked");
        stakingToken.safeTransferFrom(msg.sender, address(this), stakingAmount);
        
        solvers[msg.sender] = Solver({
            stake: stakingAmount,
            reputation: MIN_REPUTATION, // Start with minimum reputation
            lastReputationUpdate: block.timestamp,
            active: true,
            totalSwaps: 0,
            successfulSwaps: 0,
            totalVolume: 0,
            avgExecutionTime: 0
        });
        
        totalStaked += stakingAmount;
        totalReputation += MIN_REPUTATION;
        
        emit SolverStaked(msg.sender, stakingAmount);
    }

    /**
     * @notice Unstake tokens and become inactive
     */
    function unstake() external nonReentrant {
        Solver storage solver = solvers[msg.sender];
        require(solver.active, "Not staked");
        
        // Apply reputation decay before unstaking
        _updateReputationDecay(msg.sender);
        
        stakingToken.safeTransfer(msg.sender, solver.stake);
        totalStaked -= solver.stake;
        totalReputation -= solver.reputation;
        
        solver.active = false;
        solver.stake = 0;
        solver.reputation = 0;
        
        emit SolverUnstaked(msg.sender, solver.stake);
    }

    /**
     * @notice Place a bid for a swap intent
     */
    function placeBid(
        uint256 intentId,
        uint256 amountOut,
        uint256 gasEstimate,
        uint256 executionTime
    ) external {
        Solver storage solver = solvers[msg.sender];
        require(solver.active, "Inactive solver");
        require(solver.reputation >= MIN_REPUTATION, "Insufficient reputation");
        
        Bid memory newBid = Bid({
            solver: msg.sender,
            intentId: intentId,
            amountOut: amountOut,
            gasEstimate: gasEstimate,
            executionTime: executionTime,
            bidTime: block.timestamp,
            accepted: false
        });
        
        intentBids[intentId].push(newBid);
        solverBids[msg.sender].push(intentBids[intentId].length - 1);
        
        emit BidPlaced(intentId, msg.sender, amountOut);
    }

    /**
     * @notice Accept a bid (called by UniCoreSwap contract)
     */
    function acceptBid(uint256 intentId, uint256 bidIndex) external onlyOwner {
        require(bidIndex < intentBids[intentId].length, "Invalid bid index");
        
        Bid storage bid = intentBids[intentId][bidIndex];
        require(!bid.accepted, "Bid already accepted");
        
        bid.accepted = true;
        emit BidAccepted(intentId, bid.solver);
    }

    /**
     * @notice Update solver performance after swap execution
     */
    function updateSolverPerformance(
        address solver,
        bool success,
        uint256 executionTime,
        uint256 volume
    ) external onlyOwner {
        Solver storage solverData = solvers[solver];
        require(solverData.active, "Inactive solver");
        
        solverData.totalSwaps++;
        solverData.totalVolume += volume;
        
        if (success) {
            solverData.successfulSwaps++;
            // Update average execution time
            solverData.avgExecutionTime = (solverData.avgExecutionTime * (solverData.successfulSwaps - 1) + executionTime) / solverData.successfulSwaps;
            
            // Increase reputation based on performance
            uint256 reputationIncrease = _calculateReputationIncrease(executionTime, volume);
            _updateReputation(solver, int256(reputationIncrease));
        } else {
            // Decrease reputation for failed swaps
            uint256 reputationDecrease = solverData.reputation / 20; // 5% decrease
            _updateReputation(solver, -int256(reputationDecrease));
        }
        
        emit SwapExecuted(0, solver, success, executionTime); // intentId would be passed in real implementation
    }

    /**
     * @notice Get best bid for an intent based on reputation and output
     */
    function getBestBid(uint256 intentId) external view returns (Bid memory bestBid, uint256 bestBidIndex) {
        Bid[] storage bids = intentBids[intentId];
        require(bids.length > 0, "No bids");
        
        uint256 bestScore = 0;
        
        for (uint256 i = 0; i < bids.length; i++) {
            if (bids[i].accepted) continue;
            
            Solver memory solver = solvers[bids[i].solver];
            if (!solver.active || solver.reputation < MIN_REPUTATION) continue;
            
            // Score based on reputation, output amount, and execution time
            uint256 score = (solver.reputation * bids[i].amountOut) / (bids[i].executionTime + 1);
            
            if (score > bestScore) {
                bestScore = score;
                bestBid = bids[i];
                bestBidIndex = i;
            }
        }
    }

    /**
     * @notice Calculate reputation increase based on performance
     */
    function _calculateReputationIncrease(uint256 executionTime, uint256 volume) internal pure returns (uint256) {
        // Faster execution and higher volume = more reputation
        uint256 timeBonus = executionTime < 60 ? 10 : (executionTime < 300 ? 5 : 1);
        uint256 volumeBonus = volume > 1000 ether ? 5 : (volume > 100 ether ? 3 : 1);
        
        return timeBonus + volumeBonus;
    }

    /**
     * @notice Update solver reputation
     */
    function _updateReputation(address solver, int256 delta) internal {
        Solver storage solverData = solvers[solver];
        uint256 oldReputation = solverData.reputation;
        
        if (delta > 0) {
            solverData.reputation = uint256(int256(solverData.reputation) + delta);
            if (solverData.reputation > MAX_REPUTATION) {
                solverData.reputation = MAX_REPUTATION;
            }
        } else {
            uint256 decrease = uint256(-delta);
            if (solverData.reputation > decrease) {
                solverData.reputation -= decrease;
            } else {
                solverData.reputation = 0;
            }
        }
        
        solverData.lastReputationUpdate = block.timestamp;
        totalReputation = totalReputation - oldReputation + solverData.reputation;
        
        emit ReputationUpdated(solver, solverData.reputation, delta);
    }

    /**
     * @notice Apply reputation decay over time
     */
    function _updateReputationDecay(address solver) internal {
        Solver storage solverData = solvers[solver];
        uint256 timeSinceUpdate = block.timestamp - solverData.lastReputationUpdate;
        
        if (timeSinceUpdate >= REPUTATION_DECAY_PERIOD) {
            uint256 periods = timeSinceUpdate / REPUTATION_DECAY_PERIOD;
            uint256 decayAmount = (solverData.reputation * REPUTATION_DECAY_RATE * periods) / 100;
            
            if (decayAmount > 0) {
                _updateReputation(solver, -int256(decayAmount));
            }
        }
    }

    /**
     * @notice Get solver statistics
     */
    function getSolverStats(address solver) external view returns (
        uint256 stake,
        uint256 reputation,
        uint256 totalSwaps,
        uint256 successRate,
        uint256 avgExecutionTime,
        bool active
    ) {
        Solver memory solverData = solvers[solver];
        stake = solverData.stake;
        reputation = solverData.reputation;
        totalSwaps = solverData.totalSwaps;
        successRate = solverData.totalSwaps > 0 ? (solverData.successfulSwaps * 100) / solverData.totalSwaps : 0;
        avgExecutionTime = solverData.avgExecutionTime;
        active = solverData.active;
    }

    /**
     * @notice Update staking requirements (admin only)
     */
    function updateStakingAmount(uint256 _newAmount) external onlyOwner {
        stakingAmount = _newAmount;
    }
}
