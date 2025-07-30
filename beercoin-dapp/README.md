# BeerCoin DApp - Referral-Based Token Distribution System

A decentralized application (DApp) built on Gnosis Chain featuring the BeerCoin (BEER) ERC20 token and a sophisticated referral-based distribution system.

## 🚀 Deployed Contracts (Gnosis Chain Mainnet)

- **BeerCoin (BEER)**: `0x5CcC0D40017aE800f7b432e9E76b4d31572A240B`
- **BeerCoinDistributor**: `0x9E6233c16288949728b94FF134db1453AFfa49B4`
- **Deployer/Admin**: `0xD63caa57701e7F4b4C54Bf29558c409c17Ed7434`

## 📋 Overview

The BeerCoin DApp consists of two main smart contracts:

### 1. BeerCoin (BEER) - ERC20 Token
- **Symbol**: BEER
- **Decimals**: 18
- **Max Supply**: 100,000,000 BEER
- **Initial Supply**: 1,000,000 BEER (minted to deployer)
- **Features**: Mintable by owner, burnable, standard ERC20 functionality

### 2. BeerCoinDistributor - Referral Distribution System
- **Time-based rewards**: Users earn tokens per second
- **Referral system**: New users must be referred by trusted users
- **Multiplier rewards**: Trusted users earn more for each referral
- **Admin controls**: Manage trusted users, kick users, control distribution

## 🎯 Key Features

### Referral Mechanics
- New users need referral from 1 trusted user to join
- Trusted users can refer unlimited new users
- Each referral increases the trusted user's earning multiplier
- Usernames are stored on-chain for easy identification

### Time-Based Distribution
- Base reward rate: 0.001 BEER per second
- Referral multiplier: 1.5x per referred user
- Continuous earning while distribution is active
- Users can claim rewards anytime

### Admin Functions
- Add/remove trusted users
- Kick inactive users from distribution
- Toggle distribution on/off
- Modify reward rates and multipliers

## 🛠 Technical Specifications

### BeerCoin Contract Functions
```solidity
// Minting (owner only)
function mint(address to, uint256 amount) external onlyOwner

// Burning
function burn(uint256 amount) external
function burnFrom(address from, uint256 amount) external

// Standard ERC20 functions
function transfer(address to, uint256 amount) external returns (bool)
function approve(address spender, uint256 amount) external returns (bool)
// ... and more
```

### BeerCoinDistributor Contract Functions
```solidity
// User Registration
function registerUser(string memory username, address referrer) external

// Admin Functions
function addTrustedUser(address user, string memory username) external onlyOwner
function removeTrustedUser(address user) external onlyOwner
function kickUser(address user) external onlyOwner

// Reward System
function calculatePendingRewards(address user) public view returns (uint256)
function claimRewards() external

// Configuration
function updateRewardRate(uint256 newRate) external onlyOwner
function updateReferrerMultiplier(uint256 newMultiplier) external onlyOwner
function toggleDistribution() external onlyOwner
```

## 📊 Usage Examples

### For Admin (Contract Owner)
```javascript
// Add a trusted user
await distributor.addTrustedUser("0x123...", "alice_trusted");

// Update reward rate to 0.002 BEER per second
await distributor.updateRewardRate(ethers.parseEther("0.002"));

// Pause distribution
await distributor.toggleDistribution();
```

### For Trusted Users
```javascript
// Check user info
const userInfo = await distributor.getUserInfo("0x123...");
console.log(`Referrals: ${userInfo.referralCount}`);

// Claim rewards (includes referral bonus)
await distributor.claimRewards();
```

### For Regular Users
```javascript
// Register with referral (must be referred by trusted user)
await distributor.registerUser("bob_user", "0x456..."); // trusted user address

// Check pending rewards
const pending = await distributor.calculatePendingRewards("0x123...");
console.log(`Pending: ${ethers.formatEther(pending)} BEER`);

// Claim rewards
await distributor.claimRewards();
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Hardhat

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file:
```
PRIVATE_KEY=your_private_key_here
```

### Testing
```bash
# Run all tests
npm test

# Run specific test files
npx hardhat test test/BeerCoin.test.js
npx hardhat test test/BeerCoinDistributor.test.js
npx hardhat test test/Integration.test.js
```

### Local Deployment
```bash
# Deploy to local Hardhat network
npx hardhat ignition deploy ./ignition/modules/BeerCoinDApp.js --network hardhat

# Or use the deployment script
npx hardhat run scripts/deploy.js --network hardhat
```

### Mainnet Deployment
```bash
# Deploy to Gnosis Chain
npx hardhat run scripts/deploy.js --network gnosis

# Check balance
npx hardhat run scripts/check-balance.js --network gnosis
```

## 🏗 Architecture

### Smart Contract Architecture
```
BeerCoin (ERC20)
    ↓ (ownership transferred)
BeerCoinDistributor
    ├── User Management
    ├── Referral System
    ├── Time-based Rewards
    └── Admin Controls
```

### User Hierarchy
```
Admin (Contract Owner)
    ├── Can add/remove trusted users
    ├── Can kick users
    └── Can modify distribution parameters
    
Trusted Users
    ├── Can refer new users
    ├── Earn base rewards + referral multiplier
    └── Can be elevated from regular users
    
Regular Users
    ├── Must be referred by trusted users
    ├── Earn base rewards
    └── Can be elevated to trusted
```

## 📈 Reward Calculation

### Base Rewards
```
Base Reward = Time Elapsed (seconds) × Base Rate (0.001 BEER/second)
```

### Referral Bonus (for Trusted Users)
```
Referral Bonus = Base Reward × Multiplier (1.5x) × Referral Count
Total Reward = Base Reward + Referral Bonus
```

### Example
- Trusted user with 3 referrals
- 1 hour (3600 seconds) elapsed
- Base reward: 3600 × 0.001 = 3.6 BEER
- Referral bonus: 3.6 × 1.5 × 3 = 16.2 BEER
- **Total reward: 19.8 BEER**

## 🔐 Security Features

- **Access Control**: OpenZeppelin's Ownable for admin functions
- **Reentrancy Protection**: ReentrancyGuard for claim functions
- **Input Validation**: Comprehensive checks for all parameters
- **Safe Math**: Built-in overflow protection in Solidity 0.8+
- **Tested**: 50+ comprehensive unit and integration tests

## 🌐 Network Information

### Gnosis Chain Mainnet
- **Chain ID**: 100
- **RPC URL**: https://rpc.gnosischain.com
- **Explorer**: https://gnosisscan.io/
- **Native Token**: xDAI

### Contract Verification
Contracts can be verified on GnosisScan:
- BeerCoin: https://gnosisscan.io/address/0x5CcC0D40017aE800f7b432e9E76b4d31572A240B
- BeerCoinDistributor: https://gnosisscan.io/address/0x9E6233c16288949728b94FF134db1453AFfa49B4

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📞 Support

For questions or support, please create an issue in the repository or contact the development team.

---

**Built with ❤️ for the Gnosis Chain ecosystem**

