# BeerCoin Web App Maintenance Guide

## Overview

The BeerCoin Web App is a decentralized application (DApp) that integrates with the BeerCoin ERC20 token and Distributor smart contracts on Gnosis Chain. It provides a user-friendly interface for users to create wallets, register with referrals, earn BEER tokens, and transfer tokens to other users.

## Project Structure

- `/src/components/`: UI components
- `/src/contexts/`: React context providers
- `/src/lib/`: Service modules for wallet, contracts, and QR codes
- `/src/contracts/`: Smart contract ABIs
- `/src/assets/`: Images and other static assets
- `/src/config.js`: Application configuration

## Key Files

- `src/App.jsx`: Main application component
- `src/contexts/WalletContext.jsx`: Wallet state management
- `src/lib/walletService.js`: Wallet creation and management
- `src/lib/contractService.js`: Smart contract interaction
- `src/lib/qrService.js`: QR code generation and scanning

## Smart Contract Integration

The app integrates with two smart contracts on Gnosis Chain:

1. **BeerCoin (BEER)**: ERC20 token contract
   - Address: `0x5CcC0D40017aE800f7b432e9E76b4d31572A240B`

2. **BeerCoinDistributor**: Token distribution contract
   - Address: `0x9E6233c16288949728b94FF134db1453AFfa49B4`

## Configuration

The app configuration is stored in `src/config.js`. Key settings include:

- `CONTRACT_ADDRESSES`: Addresses of deployed smart contracts
- `RPC_URL`: Gnosis Chain RPC endpoint
- `POLLING_INTERVAL`: Interval for real-time balance updates
- `GAS_AMOUNT`: Amount of xDAI to send for gas fees
- `QR_CONFIG`: QR code generation settings
- `STORAGE_KEYS`: Local storage key names

## Maintenance Tasks

### Updating Smart Contract Addresses

If the smart contracts are redeployed, update the addresses in `src/config.js`:

```javascript
export const CONTRACT_ADDRESSES = {
  BEER_TOKEN: 'new_token_address',
  DISTRIBUTOR: 'new_distributor_address',
};
```

### Modifying Gas Fee Amount

To change the amount of xDAI sent to new users for gas fees:

```javascript
export const APP_CONFIG = {
  // ...
  gasAmount: '0.002', // Update this value
  // ...
};
```

### Adjusting Polling Interval

To change how frequently balances are updated:

```javascript
export const APP_CONFIG = {
  // ...
  pollingInterval: 10000, // Update this value (in milliseconds)
  // ...
};
```

## Deployment

The app is built using Vite and can be deployed as a static website.

### Build Process

```bash
# Install dependencies
pnpm install

# Development server
pnpm run dev

# Production build
pnpm run build
```

The production build outputs to the `dist/` directory, which can be deployed to any static hosting service.

## Future Enhancements

1. **Passkey Integration**: Implement WebAuthn/passkey support for improved security
2. **Transaction History**: Add a page to view transaction history
3. **Notifications**: Add push notifications for rewards and referrals
4. **Dark Mode**: Implement theme switching
5. **Multiple Languages**: Add internationalization support

## Troubleshooting

### Common Issues

1. **Connection Issues**:
   - Check if the RPC_URL in config.js is accessible
   - Verify that the user has an internet connection

2. **Contract Interaction Failures**:
   - Ensure the contract addresses are correct
   - Check if the user has enough xDAI for gas fees

3. **QR Code Scanning Problems**:
   - Verify camera permissions are granted
   - Ensure adequate lighting for scanning

### Support

For technical support or questions about the BeerCoin Web App, please contact the development team or refer to the project documentation.

---

Last updated: July 29, 2025

