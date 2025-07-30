# BeerCoin V2 Deployment Guide

This guide covers deploying the updated BeerCoin V2 system with the improved registration flow where trusted users can register new users directly.

## 🔄 What's New in V2

### Smart Contract Changes
- **New Function**: `registerUserByTrusted(address userAddress, string username)` - Allows trusted users to register new users directly
- **Improved Flow**: Trusted users scan QR codes and approve registrations in one transaction
- **Backward Compatibility**: Original `registerUser` function still available

### Web App Changes
- **Simplified Registration**: New users only enter username and generate QR code
- **Trusted User Approval**: Trusted users scan QR codes to approve registrations
- **Updated Contract Service**: Uses V2 contracts with new registration method

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **Wallet with xDAI** on Gnosis Chain for deployment
3. **Git** for cloning the repository

## 🚀 Deployment Steps

### 1. Smart Contract Deployment

#### Option A: Deploy New V2 Contracts

```bash
# Navigate to the smart contract directory
cd beercoin-dapp

# Install dependencies
npm install

# Create .env file with your private key
echo "PRIVATE_KEY=your_private_key_here" > .env
echo "GNOSIS_RPC_URL=https://rpc.gnosischain.com" >> .env

# Deploy V2 contracts to Gnosis Chain
npx hardhat ignition deploy ignition/modules/BeerCoinDAppV2.js --network gnosis

# Save the deployed contract addresses
```

#### Option B: Use Existing V1 Contracts (if compatible)

If you want to use the existing V1 contracts, you can update the web app to use the legacy registration flow.

### 2. Web App Configuration

```bash
# Navigate to the web app directory
cd beercoin-webapp

# Install dependencies
npm install

# Update contract addresses in src/lib/contractServiceV2.js
# Replace the placeholder addresses with your deployed contract addresses:
# - BEER_COIN_ADDRESS: Your BeerCoinV2 contract address
# - DISTRIBUTOR_ADDRESS: Your BeerCoinDistributorV2 contract address
```

### 3. Update Contract Service

Edit `src/lib/contractServiceV2.js`:

```javascript
// Update these addresses with your deployed contracts
const BEER_COIN_ADDRESS = 'YOUR_BEERCOIN_V2_ADDRESS';
const DISTRIBUTOR_ADDRESS = 'YOUR_DISTRIBUTOR_V2_ADDRESS';
```

### 4. Build and Deploy Web App

```bash
# Build the web app
npm run build

# Deploy to your hosting service (Vercel, Netlify, etc.)
# Or use the Manus deployment service:
# (This will be handled by the deployment tools)
```

## 🔧 Configuration

### Admin Setup

1. **Add Trusted Users**: Use the admin wallet to add initial trusted users
```javascript
// Example script to add trusted users
const distributor = await ethers.getContractAt("BeerCoinDistributorV2", DISTRIBUTOR_ADDRESS);
await distributor.addTrustedUser(trustedUserAddress, "username");
```

2. **Fund Admin Wallet**: Ensure the admin wallet has enough xDAI for operations

### Web App Configuration

Update `src/config.js` if needed:

```javascript
export const APP_CONFIG = {
  gasAmount: 0.001, // xDAI amount sent to new users
  // ... other config
};
```

## 📱 User Flow (V2)

### For New Users:
1. Create wallet in browser
2. Enter desired username
3. Generate QR code
4. Ask trusted user to scan QR code
5. Start earning BEER tokens after approval

### For Trusted Users:
1. Scan new user's QR code
2. Review registration details
3. Click "Approve Registration"
4. System automatically:
   - Sends 0.001 xDAI for gas fees
   - Registers user with trusted user as referrer
   - Starts token distribution

## 🧪 Testing

### Smart Contract Tests
```bash
cd beercoin-dapp
npx hardhat test
```

### Web App Testing
```bash
cd beercoin-webapp
npm run dev
# Test in browser at http://localhost:5173
```

## 🔍 Verification

### Contract Verification
1. Verify contracts on Gnosis Chain block explorer
2. Check that trusted users can call `registerUserByTrusted`
3. Verify token distribution is working

### Web App Verification
1. Test wallet creation
2. Test username registration flow
3. Test QR code generation and scanning
4. Test trusted user approval process
5. Test token claiming and transfers

## 📊 Monitoring

### Key Metrics to Monitor
- Total users registered
- Total trusted users
- Token distribution rate
- Failed transactions

### Useful Contract Calls
```javascript
// Get total users
await distributor.getTotalUsers();

// Get total trusted users
await distributor.getTotalTrustedUsers();

// Check if user is registered
await distributor.isRegistered(userAddress);

// Get user info
await distributor.getUserInfo(userAddress);
```

## 🛠 Troubleshooting

### Common Issues

1. **"User already registered" error**
   - Check if the address is already in the system
   - Verify the correct contract is being called

2. **"Must be active trusted user" error**
   - Ensure the user is marked as trusted in the contract
   - Check that the user is active

3. **Gas estimation failed**
   - Ensure sufficient xDAI balance
   - Check contract addresses are correct

4. **Username already taken**
   - Check username availability before registration
   - Use the `isUsernameAvailable` function

### Debug Commands

```bash
# Check contract deployment
npx hardhat verify --network gnosis CONTRACT_ADDRESS

# Check user status
npx hardhat console --network gnosis
# Then run: await distributor.getUserInfo("USER_ADDRESS")
```

## 🔐 Security Considerations

1. **Private Key Management**: Never commit private keys to version control
2. **Admin Controls**: Limit admin wallet access
3. **Contract Upgrades**: Consider using proxy patterns for future upgrades
4. **Rate Limiting**: Monitor for abuse of the registration system

## 📚 Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Gnosis Chain Documentation](https://docs.gnosischain.com/)
- [React Documentation](https://react.dev/)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the test files for examples
3. Check contract events on the block explorer
4. Verify all configuration is correct

---

**Note**: This V2 system maintains backward compatibility with V1 while adding the improved registration flow. You can deploy V2 contracts alongside V1 or migrate existing users as needed.

