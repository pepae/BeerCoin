# BeerCoin DApp - Quick Start Guide

## 🚀 Deployed Contracts (Gnosis Chain Mainnet)

- **BeerCoin (BEER)**: `0x5CcC0D40017aE800f7b432e9E76b4d31572A240B`
- **BeerCoinDistributor**: `0x9E6233c16288949728b94FF134db1453AFfa49B4`
- **Admin Wallet**: `0xD63caa57701e7F4b4C54Bf29558c409c17Ed7434`

## 🔑 Admin Wallet Information

**Private Key**: `0x21aab9ef55d0aa8aa92f965918225cfc6e001705510bd2dc6392e0e7afd95362`
**Mnemonic**: `decline shadow trick pledge faculty animal island swarm pause pact unusual frown`

⚠️ **IMPORTANT**: Keep this private key secure! It has admin control over both contracts.

## 📱 Immediate Actions You Can Take

### 1. Add Your First Trusted User
```javascript
// Using ethers.js or web3
const distributor = new ethers.Contract(
  "0x9E6233c16288949728b94FF134db1453AFfa49B4",
  distributorABI,
  adminSigner
);

await distributor.addTrustedUser("0xYourTrustedUserAddress", "username");
```

### 2. View Contract on Block Explorer
- **BeerCoin**: https://gnosisscan.io/address/0x5CcC0D40017aE800f7b432e9E76b4d31572A240B
- **Distributor**: https://gnosisscan.io/address/0x9E6233c16288949728b94FF134db1453AFfa49B4

### 3. Check Current Status
```javascript
// Check if distribution is active
const isActive = await distributor.distributionActive();

// Check reward rate
const rewardRate = await distributor.baseRewardRate();
console.log(`Current rate: ${ethers.formatEther(rewardRate)} BEER/second`);

// Check total users
const totalUsers = await distributor.getTotalUsers();
```

## 🎯 Next Steps for DApp Development

1. **Frontend Integration**: Build a React/Vue frontend to interact with contracts
2. **Passkey Wallet**: Implement the passkey wallet as mentioned in requirements
3. **User Interface**: Create forms for registration, claiming rewards, admin functions
4. **Real-time Updates**: Add WebSocket or polling for live reward updates

## 🛠 Contract ABIs

The contract ABIs are available in the `artifacts/contracts/` directory after compilation:
- `artifacts/contracts/BeerCoin.sol/BeerCoin.json`
- `artifacts/contracts/BeerCoinDistributor.sol/BeerCoinDistributor.json`

## 📊 Current Configuration

- **Base Reward Rate**: 0.001 BEER per second
- **Referrer Multiplier**: 1.5x per referral
- **Max Supply**: 100,000,000 BEER
- **Distribution**: Active
- **Initial Supply**: 1,000,000 BEER (now owned by distributor)

## 🔧 Testing the System

1. **Add a trusted user** (admin function)
2. **Register regular users** with referrals
3. **Wait some time** for rewards to accumulate
4. **Claim rewards** to see tokens distributed
5. **Check balances** on the BeerCoin contract

## 💡 Pro Tips

- Use the integration test as a reference for the complete user journey
- The distributor contract owns the BeerCoin, so it can mint tokens for rewards
- All usernames are stored on-chain and must be unique
- Rewards accumulate continuously while distribution is active
- Admin can modify parameters without redeploying contracts

---

**Your BeerCoin DApp is ready to use! 🍺**

