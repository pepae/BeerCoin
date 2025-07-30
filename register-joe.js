// Script to register Joe directly using the admin wallet
const { ethers } = require('ethers');
const fs = require('fs');

// Load admin wallet info from environment variable
const adminPrivateKey = process.env.PRIVATE_KEY;
if (!adminPrivateKey) {
  console.error('PRIVATE_KEY environment variable not set');
  process.exit(1);
}

// Contract addresses
const DISTRIBUTOR_ADDRESS = '0x9E6233c16288949728b94FF134db1453AFfa49B4';

// User info from QR code
const JOE_ADDRESS = '0x6A3D32d247E125F314ADf28c80De3c5A41EC1d33';
const JOE_USERNAME = 'Joe';

// ABI for the distributor contract
const DISTRIBUTOR_ABI = [
  "function addTrustedUser(address user, string memory username) external",
  "function registerUser(string memory username, address referrer) external",
  "function isTrusted(address user) external view returns (bool)",
  "function isRegistered(address user) external view returns (bool)"
];

async function main() {
  try {
    // Connect to Gnosis Chain
    const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
    
    // Create admin wallet instance
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    console.log(`Using admin wallet: ${adminWallet.address}`);
    
    // Check admin wallet balance
    const adminBalance = await provider.getBalance(adminWallet.address);
    console.log(`Admin wallet balance: ${ethers.formatEther(adminBalance)} xDAI`);
    
    if (adminBalance < ethers.parseEther('0.01')) {
      console.error('Insufficient balance to perform operations');
      return;
    }
    
    // Connect to distributor contract with admin wallet
    const distributorContract = new ethers.Contract(
      DISTRIBUTOR_ADDRESS,
      DISTRIBUTOR_ABI,
      adminWallet
    );
    
    // Check if Joe is already registered
    const isJoeRegistered = await distributorContract.isRegistered(JOE_ADDRESS);
    if (isJoeRegistered) {
      console.log(`Joe (${JOE_ADDRESS}) is already registered`);
      return;
    }
    
    // Create a temporary trusted user
    const tempWallet = ethers.Wallet.createRandom().connect(provider);
    console.log(`Created temporary trusted user: ${tempWallet.address}`);
    
    // Add temporary wallet as trusted user
    console.log(`Adding temporary wallet as trusted user...`);
    const tx1 = await distributorContract.addTrustedUser(tempWallet.address, "temp_trusted_user");
    console.log(`Transaction sent: ${tx1.hash}`);
    await tx1.wait();
    console.log('Temporary trusted user added successfully');
    
    // Send some xDAI to Joe for gas fees
    console.log(`Sending 0.001 xDAI to Joe (${JOE_ADDRESS})...`);
    const tx2 = await adminWallet.sendTransaction({
      to: JOE_ADDRESS,
      value: ethers.parseEther('0.001')
    });
    console.log(`Transaction sent: ${tx2.hash}`);
    await tx2.wait();
    console.log('xDAI transfer to Joe successful');
    
    // Now we need to create a transaction for Joe to register
    console.log(`Creating registration transaction for Joe...`);
    console.log(`Joe will need to call registerUser("${JOE_USERNAME}", "${tempWallet.address}")`);
    console.log(`on contract ${DISTRIBUTOR_ADDRESS}`);
    
    console.log('\nJoe has been funded with 0.001 xDAI and a trusted user has been created.');
    console.log('Joe can now register using the BeerCoin web app or by directly interacting with the contract.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

