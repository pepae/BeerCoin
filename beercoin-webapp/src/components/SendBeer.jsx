import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import useContractData from '../hooks/useContractData';

const SendBeer = () => {
  const { wallet, balance } = useWallet();
  const { beerBalance, transferBeer, transferXDai } = useContractData();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenType, setTokenType] = useState('BEER'); // 'BEER' or 'xDAI'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  if (!wallet) {
    return null;
  }

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleRecipientChange = (e) => {
    setRecipient(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!recipient.trim() || !amount.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setError('Invalid recipient address');
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Invalid amount');
      return;
    }
    
    const currentBalance = tokenType === 'BEER' ? parseFloat(beerBalance) : parseFloat(balance);
    if (amountValue > currentBalance) {
      setError('Insufficient balance');
      return;
    }
    
    setError('');
    setShowConfirm(true);
  };

  const handleConfirmSend = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (tokenType === 'BEER') {
        await transferBeer(recipient, amount);
      } else {
        await transferXDai(recipient, amount);
      }
      
      setSuccess(`Successfully sent ${amount} ${tokenType} to ${recipient.substring(0, 6)}...${recipient.substring(recipient.length - 4)}`);
      setRecipient('');
      setAmount('');
      setShowConfirm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error(`Error sending ${tokenType}:`, err);
      setError(err.message || `Failed to send ${tokenType}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="beer-container">
      <h2 className="text-2xl font-bold mb-4 text-center">Send Tokens</h2>
      <p className="text-center text-muted-foreground mb-6">
        Send BEER tokens or xDAI to other users
      </p>
      
      {!showConfirm ? (
        <form onSubmit={handleSubmit}>
          {/* Token Type Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Token Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`p-3 rounded-lg border text-center transition-colors ${
                  tokenType === 'BEER' 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background border-border hover:bg-muted'
                }`}
                onClick={() => {
                  setTokenType('BEER');
                  setAmount(''); // Clear amount when switching
                }}
              >
                <div className="font-medium">BEER</div>
                <div className="text-xs opacity-75">
                  Balance: {parseFloat(beerBalance).toFixed(4)}
                </div>
              </button>
              <button
                type="button"
                className={`p-3 rounded-lg border text-center transition-colors ${
                  tokenType === 'xDAI' 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background border-border hover:bg-muted'
                }`}
                onClick={() => {
                  setTokenType('xDAI');
                  setAmount(''); // Clear amount when switching
                }}
              >
                <div className="font-medium">xDAI</div>
                <div className="text-xs opacity-75">
                  Balance: {parseFloat(balance).toFixed(4)}
                </div>
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Recipient Address</label>
            <input
              type="text"
              className="beer-input w-full"
              placeholder="0x..."
              value={recipient}
              onChange={handleRecipientChange}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Amount</label>
            <div className="relative">
              <input
                type="text"
                className="beer-input w-full pr-20"
                placeholder="0.0"
                value={amount}
                onChange={handleAmountChange}
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <span className="text-muted-foreground">{tokenType}</span>
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                Balance: {tokenType === 'BEER' 
                  ? `${parseFloat(beerBalance).toFixed(4)} BEER`
                  : `${parseFloat(balance).toFixed(4)} xDAI`
                }
              </span>
              <button
                type="button"
                className="text-xs text-primary"
                onClick={() => setAmount(tokenType === 'BEER' ? beerBalance : balance)}
              >
                Max
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            className="beer-button w-full"
            disabled={loading}
          >
            Continue
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-center">
              {error}
            </div>
          )}
        </form>
      ) : (
        <div>
          <div className="beer-card mb-6">
            <h3 className="text-lg font-medium mb-4">Confirm Transaction</h3>
            
            <div className="mb-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Recipient:</span>
                <span className="font-mono">
                  {recipient.substring(0, 6)}...{recipient.substring(recipient.length - 4)}
                </span>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{amount} {tokenType}</span>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Token:</span>
                <span>{tokenType}</span>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Network:</span>
                <span>Gnosis Chain</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              className="beer-button-secondary flex-1"
              onClick={() => setShowConfirm(false)}
              disabled={loading}
            >
              Back
            </button>
            <button
              className="beer-button flex-1"
              onClick={handleConfirmSend}
              disabled={loading}
            >
              {loading ? `Sending...` : `Send ${tokenType}`}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-center">
              {error}
            </div>
          )}
        </div>
      )}
      
      {success && (
        <div className="beer-toast bg-primary text-primary-foreground">
          {success}
        </div>
      )}
    </div>
  );
};

export default SendBeer;

