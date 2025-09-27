// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../LayerZero/contracts/interfaces/ILayerZeroEndpoint.sol";
import "../LayerZero/contracts/interfaces/ILayerZeroReceiver.sol";

contract UniCoreSwap is Ownable, ILayerZeroReceiver {
    using SafeERC20 for IERC20;
    
    ILayerZeroEndpoint public immutable lzEndpoint;
    
    // Chain IDs for supported networks
    uint16 public constant ETHEREUM_CHAIN_ID = 1;
    uint16 public constant POLYGON_CHAIN_ID = 137;
    uint16 public constant BASE_CHAIN_ID = 8453;
    uint16 public constant ARBITRUM_CHAIN_ID = 42161;
    uint16 public constant OPTIMISM_CHAIN_ID = 10;

    struct SwapIntent {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint16 dstChainId;
        uint256 deadline;
        bool fulfilled;
        bytes32 zkProofHash; // Hash of ZK proof for privacy
        address solver; // Address of solver who fulfilled the intent
    }

    struct CrossChainMessage {
        uint256 intentId;
        address user;
        address tokenOut;
        uint256 amountOut;
        uint16 srcChainId;
        bool success;
    }

    mapping(uint256 => SwapIntent) public swapIntents;
    mapping(uint16 => mapping(bytes => bool)) public trustedRemoteLookup;
    mapping(address => bool) public authorizedSolvers;
    mapping(uint16 => address) public remoteContracts; // Chain ID => Contract Address
    
    uint256 public intentCounter;
    uint256 public constant MAX_DEADLINE = 7 days;
    
    // Events
    event SwapIntentCreated(
        uint256 indexed intentId, 
        address indexed user, 
        uint16 dstChainId,
        bytes32 zkProofHash
    );
    event SwapIntentFulfilled(
        uint256 indexed intentId, 
        address indexed solver,
        uint256 amountOut
    );
    event CrossChainSwapCompleted(
        uint256 indexed intentId,
        uint16 srcChainId,
        uint16 dstChainId,
        bool success
    );
    event SolverAuthorized(address indexed solver, bool authorized);
    event RemoteContractSet(uint16 chainId, address remoteContract);

    modifier onlyAuthorizedSolver() {
        require(authorizedSolvers[msg.sender], "Unauthorized solver");
        _;
    }

    constructor(address _layerZeroEndpoint) Ownable(msg.sender) {
        lzEndpoint = ILayerZeroEndpoint(_layerZeroEndpoint);
    }

    /**
     * @notice Create a cross-chain swap intent with ZK proof for privacy
     * @param tokenIn Token to swap from
     * @param tokenOut Token to swap to
     * @param amountIn Amount of tokenIn to swap
     * @param minAmountOut Minimum amount of tokenOut expected
     * @param dstChainId Destination chain ID
     * @param deadline Maximum time for swap completion
     * @param zkProofHash Hash of ZK proof for privacy verification
     */
    function createSwapIntent(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint16 dstChainId,
        uint256 deadline,
        bytes32 zkProofHash
    ) external returns (uint256) {
        require(amountIn > 0, "Invalid amount");
        require(minAmountOut > 0, "Invalid min amount");
        require(deadline > block.timestamp && deadline <= block.timestamp + MAX_DEADLINE, "Invalid deadline");
        require(dstChainId != _getChainId(), "Same chain swap");
        
        // Transfer tokens from user to contract
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        intentCounter++;
        swapIntents[intentCounter] = SwapIntent({
            user: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            minAmountOut: minAmountOut,
            dstChainId: dstChainId,
            deadline: deadline,
            fulfilled: false,
            zkProofHash: zkProofHash,
            solver: address(0)
        });
        
        emit SwapIntentCreated(intentCounter, msg.sender, dstChainId, zkProofHash);
        return intentCounter;
    }

    /**
     * @notice Fulfill a swap intent (called by authorized solvers)
     * @param intentId ID of the swap intent
     * @param amountOut Actual amount of tokenOut received
     * @param zkProof ZK proof for privacy verification
     */
    function fulfillSwapIntent(
        uint256 intentId,
        uint256 amountOut,
        bytes calldata zkProof
    ) external onlyAuthorizedSolver {
        SwapIntent storage intent = swapIntents[intentId];
        require(!intent.fulfilled, "Already fulfilled");
        require(block.timestamp <= intent.deadline, "Deadline passed");
        require(amountOut >= intent.minAmountOut, "Insufficient output");
        
        // Verify ZK proof hash matches
        require(keccak256(zkProof) == intent.zkProofHash, "Invalid ZK proof");
        
        intent.fulfilled = true;
        intent.solver = msg.sender;
        
        // Transfer tokens to user
        IERC20(intent.tokenOut).safeTransfer(intent.user, amountOut);
        
        emit SwapIntentFulfilled(intentId, msg.sender, amountOut);
        
        // Send cross-chain message to destination chain
        _sendCrossChainMessage(intentId, intent.user, intent.tokenOut, amountOut, intent.dstChainId);
    }

    /**
     * @notice LayerZero receive function for cross-chain messages
     */
    function lzReceive(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) external override {
        require(msg.sender == address(lzEndpoint), "Invalid sender");
        require(trustedRemoteLookup[_srcChainId][_srcAddress], "Untrusted remote");
        
        // Decode cross-chain message
        CrossChainMessage memory message = abi.decode(_payload, (CrossChainMessage));
        
        // Process cross-chain swap completion
        SwapIntent storage intent = swapIntents[message.intentId];
        require(intent.user == message.user, "Invalid user");
        
        emit CrossChainSwapCompleted(
            message.intentId,
            _srcChainId,
            _getChainId(),
            message.success
        );
    }

    /**
     * @notice Send cross-chain message to destination chain
     */
    function _sendCrossChainMessage(
        uint256 intentId,
        address user,
        address tokenOut,
        uint256 amountOut,
        uint16 dstChainId
    ) internal {
        CrossChainMessage memory message = CrossChainMessage({
            intentId: intentId,
            user: user,
            tokenOut: tokenOut,
            amountOut: amountOut,
            srcChainId: _getChainId(),
            success: true
        });
        
        bytes memory payload = abi.encode(message);
        bytes memory remoteAddress = abi.encodePacked(remoteContracts[dstChainId], address(this));
        
        lzEndpoint.send{value: msg.value}(
            dstChainId,
            remoteAddress,
            payload,
            payable(msg.sender),
            address(0),
            bytes("")
        );
    }

    /**
     * @notice Get current chain ID
     */
    function _getChainId() internal view returns (uint16) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return uint16(chainId);
    }

    // Admin functions
    function setTrustedRemote(uint16 _srcChainId, bytes calldata _path) external onlyOwner {
        trustedRemoteLookup[_srcChainId][_path] = true;
    }

    function setRemoteContract(uint16 _chainId, address _remoteContract) external onlyOwner {
        remoteContracts[_chainId] = _remoteContract;
        emit RemoteContractSet(_chainId, _remoteContract);
    }

    function authorizeSolver(address _solver, bool _authorized) external onlyOwner {
        authorizedSolvers[_solver] = _authorized;
        emit SolverAuthorized(_solver, _authorized);
    }

    function estimateFee(
        uint16 _dstChainId,
        bytes calldata _payload
    ) external view returns (uint256 nativeFee, uint256 zroFee) {
        bytes memory remoteAddress = abi.encodePacked(remoteContracts[_dstChainId], address(this));
        return lzEndpoint.estimateFees(_dstChainId, address(this), _payload, false, bytes(""));
    }

    // Emergency functions
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
}
