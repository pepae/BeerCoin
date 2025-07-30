import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import contractServiceV2 from '../lib/contractServiceV2';

const TEST_WALLETS = {
  admin: {
    address: '0xD63caa57701e7F4b4C54Bf29558c409c17Ed7434',
    privateKey: '0x2eaec2ca13050a04f3522794ef285147a378326ade3ea23ca25b31cd1b382c29'
  }
};

const TestMode = () => {
  const { wallet, refreshWallet } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logs, setLogs] = useState([]);
  const [testWallets, setTestWallets] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  
  useEffect(() => {
    // Load saved test wallets from localStorage
    const savedWallets = localStorage.getItem('testWallets');
    if (savedWallets) {
      try {
        setTestWallets(JSON.parse(savedWallets));
      } catch (err) {
        console.error('Error loading test wallets:', err);
      }
    }
  }, []);
  
  const addLog = (message) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };
  
  const saveTestWallets = (wallets) => {
    localStorage.setItem('testWallets', JSON.stringify(wallets));
    setTestWallets(wallets);
  };
  
  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Create a new random wallet
      const newWallet = ethers.Wallet.createRandom();
      addLog(`Created new wallet: ${newWallet.address}`);
      
      // Add to test wallets
      const updatedWallets = [
        ...testWallets,
        {
          name: `Wallet ${testWallets.length + 1}`,
          address: newWallet.address,
          privateKey: newWallet.privateKey,
          isTrusted: false,
          isRegistered: false
        }
      ];
      
      saveTestWallets(updatedWallets);
      setSuccess(`Created new wallet: ${newWallet.address}`);
    } catch (err) {
      console.error('Error creating wallet:', err);
      setError(err.message || 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSwitchWallet = async (wallet) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Store wallet in localStorage
      localStorage.setItem('privateKey', wallet.privateKey);
      
      addLog(`Switched to wallet: ${wallet.address}`);
      setSuccess(`Switched to wallet: ${wallet.address}`);
      
      // Refresh wallet context
      await refreshWallet();
    } catch (err) {
      console.error('Error switching wallet:', err);
      setError(err.message || 'Failed to switch wallet');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMakeTrusted = async (walletIndex) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (!newUsername) {
        setError('Please enter a username');
        setLoading(false);
        return;
      }
      
      const targetWallet = testWallets[walletIndex];
      
      // Connect to provider
      const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
      
      // Use admin wallet
      const adminWallet = new ethers.Wallet(TEST_WALLETS.admin.privateKey, provider);
      addLog(`Using admin wallet: ${adminWallet.address}`);
      
      // Send some xDAI to the target wallet
      const tx1 = await adminWallet.sendTransaction({
        to: targetWallet.address,
        value: ethers.parseEther('0.01')
      });
      await tx1.wait();
      addLog(`Sent 0.01 xDAI to ${targetWallet.address}: ${tx1.hash}`);
      
      // Add as trusted user
      const distributorAddress = contractServiceV2.distributorAddress;
      const distributorAbi = [
        "function addTrustedUser(address user, string memory username) external"
      ];
      
      const distributorContract = new ethers.Contract(
        distributorAddress,
        distributorAbi,
        adminWallet
      );
      
      const tx2 = await distributorContract.addTrustedUser(targetWallet.address, newUsername);
      await tx2.wait();
      addLog(`Added ${targetWallet.address} as trusted user: ${tx2.hash}`);
      
      // Update wallet in state
      const updatedWallets = [...testWallets];
      updatedWallets[walletIndex] = {
        ...targetWallet,
        isTrusted: true,
        username: newUsername,
        isRegistered: true
      };
      
      saveTestWallets(updatedWallets);
      setSuccess(`Added ${targetWallet.address} as trusted user`);
      setNewUsername('');
    } catch (err) {
      console.error('Error making wallet trusted:', err);
      setError(err.message || 'Failed to make wallet trusted');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegisterWallet = async (walletIndex, trustedWalletIndex) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (!newUsername) {
        setError('Please enter a username');
        setLoading(false);
        return;
      }
      
      const targetWallet = testWallets[walletIndex];
      const trustedWallet = testWallets[trustedWalletIndex];
      
      if (!trustedWallet.isTrusted) {
        setError('Selected referrer is not a trusted user');
        setLoading(false);
        return;
      }
      
      // Connect to provider
      const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com');
      
      // Use trusted wallet
      const trustedWalletInstance = new ethers.Wallet(trustedWallet.privateKey, provider);
      addLog(`Using trusted wallet: ${trustedWalletInstance.address}`);
      
      // Send some xDAI to the target wallet
      const tx1 = await trustedWalletInstance.sendTransaction({
        to: targetWallet.address,
        value: ethers.parseEther('0.005')
      });
      await tx1.wait();
      addLog(`Sent 0.005 xDAI to ${targetWallet.address}: ${tx1.hash}`);
      
      // Connect target wallet
      const targetWalletInstance = new ethers.Wallet(targetWallet.privateKey, provider);
      
      // Register user
      const distributorAddress = contractServiceV2.distributorAddress;
      const distributorAbi = [
        "function registerUser(string memory username, address referrer) external"
      ];
      
      const distributorContract = new ethers.Contract(
        distributorAddress,
        distributorAbi,
        targetWalletInstance
      );
      
      const tx2 = await distributorContract.registerUser(newUsername, trustedWallet.address);
      await tx2.wait();
      addLog(`Registered ${targetWallet.address} with username ${newUsername}: ${tx2.hash}`);
      
      // Update wallet in state
      const updatedWallets = [...testWallets];
      updatedWallets[walletIndex] = {
        ...targetWallet,
        isRegistered: true,
        username: newUsername,
        referrer: trustedWallet.address
      };
      
      saveTestWallets(updatedWallets);
      setSuccess(`Registered ${targetWallet.address} as ${newUsername}`);
      setNewUsername('');
    } catch (err) {
      console.error('Error registering wallet:', err);
      setError(err.message || 'Failed to register wallet');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed bottom-0 right-0 p-2 z-50">
      <button
        className="beer-button-secondary"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Hide Test Mode' : 'Test Mode'}
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-4 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Test Mode</h2>
              <button
                className="beer-button-secondary"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Test Wallets</h3>
              <button
                className="beer-button w-full mb-2"
                onClick={handleCreateWallet}
                disabled={loading}
              >
                Create New Test Wallet
              </button>
              
              {testWallets.length === 0 ? (
                <p className="text-muted-foreground">No test wallets created yet</p>
              ) : (
                <div className="space-y-2">
                  {testWallets.map((testWallet, index) => (
                    <div key={index} className="border border-border p-2 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{testWallet.name || `Wallet ${index + 1}`}</p>
                          <p className="text-xs text-muted-foreground">{testWallet.address}</p>
                          {testWallet.username && (
                            <p className="text-xs">Username: {testWallet.username}</p>
                          )}
                          <div className="flex gap-2 mt-1">
                            {testWallet.isTrusted && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                Trusted
                              </span>
                            )}
                            {testWallet.isRegistered && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                Registered
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          className="beer-button-secondary"
                          onClick={() => handleSwitchWallet(testWallet)}
                          disabled={loading}
                        >
                          Use
                        </button>
                      </div>
                      
                      {!testWallet.isTrusted && (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            className="beer-input flex-1"
                            placeholder="Username"
                            disabled={loading}
                            onChange={(e) => setNewUsername(e.target.value)}
                          />
                          <button
                            className="beer-button-secondary"
                            onClick={() => handleMakeTrusted(index)}
                            disabled={loading}
                          >
                            Make Trusted
                          </button>
                        </div>
                      )}
                      
                      {!testWallet.isRegistered && testWallets.some(w => w.isTrusted) && (
                        <div className="mt-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="beer-input flex-1"
                              placeholder="Username"
                              disabled={loading}
                              onChange={(e) => setNewUsername(e.target.value)}
                            />
                            <select className="beer-input">
                              {testWallets
                                .filter(w => w.isTrusted)
                                .map((w, i) => (
                                  <option key={i} value={testWallets.indexOf(w)}>
                                    {w.username || `Wallet ${testWallets.indexOf(w) + 1}`}
                                  </option>
                                ))}
                            </select>
                            <button
                              className="beer-button-secondary"
                              onClick={() => handleRegisterWallet(
                                index, 
                                testWallets.findIndex(w => w.isTrusted)
                              )}
                              disabled={loading}
                            >
                              Register
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {(error || success) && (
              <div className={`p-3 rounded-lg mb-4 ${
                error ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
              }`}>
                {error || success}
              </div>
            )}
            
            <div className="mt-4">
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
        </div>
      )}
    </div>
  );
};

export default TestMode;

