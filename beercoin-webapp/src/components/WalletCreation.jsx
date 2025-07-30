import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import beerIcon from '../assets/beer-icon.svg';

const WalletCreation = () => {
  const { createWallet, importWalletFromPrivateKey, importWalletFromMnemonic } = useWallet();
  const [activeTab, setActiveTab] = useState('create');
  const [privateKey, setPrivateKey] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await createWallet();
      setSuccess('Wallet created successfully!');
    } catch (err) {
      setError(err.message || 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleImportPrivateKey = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (!privateKey.trim()) {
        setError('Please enter a private key');
        return;
      }
      
      await importWalletFromPrivateKey(privateKey);
      setSuccess('Wallet imported successfully!');
      setPrivateKey('');
    } catch (err) {
      setError(err.message || 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleImportMnemonic = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (!mnemonic.trim()) {
        setError('Please enter a mnemonic phrase');
        return;
      }
      
      await importWalletFromMnemonic(mnemonic);
      setSuccess('Wallet imported successfully!');
      setMnemonic('');
    } catch (err) {
      setError(err.message || 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="beer-container">
      <div className="flex flex-col items-center justify-center">
        <img src={beerIcon} alt="BeerCoin" className="w-24 h-24 mb-4" />
        <h1 className="beer-logo mb-2">BeerCoin</h1>
        <p className="text-center text-muted-foreground mb-8">
          Create or import your wallet to start earning and sharing BEER tokens
        </p>
        
        {/* Tabs */}
        <div className="flex w-full mb-6 rounded-full bg-muted p-1">
          <button
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'create' ? 'bg-primary text-primary-foreground' : 'text-foreground'
            }`}
            onClick={() => setActiveTab('create')}
          >
            Create New
          </button>
          <button
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'privateKey' ? 'bg-primary text-primary-foreground' : 'text-foreground'
            }`}
            onClick={() => setActiveTab('privateKey')}
          >
            Private Key
          </button>
          <button
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === 'mnemonic' ? 'bg-primary text-primary-foreground' : 'text-foreground'
            }`}
            onClick={() => setActiveTab('mnemonic')}
          >
            Mnemonic
          </button>
        </div>
        
        {/* Create Wallet */}
        {activeTab === 'create' && (
          <div className="w-full">
            <p className="text-center mb-4">
              Create a new wallet to start using BeerCoin. Your wallet will be stored securely in your browser.
            </p>
            <button
              className="beer-button w-full"
              onClick={handleCreateWallet}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create New Wallet'}
            </button>
          </div>
        )}
        
        {/* Import Private Key */}
        {activeTab === 'privateKey' && (
          <div className="w-full">
            <p className="text-center mb-4">
              Import an existing wallet using your private key.
            </p>
            <input
              type="password"
              className="beer-input w-full mb-4"
              placeholder="Enter private key (0x...)"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
            />
            <button
              className="beer-button w-full"
              onClick={handleImportPrivateKey}
              disabled={loading || !privateKey.trim()}
            >
              {loading ? 'Importing...' : 'Import Wallet'}
            </button>
          </div>
        )}
        
        {/* Import Mnemonic */}
        {activeTab === 'mnemonic' && (
          <div className="w-full">
            <p className="text-center mb-4">
              Import an existing wallet using your 12-word recovery phrase.
            </p>
            <textarea
              className="beer-input w-full mb-4 min-h-[100px]"
              placeholder="Enter mnemonic phrase (12 words separated by spaces)"
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
            />
            <button
              className="beer-button w-full"
              onClick={handleImportMnemonic}
              disabled={loading || !mnemonic.trim()}
            >
              {loading ? 'Importing...' : 'Import Wallet'}
            </button>
          </div>
        )}
        
        {/* Error and Success Messages */}
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-center">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mt-4 p-3 bg-primary/10 text-primary rounded-lg text-center">
            {success}
          </div>
        )}
        
        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground mt-8 text-center">
          Your wallet is stored locally in your browser. Make sure to back up your private key or mnemonic phrase.
          We never store your keys on our servers.
        </p>
      </div>
    </div>
  );
};

export default WalletCreation;

