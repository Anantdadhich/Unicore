# UniCore Cross-Chain DeFi Protocol

🚀 **Next-Generation Cross-Chain DeFi Protocol** with AI-powered route optimization, zero-knowledge privacy, and decentralized solver network.

## 🌟 Key Features

### 🔐 Zero-Knowledge Privacy
- **Military-grade cryptographic protection** for trading patterns
- **zk-SNARKs technology** for complete transaction privacy
- **Privacy-preserving swaps** without revealing sensitive information

### 🤖 AI-Powered Route Optimization
- **Advanced machine learning algorithms** analyze real-time market conditions
- **Optimal execution paths** with minimal slippage across all chains
- **Smart execution** with intelligent route selection

### 🌐 Omni-Chain Network
- **Decentralized solver network** providing deep liquidity
- **Instant execution** across all major blockchains
- **Universal liquidity** with guaranteed best prices

### 💬 Conversational Interface
- **AI-powered chat assistant** for intuitive DeFi interactions
- **Natural language processing** for swap intent detection
- **User-friendly experience** with guided workflows

## 🏗️ Architecture

### Smart Contracts
- **UniCoreSwap.sol** - Cross-chain swap intents with LayerZero integration
- **SolverNetwork.sol** - Decentralized solver network with reputation system
- **ZKVerifier.sol** - Zero-knowledge proof verification for privacy

### Frontend
- **Next.js 14** with TypeScript for type safety
- **Wagmi + RainbowKit** for wallet connectivity
- **Framer Motion** for smooth animations
- **Tailwind CSS** for modern styling

### Backend APIs
- **AI Route Optimization** - TensorFlow.js powered route selection
- **ZK Proof Generation** - Privacy-preserving proof creation
- **1inch Integration** - Real-time DEX aggregation
- **Solver Network** - Decentralized execution management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/unicore-protocol.git
cd unicore-protocol
```

2. **Install dependencies**
```bash
# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Environment Setup**
```bash
# Copy environment files
cp frontend/env.example frontend/.env.local
cp contracts/.env.example contracts/.env

# Configure your environment variables
# See Configuration section below
```

4. **Deploy Smart Contracts**
```bash
cd contracts
npx hardhat compile
npx hardhat deploy --network sepolia
```

5. **Start Development Server**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to see the application.

## ⚙️ Configuration

### Environment Variables

#### Frontend (.env.local)
```env
# Wallet Connect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# AI Services
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# DEX Integration
ONEINCH_API_KEY=your_1inch_api_key

# Contract Addresses (update after deployment)
NEXT_PUBLIC_UNICORE_SWAP_ADDRESS=0x...
NEXT_PUBLIC_SOLVER_NETWORK_ADDRESS=0x...
NEXT_PUBLIC_ZK_VERIFIER_ADDRESS=0x...

# RPC URLs
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://eth.llamarpc.com
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon.llamarpc.com
NEXT_PUBLIC_BASE_RPC_URL=https://base.llamarpc.com
```

#### Contracts (.env)
```env
# Private Key
PRIVATE_KEY=your_private_key

# RPC URLs
ETHEREUM_RPC_URL=https://eth.llamarpc.com
POLYGON_RPC_URL=https://polygon.llamarpc.com
BASE_RPC_URL=https://base.llamarpc.com

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
```

## 🔧 Development

### Smart Contracts
```bash
cd contracts

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to testnet
npx hardhat deploy --network sepolia

# Deploy to mainnet
npx hardhat deploy --network ethereum
```

### Frontend
```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## 🧪 Testing

### Complete Flow Test
```bash
cd frontend
node test-complete-flow.js
```

This tests:
- ✅ ZK Proof Generation
- ✅ AI Route Optimization  
- ✅ 1inch Integration
- ✅ Solver Network
- ✅ Chat Assistant
- ✅ Swap Intent Creation

### Manual Testing
1. **Connect Wallet** - Use RainbowKit to connect your wallet
2. **Create Swap Intent** - Select tokens and amounts
3. **View Optimized Routes** - See AI-powered route suggestions
4. **Execute Swap** - Complete the cross-chain transaction
5. **Solver Dashboard** - Manage solver operations

## 📊 Supported Networks

### Mainnets
- **Ethereum** (Chain ID: 1)
- **Polygon** (Chain ID: 137) 
- **Base** (Chain ID: 8453)
- **Arbitrum** (Chain ID: 42161)
- **Optimism** (Chain ID: 10)

### Testnets
- **Sepolia** (Chain ID: 11155111)
- **Polygon Mumbai** (Chain ID: 80001)
- **Base Sepolia** (Chain ID: 84532)
- **Arbitrum Sepolia** (Chain ID: 421614)
- **Optimism Sepolia** (Chain ID: 11155420)

## 🔒 Security

### Smart Contract Security
- **OpenZeppelin** standard libraries
- **ReentrancyGuard** protection
- **Access control** with role-based permissions
- **Emergency functions** for critical situations

### Privacy Protection
- **Zero-knowledge proofs** for transaction privacy
- **Commitment schemes** for swap parameters
- **Nullifier systems** to prevent double-spending

### Audit Status
- ✅ **Code Review** - Internal security review completed
- 🔄 **External Audit** - Scheduled for Q1 2025
- ✅ **Testing** - Comprehensive test coverage

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **Conventional Commits** for commit messages

## 📚 Documentation

- [Protocol Documentation](docs/protocol.md)
- [API Reference](docs/api.md)
- [Smart Contract Guide](docs/contracts.md)
- [Deployment Guide](docs/deployment.md)

## 🐛 Bug Reports

Found a bug? Please report it in our [Issues](https://github.com/your-org/unicore-protocol/issues) section.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **LayerZero** for cross-chain messaging
- **1inch** for DEX aggregation
- **OpenZeppelin** for secure smart contract libraries
- **TensorFlow.js** for AI optimization
- **snarkjs** for zero-knowledge proofs

## 📞 Support

- **Discord** - [Join our community](https://discord.gg/unicore)
- **Twitter** - [@UniCoreProtocol](https://twitter.com/UniCoreProtocol)
- **Email** - support@unicore.protocol

---

**Built with ❤️ by the UniCore Team**

*Pioneering the future of cross-chain DeFi with advanced AI optimization, zero-knowledge privacy, and universal blockchain connectivity.*
