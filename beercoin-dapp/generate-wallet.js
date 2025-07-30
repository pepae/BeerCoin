const { ethers } = require("ethers");
const fs = require("fs");

// Generate a new random wallet
const wallet = ethers.Wallet.createRandom();

console.log("=== NEW GNOSIS CHAIN WALLET GENERATED ===");
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);
console.log("Mnemonic:", wallet.mnemonic.phrase);
console.log("==========================================");

// Save wallet info to file
const walletInfo = {
  address: wallet.address,
  privateKey: wallet.privateKey,
  mnemonic: wallet.mnemonic.phrase
};

fs.writeFileSync('.wallet.json', JSON.stringify(walletInfo, null, 2));
console.log("Wallet info saved to .wallet.json");

// Create .env file with private key
const envContent = `PRIVATE_KEY=${wallet.privateKey}\n`;
fs.writeFileSync('.env', envContent);
console.log("Private key saved to .env file");

