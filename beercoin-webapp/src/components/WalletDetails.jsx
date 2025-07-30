import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

const WalletDetails = () => {
  const { wallet, clearWallet } = useWallet();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copied, setCopied] = useState('');

  if (!wallet) {
    return null;
  }

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out? Make sure you have backed up your wallet information.')) {
      clearWallet();
    }
  };

  return (
    <div className="beer-card mb-6">
      <h2 className="text-xl font-bold mb-4">Wallet Details</h2>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Address:</span>
          <div className="flex items-center">
            <span className="font-mono">{formatAddress(wallet.address)}</span>
            <button
              className="ml-2 p-1 text-primary hover:text-primary/80"
              onClick={() => copyToClipboard(wallet.address, 'address')}
            >
              {copied === 'address' ? '✓' : '📋'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Private Key:</span>
          <div className="flex items-center">
            <span className="font-mono">
              {showPrivateKey ? formatAddress(wallet.privateKey) : '••••••••••••••••'}
            </span>
            <button
              className="ml-2 p-1 text-primary hover:text-primary/80"
              onClick={() => setShowPrivateKey(!showPrivateKey)}
            >
              {showPrivateKey ? '👁️' : '👁️‍🗨️'}
            </button>
            <button
              className="ml-2 p-1 text-primary hover:text-primary/80"
              onClick={() => copyToClipboard(wallet.privateKey, 'privateKey')}
            >
              {copied === 'privateKey' ? '✓' : '📋'}
            </button>
          </div>
        </div>
      </div>
      
      {wallet.mnemonic && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Recovery Phrase:</span>
            <div className="flex items-center">
              <button
                className="ml-2 p-1 text-primary hover:text-primary/80"
                onClick={() => setShowMnemonic(!showMnemonic)}
              >
                {showMnemonic ? '👁️' : '👁️‍🗨️'}
              </button>
              <button
                className="ml-2 p-1 text-primary hover:text-primary/80"
                onClick={() => copyToClipboard(wallet.mnemonic, 'mnemonic')}
              >
                {copied === 'mnemonic' ? '✓' : '📋'}
              </button>
            </div>
          </div>
          
          {showMnemonic && (
            <div className="p-3 bg-muted rounded-lg mb-3">
              <p className="font-mono text-sm break-all">{wallet.mnemonic}</p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Backup Information</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Make sure to save your private key and recovery phrase in a secure location. 
          You will need them to recover your wallet if you clear your browser data.
        </p>
        
        <button
          className="beer-button-secondary w-full"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default WalletDetails;

