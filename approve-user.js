// Script to approve a user registration and send xDAI
const { ethers } = require('ethers');
const fs = require('fs');

// Load wallet info from environment variable
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error('PRIVATE_KEY environment variable not set');
  process.exit(1);
}

// Contract addresses
const DISTRIBUTOR_ADDRESS = '0x9E6233c16288949728b94FF134db1453AFfa49B4';

// User info from QR code
const USER_ADDRESS = '0x6A3D32d247E125F314ADf28c80De3c5A41EC1d33';
const USERNAME = 'Joe';

// ABI for the distributor contract (simplified for this function)
const DISTRIBUTOR_ABI = [
  "function registerUser(string memory username, address referrer) external",
  "function isRegistered(address user) external view returns (bool)"
];

async function main() {
  try {
    // Connect to Gnosis Chain
    const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
    
    // Create wallet instance
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`Using wallet: ${wallet.address}`);
    
    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`Wallet balance: ${ethers.formatEther(balance)} xDAI`);
    
    if (balance < ethers.parseEther('0.01')) {
      console.error('Insufficient balance to perform operations');
      return;
    }
    
    // Send xDAI to user
    console.log(`Sending 0.001 xDAI to ${USER_ADDRESS}...`);
    const tx1 = await wallet.sendTransaction({
      to: USER_ADDRESS,
      value: ethers.parseEther('0.001')
    });
    console.log(`Transaction sent: ${tx1.hash}`);
    await tx1.wait();
    console.log('xDAI transfer successful');
    
    // Connect to distributor contract
    const distributorContract = new ethers.Contract(
      DISTRIBUTOR_ADDRESS,
      DISTRIBUTOR_ABI,
      wallet
    );
    
    // Check if user is already registered
    const isRegistered = await distributorContract.isRegistered(USER_ADDRESS);
    if (isRegistered) {
      console.log(`User ${USER_ADDRESS} is already registered`);
      return;
    }
    
    // Register user with trusted user as referrer
    console.log(`Registering user ${USERNAME} with address ${USER_ADDRESS}...`);
    const tx2 = await distributorContract.registerUser(USERNAME, wallet.address);
    console.log(`Registration transaction sent: ${tx2.hash}`);
    await tx2.wait();
    console.log('Registration successful');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

