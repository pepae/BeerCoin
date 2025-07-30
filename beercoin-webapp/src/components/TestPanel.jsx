import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { switchToTestWallet, createRandomTestWallet, clearTestWallet, TEST_WALLETS } from '../lib/testMode';
import contractServiceV2 from '../lib/contractServiceV2';
import walletService from '../lib/walletService';
import { ethers } from 'ethers';

const TestPanel = () => {
  const { wallet, isRegistered, isTrusted, refreshWallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [logs, setLogs] = useState([]);
  
  const addLog = (message) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };
  
  const handleSwitchWallet = async (walletType) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const result = switchToTestWallet(walletType);
      
      if (result) {
        addLog(`Switched to ${walletType} wallet`);
        setSuccess(`Switched to ${walletType} wallet`);
        await refreshWallet();
      } else {
        setError(`Failed to switch to ${walletType} wallet`);
      }
    } catch (err) {
      console.error('Error switching wallet:', err);
      setError(err.message || 'Failed to switch wallet');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateRandomWallet = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const result = createRandomTestWallet();
      
      if (result) {
        addLog(`Created random wallet: ${result.address}`);
        setSuccess(`Created random wallet: ${result.address}`);
        await refreshWallet();
      } else {
        setError('Failed to create random wallet');
      }
    } catch (err) {
      console.error('Error creating wallet:', err);
      setError(err.message || 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClearWallet = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const result = clearTestWallet();
      
      if (result) {
        addLog('Cleared wallet');
        setSuccess('Cleared wallet');
        await refreshWallet();
      } else {
        setError('Failed to clear wallet');
      }
    } catch (err) {
      console.error('Error clearing wallet:', err);
      setError(err.message || 'Failed to clear wallet');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddTrustedUser = async () => {
    if (!wallet) {
      setError('No wallet found');
      return;
    }
    
    if (!newUsername) {
      setError('Please enter a username');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Create a new random wallet
      const newWallet = ethers.Wallet.createRandom();
      addLog(`Created new wallet for trusted user: ${newWallet.address}`);
      
      // Send some xDAI to the new wallet
      const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
      const adminWallet = new ethers.Wallet(TEST_WALLETS.admin.privateKey, provider);
      
      const tx1 = await adminWallet.sendTransaction({
        to: newWallet.address,
        value: ethers.parseEther('0.01')
      });
      await tx1.wait();
      addLog(`Sent 0.01 xDAI to new wallet: ${tx1.hash}`);
      
      // Add the new wallet as a trusted user
      const distributorAddress = contractServiceV2.distributorAddress;
      const distributorAbi = [
        "function addTrustedUser(address user, string memory username) external"
      ];
      
      const distributorContract = new ethers.Contract(
        distributorAddress,
        distributorAbi,
        adminWallet
      );
      
      const tx2 = await distributorContract.addTrustedUser(newWallet.address, newUsername);
      await tx2.wait();
      addLog(`Added ${newWallet.address} as trusted user: ${tx2.hash}`);
      
      // Save the new trusted user info
      const trustedUsers = JSON.parse(localStorage.getItem('trustedUsers') || '[]');
      trustedUsers.push({
        address: newWallet.address,
        privateKey: newWallet.privateKey,
        username: newUsername
      });
      localStorage.setItem('trustedUsers', JSON.stringify(trustedUsers));
      
      setSuccess(`Added ${newUsername} (${newWallet.address}) as trusted user`);
      setNewUsername('');
    } catch (err) {
      console.error('Error adding trusted user:', err);
      setError(err.message || 'Failed to add trusted user');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegisterUser = async () => {
    if (!wallet) {
      setError('No wallet found');
      return;
    }
    
    if (!newUsername) {
      setError('Please enter a username');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Get trusted users
      const trustedUsers = JSON.parse(localStorage.getItem('trustedUsers') || '[]');
      
      if (trustedUsers.length === 0) {
        setError('No trusted users available');
        return;
      }
      
      // Use the first trusted user
      const trustedUser = trustedUsers[0];
      addLog(`Using trusted user: ${trustedUser.username} (${trustedUser.address})`);
      
      // Register the current wallet with the trusted user as referrer
      const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
      const trustedWallet = new ethers.Wallet(trustedUser.privateKey, provider);
      
      // Send some xDAI to the current wallet for gas
      const tx1 = await trustedWallet.sendTransaction({
        to: wallet.address,
        value: ethers.parseEther('0.005')
      });
      await tx1.wait();
      addLog(`Sent 0.005 xDAI to current wallet: ${tx1.hash}`);
      
      // Register the user
      const tx2 = await contractServiceV2.registerUser(newUsername, trustedUser.address);
      await tx2.wait();
      addLog(`Registered user with username ${newUsername}: ${tx2.hash}`);
      
      setSuccess(`Registered as ${newUsername} with referrer ${trustedUser.username}`);
      setNewUsername('');
      await refreshWallet();
    } catch (err) {
      console.error('Error registering user:', err);
      setError(err.message || 'Failed to register user');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClaimRewards = async () => {
    if (!wallet || !isRegistered) {
      setError('No registered wallet found');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const tx = await contractServiceV2.claimRewards();
      await tx.wait();
      addLog(`Claimed rewards: ${tx.hash}`);
      
      setSuccess('Rewards claimed successfully');
      await refreshWallet();
    } catch (err) {
      console.error('Error claiming rewards:', err);
      setError(err.message || 'Failed to claim rewards');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="beer-container mt-8 p-4 border border-border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Test Panel</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Switch Wallet</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className="beer-button-secondary"
            onClick={() => handleSwitchWallet('admin')}
            disabled={loading}
          >
            Admin
          </button>
          <button
            className="beer-button-secondary"
            onClick={() => handleSwitchWallet('trustedUser')}
            disabled={loading}
          >
            Trusted User
          </button>
          <button
            className="beer-button-secondary"
            onClick={() => handleSwitchWallet('newUser')}
            disabled={loading}
          >
            New User
          </button>
          <button
            className="beer-button-secondary"
            onClick={handleCreateRandomWallet}
            disabled={loading}
          >
            Random Wallet
          </button>
          <button
            className="beer-button-secondary"
            onClick={handleClearWallet}
            disabled={loading}
          >
            Clear Wallet
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Add Trusted User</h3>
        <div className="flex gap-2">
          <input
            type="text"
            className="beer-input flex-1"
            placeholder="Username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            disabled={loading}
          />
          <button
            className="beer-button"
            onClick={handleAddTrustedUser}
            disabled={loading || !wallet}
          >
            Add Trusted User
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Register User</h3>
        <div className="flex gap-2">
          <input
            type="text"
            className="beer-input flex-1"
            placeholder="Username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            disabled={loading}
          />
          <button
            className="beer-button"
            onClick={handleRegisterUser}
            disabled={loading || !wallet || isRegistered}
          >
            Register
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Claim Rewards</h3>
        <button
          className="beer-button w-full"
          onClick={handleClaimRewards}
          disabled={loading || !wallet || !isRegistered}
        >
          Claim Rewards
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-primary/10 text-primary rounded-lg">
          {success}
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Logs</h3>
        <div className="bg-muted p-3 rounded-lg h-40 overflow-y-auto text-sm font-mono">
          {logs.length === 0 ? (
            <p className="text-muted-foreground">No logs yet</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPanel;

