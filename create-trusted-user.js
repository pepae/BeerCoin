// Script to create a trusted user and then approve Joe
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
  "function addTrustedUser(address user) external",
  "function registerUser(string memory username, address referrer) external",
  "function isTrusted(address user) external view returns (bool)"
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
    
    if (adminBalance < ethers.parseEther('0.02')) {
      console.error('Insufficient balance to perform operations');
      return;
    }
    
    // Create a new trusted user wallet
    const trustedUserWallet = ethers.Wallet.createRandom().connect(provider);
    console.log(`Created trusted user wallet: ${trustedUserWallet.address}`);
    console.log(`Trusted user private key: ${trustedUserWallet.privateKey}`);
    
    // Send xDAI to trusted user wallet
    console.log(`Sending 0.01 xDAI to trusted user...`);
    const tx1 = await adminWallet.sendTransaction({
      to: trustedUserWallet.address,
      value: ethers.parseEther('0.01')
    });
    console.log(`Transaction sent: ${tx1.hash}`);
    await tx1.wait();
    console.log('xDAI transfer to trusted user successful');
    
    // Connect to distributor contract with admin wallet
    const adminDistributorContract = new ethers.Contract(
      DISTRIBUTOR_ADDRESS,
      DISTRIBUTOR_ABI,
      adminWallet
    );
    
    // Add trusted user
    console.log(`Adding ${trustedUserWallet.address} as trusted user...`);
    const tx2 = await adminDistributorContract.addTrustedUser(trustedUserWallet.address);
    console.log(`Transaction sent: ${tx2.hash}`);
    await tx2.wait();
    console.log('Trusted user added successfully');
    
    // Verify trusted user status
    const isTrusted = await adminDistributorContract.isTrusted(trustedUserWallet.address);
    console.log(`Is trusted user: ${isTrusted}`);
    
    if (!isTrusted) {
      console.error('Failed to add trusted user');
      return;
    }
    
    // Connect to distributor contract with trusted user wallet
    const trustedDistributorContract = new ethers.Contract(
      DISTRIBUTOR_ADDRESS,
      DISTRIBUTOR_ABI,
      trustedUserWallet
    );
    
    // Register Joe with trusted user as referrer
    console.log(`Registering ${JOE_USERNAME} (${JOE_ADDRESS}) with trusted user as referrer...`);
    const tx3 = await trustedDistributorContract.registerUser(JOE_USERNAME, trustedUserWallet.address);
    console.log(`Transaction sent: ${tx3.hash}`);
    await tx3.wait();
    console.log('Registration successful');
    
    // Save trusted user info to file
    const trustedUserInfo = {
      address: trustedUserWallet.address,
      privateKey: trustedUserWallet.privateKey
    };
    fs.writeFileSync('/home/ubuntu/trusted-user.json', JSON.stringify(trustedUserInfo, null, 2));
    console.log('Trusted user info saved to /home/ubuntu/trusted-user.json');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

