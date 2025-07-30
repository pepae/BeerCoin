# BeerCoin Project Summary

## Overview

The BeerCoin project consists of two main components:

1. **Smart Contracts**: ERC20 token and distributor contracts deployed on Gnosis Chain
2. **Web App**: Mobile-first DApp for interacting with the smart contracts

## Smart Contracts

### BeerCoin (BEER) Token

- **Address**: `0x5CcC0D40017aE800f7b432e9E76b4d31572A240B`
- **Standard**: ERC20
- **Features**:
  - Minting and burning capabilities
  - Decimals: 18
  - Initial supply: 1,000,000 BEER

### BeerCoin Distributor

- **Address**: `0x9E6233c16288949728b94FF134db1453AFfa49B4`
- **Features**:
  - Referral-based user registration
  - Time-based token distribution (0.001 BEER per second)
  - Referral bonus multiplier (1.5x per referral)
  - Username storage on-chain
  - Admin controls for trusted users and distribution rates

### Admin Wallet

- **Address**: `0xD63caa57701e7F4b4C54Bf29558c409c17Ed7434`
- **Private Key**: Available in the `.wallet.json` file
- **Capabilities**:
  - Add/remove trusted users
  - Modify distribution rates
  - Pause/resume distribution
  - Kick untrusted users

## Web App

### Live URL

- **Deployed at**: [https://lerrjtei.manus.space](https://lerrjtei.manus.space)

### Key Features

1. **In-Browser Wallet**:
   - Create new wallets
   - Import existing wallets via private key or mnemonic
   - Secure local storage

2. **User Registration**:
   - Username selection
   - Referral validation
   - Trusted user detection

3. **Token Management**:
   - Real-time balance display
   - Pending rewards tracking
   - Claim rewards functionality
   - Send tokens to other users

4. **QR Code System**:
   - Generate QR codes for wallet addresses
   - Scan QR codes for referrals and transfers
   - Manual address entry alternative

5. **Mobile-First Design**:
   - Responsive layout
   - Touch-friendly interface
   - Beer-themed styling

## Technical Stack

### Smart Contracts

- **Language**: Solidity
- **Framework**: Hardhat
- **Testing**: Mocha/Chai
- **Deployment**: Hardhat scripts

### Web App

- **Framework**: React
- **Build Tool**: Vite
- **Blockchain Integration**: ethers.js
- **QR Code**: qrcode.react and html5-qrcode
- **Storage**: localStorage

## User Flow

1. **New User**:
   - Creates wallet in browser
   - Scans QR code of trusted user or enters address manually
   - Registers with username
   - Receives small amount of xDAI for gas
   - Starts earning BEER tokens

2. **Existing User**:
   - Views BEER balance and pending rewards
   - Claims rewards
   - Shares QR code to refer new users
   - Sends BEER tokens to others

3. **Trusted User**:
   - Refers new users to earn bonus rewards
   - Earns more BEER per second for each referral
   - Sends gas fees to help new users

## Future Development

1. **Passkey Integration**:
   - Implement WebAuthn/passkey support for improved security
   - Replace private key storage with passkeys

2. **Enhanced Features**:
   - Transaction history
   - Push notifications
   - Dark mode
   - Multiple languages

3. **Expanded Ecosystem**:
   - BeerCoin marketplace
   - Integration with real-world beer purchases
   - Community governance

## Documentation

- **Smart Contracts**: `/beercoin-dapp/README.md`
- **Quick Start Guide**: `/beercoin-dapp/QUICK_START.md`
- **Web App Maintenance**: `/beercoin-webapp/MAINTENANCE.md`

## Conclusion

The BeerCoin project provides a complete solution for a referral-based token distribution system on Gnosis Chain. The smart contracts handle the token economics and distribution logic, while the web app provides an intuitive interface for users to interact with the system. The project is fully functional and ready for real-world use.

