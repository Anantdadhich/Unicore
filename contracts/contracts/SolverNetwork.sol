// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SolverNetwork is Ownable {
    IERC20 public stakingToken;
    uint256 public stakingAmount;

    struct Solver {
        uint256 stake;
        uint256 reputation;
        bool active;
    }

    mapping(address => Solver) public solvers;

    event SolverStaked(address indexed solver, uint256 amount);
    event SolverUnstaked(address indexed solver, uint256 amount);
    event ReputationUpdated(address indexed solver, uint256 newReputation);

    constructor(address _stakingToken, uint256 _stakingAmount) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        stakingAmount = _stakingAmount;
    }

    function stake() external {
        require(!solvers[msg.sender].active, "Already staked");
        stakingToken.transferFrom(msg.sender, address(this), stakingAmount);
        solvers[msg.sender] = Solver({
            stake: stakingAmount,
            reputation: 0,
            active: true
        });
        emit SolverStaked(msg.sender, stakingAmount);
    }

    function unstake() external {
        require(solvers[msg.sender].active, "Not staked");
        stakingToken.transfer(msg.sender, solvers[msg.sender].stake);
        solvers[msg.sender].active = false;
        emit SolverUnstaked(msg.sender, solvers[msg.sender].stake);
    }

    function updateReputation(address solver, uint256 delta) external onlyOwner {
        require(solvers[solver].active, "Inactive solver");
        solvers[solver].reputation += delta;
        emit ReputationUpdated(solver, solvers[solver].reputation);
    }
}
