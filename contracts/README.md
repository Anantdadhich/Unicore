# UniCore Smart Contracts

This directory contains the smart contracts for the UniCore Cross-Chain DeFi Protocol.

## 📋 Contracts Overview

### Core Contracts

1. **UniCoreSwap.sol** - Main cross-chain swap contract
   - Handles swap intent creation and fulfillment
   - Integrates with LayerZero for cross-chain messaging
   - Supports ZK proof verification for privacy

2. **SolverNetwork.sol** - Decentralized solver network
   - Manages solver staking and reputation
   - Handles bidding system for swap execution
   - Tracks performance metrics and rewards

3. **ZKVerifier.sol** - Zero-knowledge proof verification
   - Verifies zk-SNARK proofs for privacy-preserving swaps
   - Prevents replay attacks with proof tracking
   - Supports circuit parameter validation

4. **MockToken.sol** - Testing token implementation
   - ERC20 token for testing and development
   - Used for staking and swap testing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Hardhat

### Installation

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile
```

### Testing

```bash
# Run all tests
npm test

# Run tests with gas reporting
npm run test:gas

# Run tests with coverage
npm run test:coverage

# Run comprehensive test suite
npm run test:all
```

### Deployment

#### Testnets

```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Deploy to Polygon Mumbai
npm run deploy:mumbai

# Deploy to Base Sepolia
npm run deploy:base-sepolia

# Deploy to Arbitrum Sepolia
npm run deploy:arbitrum-sepolia

# Deploy to Optimism Sepolia
npm run deploy:optimism-sepolia
```

#### Mainnets

```bash
# Deploy to Ethereum Mainnet
npm run deploy:mainnet

# Deploy to Polygon
npm run deploy:polygon

# Deploy to Base
npm run deploy:base

# Deploy to Arbitrum
npm run deploy:arbitrum

# Deploy to Optimism
npm run deploy:optimism
```

### Verification

```bash
# Verify contracts on Etherscan
npm run verify:sepolia
npm run verify:polygon
# ... etc for other networks
```

## 🧪 Testing

### Test Structure

```
test/
├── UniCoreSwap.test.ts      # Main swap contract tests
├── SolverNetwork.test.ts    # Solver network tests
└── ZKVerifier.test.ts       # ZK proof verification tests
```

### Test Categories

1. **Unit Tests**
   - Individual contract function testing
   - Edge case validation
   - Access control verification

2. **Integration Tests**
   - Cross-contract interaction testing
   - End-to-end swap flow testing
   - LayerZero integration testing

3. **Gas Optimization Tests**
   - Gas usage measurement
   - Optimization validation
   - Cost analysis

### Running Specific Tests

```bash
# Run specific test file
npx hardhat test test/UniCoreSwap.test.ts

# Run with verbose output
npm run test:verbose

# Run with gas reporting
npm run test:gas
```

## 📊 Test Coverage

The test suite provides comprehensive coverage including:

- ✅ Contract deployment and initialization
- ✅ Access control and permissions
- ✅ Core functionality testing
- ✅ Edge cases and error conditions
- ✅ Integration between contracts
- ✅ Gas optimization validation
- ✅ Security vulnerability testing

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the contracts directory:

```env
# Private key for deployment
PRIVATE_KEY=your_private_key_here

# RPC URLs
ETHEREUM_RPC_URL=https://eth.llamarpc.com
POLYGON_RPC_URL=https://polygon.llamarpc.com
BASE_RPC_URL=https://base.llamarpc.com
ARBITRUM_RPC_URL=https://arbitrum.llamarpc.com
OPTIMISM_RPC_URL=https://optimism.llamarpc.com

# Testnet RPC URLs
SEPOLIA_RPC_URL=https://sepolia.llamarpc.com
MUMBAI_RPC_URL=https://polygon-mumbai.llamarpc.com
BASE_SEPOLIA_RPC_URL=https://base-sepolia.llamarpc.com
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
OPTIMISM_SEPOLIA_RPC_URL=https://sepolia.optimism.io

# API Keys for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
OPTIMISTIC_ETHERSCAN_API_KEY=your_optimistic_etherscan_api_key

# Gas reporting
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
REPORT_GAS=true
COVERAGE=true
```

### Network Configuration

The contracts are configured to deploy to:

**Mainnets:**
- Ethereum (Chain ID: 1)
- Polygon (Chain ID: 137)
- Base (Chain ID: 8453)
- Arbitrum (Chain ID: 42161)
- Optimism (Chain ID: 10)

**Testnets:**
- Sepolia (Chain ID: 11155111)
- Polygon Mumbai (Chain ID: 80001)
- Base Sepolia (Chain ID: 84532)
- Arbitrum Sepolia (Chain ID: 421614)
- Optimism Sepolia (Chain ID: 11155420)

## 🔒 Security

### Security Features

- **OpenZeppelin Standards** - Battle-tested security libraries
- **ReentrancyGuard** - Protection against reentrancy attacks
- **Access Control** - Role-based permissions
- **Emergency Functions** - Critical situation handling
- **Input Validation** - Comprehensive parameter checking

### Audit Status

- ✅ **Code Review** - Internal security review completed
- 🔄 **External Audit** - Scheduled for Q1 2025
- ✅ **Testing** - Comprehensive test coverage

### Best Practices

- All external calls use `safeTransfer` and `safeTransferFrom`
- Reentrancy guards on state-changing functions
- Proper access control with OpenZeppelin's `Ownable`
- Input validation and bounds checking
- Event emission for all important state changes

## 📈 Gas Optimization

### Optimization Techniques

- **Compiler Optimization** - Runs: 200 for gas efficiency
- **Storage Packing** - Efficient struct layout
- **Function Visibility** - Minimal external function calls
- **Loop Optimization** - Efficient iteration patterns

### Gas Usage

Typical gas usage for main functions:

- `createSwapIntent`: ~150,000 gas
- `fulfillSwapIntent`: ~120,000 gas
- `stake`: ~80,000 gas
- `unstake`: ~60,000 gas
- `verifyProof`: ~45,000 gas

## 🚀 Deployment Process

### Pre-deployment Checklist

1. ✅ All tests passing
2. ✅ Gas optimization completed
3. ✅ Security review completed
4. ✅ Environment variables configured
5. ✅ Network configuration verified

### Deployment Steps

1. **Compile Contracts**
   ```bash
   npm run compile
   ```

2. **Run Tests**
   ```bash
   npm test
   ```

3. **Deploy to Testnet**
   ```bash
   npm run deploy:sepolia
   ```

4. **Verify Contracts**
   ```bash
   npm run verify:sepolia
   ```

5. **Test on Testnet**
   - Verify contract functionality
   - Test cross-chain interactions
   - Validate gas usage

6. **Deploy to Mainnet**
   ```bash
   npm run deploy:mainnet
   ```

### Post-deployment

1. **Verify Contracts**
   ```bash
   npm run verify:mainnet
   ```

2. **Configure Cross-chain Remotes**
   - Set trusted remotes for each chain
   - Configure remote contract addresses

3. **Initialize Contracts**
   - Authorize solvers
   - Set up initial configuration

4. **Monitor and Test**
   - Monitor contract events
   - Test complete user flows
   - Validate cross-chain functionality

## 📚 Scripts Reference

### Available Scripts

| Script | Description |
|--------|-------------|
| `compile` | Compile all contracts |
| `test` | Run test suite |
| `test:verbose` | Run tests with verbose output |
| `test:gas` | Run tests with gas reporting |
| `test:coverage` | Run tests with coverage |
| `test:all` | Run comprehensive test suite |
| `deploy:local` | Deploy to local network |
| `deploy:sepolia` | Deploy to Sepolia testnet |
| `deploy:mainnet` | Deploy to Ethereum mainnet |
| `deploy-and-test` | Deploy and run tests |
| `verify:*` | Verify contracts on Etherscan |
| `clean` | Clean build artifacts |
| `node` | Start local Hardhat node |
| `console` | Start Hardhat console |

### Custom Scripts

- `scripts/deploy.ts` - Main deployment script
- `scripts/test-all.ts` - Comprehensive test runner
- `scripts/deploy-and-test.ts` - Deploy and test combination

## 🔍 Troubleshooting

### Common Issues

1. **Compilation Errors**
   - Check Solidity version compatibility
   - Verify import paths
   - Ensure all dependencies are installed

2. **Test Failures**
   - Check network configuration
   - Verify test environment setup
   - Review test timeout settings

3. **Deployment Failures**
   - Verify private key configuration
   - Check RPC URL availability
   - Ensure sufficient gas funds

4. **Verification Failures**
   - Verify constructor arguments
   - Check API key configuration
   - Ensure contract is deployed

### Getting Help

- Check the test output for detailed error messages
- Review the Hardhat documentation
- Check network status and RPC availability
- Verify environment variable configuration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ for the UniCore Protocol**