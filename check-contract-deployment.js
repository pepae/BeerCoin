// Check if the deployed contract matches our expectations
const { ethers } = require('ethers');

const DISTRIBUTOR_ADDRESS = '0x9E6233c16288949728b94FF134db1453AFfa49B4';

async function checkContractDeployment() {
  try {
    console.log('🔍 Contract Deployment Check');
    console.log('=============================');
    
    const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
    
    // Get the contract bytecode
    const contractCode = await provider.getCode(DISTRIBUTOR_ADDRESS);
    console.log('Contract exists:', contractCode !== '0x');
    console.log('Contract code length:', contractCode.length);
    
    // Try to get the contract's function selectors
    console.log('\n🔍 Checking function selectors...');
    
    // registerUserByTrusted function selector
    const iface = new ethers.Interface([
      "function registerUserByTrusted(address userAddress, string memory username) external"
    ]);
    
    const functionSelector = iface.getFunction('registerUserByTrusted').selector;
    console.log('Expected registerUserByTrusted selector:', functionSelector);
    
    // Check if the function exists by looking for the selector in the bytecode
    const normalizedCode = contractCode.toLowerCase();
    const selectorExists = normalizedCode.includes(functionSelector.slice(2).toLowerCase());
    console.log('Function selector found in bytecode:', selectorExists);
    
    // Try a simple view function call to see if the contract is responsive
    console.log('\n🧪 Testing basic contract responsiveness...');
    
    try {
      const simpleAbi = ["function distributionActive() external view returns (bool)"];
      const contract = new ethers.Contract(DISTRIBUTOR_ADDRESS, simpleAbi, provider);
      const isActive = await contract.distributionActive();
      console.log('✅ Contract responsive - distributionActive:', isActive);
    } catch (err) {
      console.log('❌ Contract not responsive:', err.message);
    }
    
    // Try to check if there's a different version deployed
    console.log('\n🔍 Checking for contract version differences...');
    
    try {
      // Try some other functions that should exist
      const testAbi = [
        "function owner() external view returns (address)",
        "function getAllTrustedUsers() external view returns (address[])",
        "function getTotalTrustedUsers() external view returns (uint256)"
      ];
      
      const contract = new ethers.Contract(DISTRIBUTOR_ADDRESS, testAbi, provider);
      
      const owner = await contract.owner();
      console.log('Contract owner:', owner);
      
      const trustedCount = await contract.getTotalTrustedUsers();
      console.log('Total trusted users:', trustedCount.toString());
      
      const trustedUsers = await contract.getAllTrustedUsers();
      console.log('Trusted users:', trustedUsers);
      
    } catch (err) {
      console.log('❌ Error checking contract functions:', err.message);
    }
    
    // Check if we can see any events from recent transactions
    console.log('\n📜 Checking recent events...');
    try {
      const eventAbi = [
        "event UserRegisteredByTrusted(address indexed user, string username, address indexed trustedUser)"
      ];
      
      const contract = new ethers.Contract(DISTRIBUTOR_ADDRESS, eventAbi, provider);
      const currentBlock = await provider.getBlockNumber();
      
      // Look for events in the last 1000 blocks
      const events = await contract.queryFilter('UserRegisteredByTrusted', currentBlock - 1000, currentBlock);
      console.log('Recent UserRegisteredByTrusted events:', events.length);
      
      if (events.length > 0) {
        console.log('Latest event:', {
          user: events[events.length - 1].args[0],
          username: events[events.length - 1].args[1],
          trustedUser: events[events.length - 1].args[2]
        });
      }
      
    } catch (err) {
      console.log('❌ Error checking events:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Contract check error:', error.message);
  }
}

checkContractDeployment();
