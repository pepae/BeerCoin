// Quick manual registration test with correct checksum
const { ethers } = require('ethers');

// You need to set this with your trusted user's private key
const privateKey = process.env.PRIVATE_KEY || "PUT_YOUR_TRUSTED_USER_PRIVATE_KEY_HERE";

if (privateKey === "PUT_YOUR_TRUSTED_USER_PRIVATE_KEY_HERE") {
  console.error('❌ Please set the PRIVATE_KEY environment variable');
  console.log('💡 Use: $env:PRIVATE_KEY="your_actual_private_key"');
  process.exit(1);
}

async function quickRegisterTina() {
  try {
    const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Correct checksummed address
    const TINA_ADDRESS = ethers.getAddress('0xb9532ac5ba3cb087a58d436b15b45d2ffbdb1e63');
    const USERNAME = 'tina';
    
    console.log('🎯 Quick Registration Test');
    console.log('===========================');
    console.log('Trusted user:', wallet.address);
    console.log('Target user:', TINA_ADDRESS);
    console.log('Username:', USERNAME);
    
    const abi = [
      "function registerUserByTrusted(address userAddress, string memory username) external"
    ];
    
    const contract = new ethers.Contract(
      '0x9E6233c16288949728b94FF134db1453AFfa49B4',
      abi,
      wallet
    );
    
    console.log('\n🚀 Attempting registration...');
    const tx = await contract.registerUserByTrusted(TINA_ADDRESS, USERNAME);
    
    console.log('📝 Transaction sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('✅ Success! Block:', receipt.blockNumber);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.reason) {
      console.log('🎯 Specific reason:', error.reason);
    }
  }
}

quickRegisterTina();
