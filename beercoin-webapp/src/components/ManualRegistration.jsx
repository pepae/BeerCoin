import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import contractServiceV2 from '../lib/contractServiceV2';
import { APP_CONFIG } from '../config';

const ManualRegistration = () => {
  const { wallet, isTrusted, sendXDai } = useWallet();
  const [formData, setFormData] = useState({
    address: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.address || !formData.username) {
      throw new Error('Please fill in all fields');
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.address)) {
      throw new Error('Invalid Ethereum address format');
    }
    
    if (formData.username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!wallet || !isTrusted) {
      setError('Only trusted users can register new users');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Validate form
      validateForm();
      
      // First, send gas to the new user
      console.log('Sending xDAI for gas...');
      await sendXDai(formData.address, APP_CONFIG.gasAmount);
      
      // Then register the user
      console.log('Registering user...');
      const result = await contractServiceV2.registerUserByTrusted(
        formData.address, 
        formData.username
      );
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setSuccess(`Successfully registered ${formData.username}! Transaction: ${result.txHash}`);
      
      // Clear form after success
      setFormData({ address: '', username: '' });
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register user');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) {
    return (
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Manual User Registration</h2>
        <p className="text-muted-foreground">Please connect your wallet first.</p>
      </div>
    );
  }

  if (!isTrusted) {
    return (
      <div className="bg-card rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Manual User Registration</h2>
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          <p className="font-medium">Only trusted users can register new users</p>
          <p className="text-sm mt-1">You need to be a trusted user to access this feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">Manual User Registration</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="address" className="block text-sm font-medium mb-2">
            User Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            className="beer-input w-full"
            placeholder="0x..."
            value={formData.address}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            The Ethereum address of the user to register
          </p>
        </div>
        
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            className="beer-input w-full"
            placeholder="Enter username"
            value={formData.username}
            onChange={handleInputChange}
            required
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Must be unique, 3+ characters, letters/numbers/underscores only
          </p>
        </div>
        
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <p className="text-sm">{success}</p>
          </div>
        )}
        
        <button
          type="submit"
          className="beer-button w-full"
          disabled={loading || !formData.address || !formData.username}
        >
          {loading ? 'Registering User...' : 'Register User'}
        </button>
      </form>
      
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Process:</h4>
        <ol className="text-sm text-muted-foreground space-y-1">
          <li>1. Send {APP_CONFIG.gasAmount} xDAI to user for gas fees</li>
          <li>2. Register user with you as referrer</li>
          <li>3. User can start earning BEER tokens</li>
        </ol>
      </div>
    </div>
  );
};

export default ManualRegistration;
