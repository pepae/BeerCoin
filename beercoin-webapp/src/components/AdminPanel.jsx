import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import contractServiceV2 from '../lib/contractServiceV2';

const AdminPanel = () => {
  const { wallet } = useWallet();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Contract state
  const [distributionActive, setDistributionActive] = useState(false);
  const [baseRewardRate, setBaseRewardRate] = useState('0');
  const [referrerMultiplier, setReferrerMultiplier] = useState(0);
  const [multiplierBase, setMultiplierBase] = useState(100);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalTrustedUsers, setTotalTrustedUsers] = useState(0);
  const [allTrustedUsers, setAllTrustedUsers] = useState([]);
  const [allUsersWithDetails, setAllUsersWithDetails] = useState([]);

  // Form states
  const [trustUserAddress, setTrustUserAddress] = useState('');
  const [trustUserUsername, setTrustUserUsername] = useState('');
  const [removeTrustAddress, setRemoveTrustAddress] = useState('');
  const [newRewardRate, setNewRewardRate] = useState('');
  const [newReferrerMultiplier, setNewReferrerMultiplier] = useState('');
  const [sendXdaiAddress, setSendXdaiAddress] = useState('');
  const [sendXdaiAmount, setSendXdaiAmount] = useState('');
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  // Check if current user is owner and load contract data
  useEffect(() => {
    if (!wallet) return;
    
    const checkOwnership = async () => {
      setLoading(true);
      try {
        const ownerStatus = await contractServiceV2.isOwner(wallet.address);
        setIsOwner(ownerStatus);
        
        if (ownerStatus) {
          await loadContractData();
        }
      } catch (err) {
        console.error('Error checking ownership:', err);
        setError('Failed to verify admin status');
      } finally {
        setLoading(false);
      }
    };
    
    checkOwnership();
  }, [wallet]);

  const loadContractData = async () => {
    try {
      const [
        active,
        rate,
        multiplier,
        base,
        totalUsersCount,
        trustedCount,
        trustedUsers,
        usersWithDetails
      ] = await Promise.all([
        contractServiceV2.isDistributionActive(),
        contractServiceV2.getBaseRewardRate(),
        contractServiceV2.getReferrerMultiplier(),
        contractServiceV2.getMultiplierBase(),
        contractServiceV2.getTotalUsers(),
        contractServiceV2.getTotalTrustedUsers(),
        contractServiceV2.getAllTrustedUsers(),
        contractServiceV2.getAllUsersWithDetails()
      ]);

      setDistributionActive(active);
      setBaseRewardRate(rate);
      setReferrerMultiplier(multiplier);
      setMultiplierBase(base);
      setTotalUsers(totalUsersCount);
      setTotalTrustedUsers(trustedCount);
      setAllTrustedUsers(trustedUsers);
      setAllUsersWithDetails(usersWithDetails);
    } catch (err) {
      console.error('Error loading contract data:', err);
      setError('Failed to load contract data');
    }
  };

  const showMessage = (message, isError = false) => {
    if (isError) {
      setError(message);
      setSuccess('');
    } else {
      setSuccess(message);
      setError('');
    }
    
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 5000);
  };

  const handleAddTrustedUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await contractServiceV2.addTrustedUser(trustUserAddress, trustUserUsername);
      
      if (result.success) {
        showMessage(`Successfully added trusted user: ${trustUserUsername}`);
        setTrustUserAddress('');
        setTrustUserUsername('');
        await loadContractData();
      } else {
        showMessage(result.error, true);
      }
    } catch (err) {
      showMessage('Failed to add trusted user', true);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTrustedUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await contractServiceV2.removeTrustedUser(removeTrustAddress);
      
      if (result.success) {
        showMessage('Successfully removed trusted user');
        setRemoveTrustAddress('');
        await loadContractData();
      } else {
        showMessage(result.error, true);
      }
    } catch (err) {
      showMessage('Failed to remove trusted user', true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRewardRate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await contractServiceV2.updateRewardRate(newRewardRate);
      
      if (result.success) {
        showMessage(`Successfully updated reward rate to ${newRewardRate} BEER/day`);
        setNewRewardRate('');
        await loadContractData();
      } else {
        showMessage(result.error, true);
      }
    } catch (err) {
      showMessage('Failed to update reward rate', true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReferrerMultiplier = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await contractServiceV2.updateReferrerMultiplier(newReferrerMultiplier);
      
      if (result.success) {
        showMessage(`Successfully updated referrer multiplier to ${newReferrerMultiplier}`);
        setNewReferrerMultiplier('');
        await loadContractData();
      } else {
        showMessage(result.error, true);
      }
    } catch (err) {
      showMessage('Failed to update referrer multiplier', true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDistribution = async () => {
    try {
      setLoading(true);
      const result = await contractServiceV2.toggleDistribution();
      
      if (result.success) {
        showMessage(`Distribution ${distributionActive ? 'disabled' : 'enabled'}`);
        await loadContractData();
      } else {
        showMessage(result.error, true);
      }
    } catch (err) {
      showMessage('Failed to toggle distribution', true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendXdai = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await contractServiceV2.sendXDai(sendXdaiAddress, sendXdaiAmount);
      
      if (result.success) {
        showMessage(`Successfully sent ${sendXdaiAmount} xDAI to ${sendXdaiAddress}`);
        setSendXdaiAddress('');
        setSendXdaiAmount('');
      } else {
        showMessage(result.error, true);
      }
    } catch (err) {
      showMessage('Failed to send xDAI', true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const address = await contractServiceV2.getAddressByUsername(searchUsername);
      
      if (address) {
        const userInfo = await contractServiceV2.getUserInfo(address);
        setSearchResult({
          address,
          ...userInfo
        });
      } else {
        setSearchResult(null);
        showMessage('User not found', true);
      }
    } catch (err) {
      showMessage('Failed to search user', true);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToTrusted = async (userAddress, username) => {
    try {
      setLoading(true);
      const result = await contractServiceV2.addTrustedUser(userAddress, username);
      
      if (result.success) {
        showMessage(`Successfully promoted ${username} to trusted user`);
        await loadContractData();
      } else {
        showMessage(result.error, true);
      }
    } catch (err) {
      showMessage('Failed to promote user to trusted', true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendXDaiToUser = async (userAddress, username) => {
    try {
      setLoading(true);
      const result = await contractServiceV2.sendXDai(userAddress, '0.01');
      
      if (result.success) {
        showMessage(`Successfully sent 0.01 xDAI to ${username}`);
      } else {
        showMessage(result.error || 'Failed to send xDAI', true);
      }
    } catch (err) {
      console.error('Error sending xDAI to user:', err);
      showMessage(`Failed to send xDAI to ${username}: ${err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Panel</h1>
          <p className="text-gray-600">Please connect your wallet to access the admin panel.</p>
        </div>
      </div>
    );
  }

  if (loading && !isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You are not authorized to access this admin panel.</p>
          <p className="text-sm text-gray-500">Only the contract owner can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">🍺 BeerCoin Admin Panel</h1>
          <p className="text-sm sm:text-base text-gray-600">Contract administration and management</p>
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}
        </div>

        {/* Contract Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Distribution Status</h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${distributionActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={distributionActive ? 'text-green-600' : 'text-red-600'}>
                {distributionActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Base Reward Rate</h3>
            <p className="text-xl font-bold text-orange-600">{parseFloat(baseRewardRate).toFixed(4)} BEER/day</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Referrer Multiplier</h3>
            <p className="text-xl font-bold text-blue-600">{referrerMultiplier}/100</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Total Users</h3>
            <p className="text-xl font-bold text-purple-600">{totalUsers} ({totalTrustedUsers} trusted)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Management */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">👥 User Management</h2>
            
            {/* Search User */}
            <form onSubmit={handleSearchUser} className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Search User</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Username"
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? 'Searching...' : 'Search User'}
                </button>
              </div>
              
              {searchResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-900">User: {searchResult.username}</p>
                  <p className="text-sm text-gray-600 font-mono break-all">Address: {searchResult.address}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${searchResult.isTrusted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {searchResult.isTrusted ? 'Trusted' : 'Regular'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${searchResult.isActive ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                      {searchResult.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                      {searchResult.referralCount} referrals
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Total Earned: {parseFloat(searchResult.totalEarned).toFixed(4)} BEER
                  </p>
                </div>
              )}
            </form>
            
            {/* Add Trusted User */}
            <form onSubmit={handleAddTrustedUser} className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Add Trusted User</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="User Address (0x...)"
                  value={trustUserAddress}
                  onChange={(e) => setTrustUserAddress(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  required
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={trustUserUsername}
                  onChange={(e) => setTrustUserUsername(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? 'Adding...' : 'Add Trusted User'}
                </button>
              </div>
            </form>

            {/* Remove Trusted User */}
            <form onSubmit={handleRemoveTrustedUser} className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Remove Trusted User</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="User Address (0x...)"
                  value={removeTrustAddress}
                  onChange={(e) => setRemoveTrustAddress(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? 'Removing...' : 'Remove Trusted User'}
                </button>
              </div>
            </form>

            {/* Send xDAI */}
            <form onSubmit={handleSendXdai}>
              <h3 className="font-semibold text-gray-700 mb-3">Send xDAI</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Recipient Address (0x...)"
                  value={sendXdaiAddress}
                  onChange={(e) => setSendXdaiAddress(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  required
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Amount (xDAI)"
                  value={sendXdaiAmount}
                  onChange={(e) => setSendXdaiAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? 'Sending...' : 'Send xDAI'}
                </button>
              </div>
            </form>
          </div>

          {/* Contract Configuration */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">⚙️ Contract Configuration</h2>
            
            {/* Toggle Distribution */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Distribution Control</h3>
              <button
                onClick={handleToggleDistribution}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base ${
                  distributionActive 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? 'Updating...' : distributionActive ? 'Disable Distribution' : 'Enable Distribution'}
              </button>
            </div>

            {/* Update Reward Rate */}
            <form onSubmit={handleUpdateRewardRate} className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Update Reward Rate</h3>
              <div className="space-y-3">
                <input
                  type="number"
                  step="0.0001"
                  placeholder="New Rate (BEER per day)"
                  value={newRewardRate}
                  onChange={(e) => setNewRewardRate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? 'Updating...' : 'Update Reward Rate'}
                </button>
              </div>
            </form>

            {/* Update Referrer Multiplier */}
            <form onSubmit={handleUpdateReferrerMultiplier}>
              <h3 className="font-semibold text-gray-700 mb-3">Update Referrer Multiplier</h3>
              <div className="space-y-3">
                <input
                  type="number"
                  placeholder="New Multiplier (e.g., 10 for 10/100)"
                  value={newReferrerMultiplier}
                  onChange={(e) => setNewReferrerMultiplier(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  required
                />
                <p className="text-xs sm:text-sm text-gray-600">
                  Current: {referrerMultiplier}/{multiplierBase} = {((referrerMultiplier / multiplierBase) * 100).toFixed(1)}% per referral
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? 'Updating...' : 'Update Multiplier'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* All Users List */}
        {allUsersWithDetails.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mt-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
              👥 All Users ({allUsersWithDetails.length})
            </h2>
            
            {/* Mobile-friendly user cards for small screens */}
            <div className="block md:hidden space-y-4">
              {allUsersWithDetails
                .sort((a, b) => {
                  // Sort by trusted status first, then by username
                  if (a.isTrusted !== b.isTrusted) return b.isTrusted - a.isTrusted;
                  return a.username.localeCompare(b.username);
                })
                .map((user, index) => (
                  <div key={user.address} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {/* User Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <span className="font-medium text-lg">{user.username}</span>
                          {user.isTrusted && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              ⭐ Trusted
                            </span>
                          )}
                          {!user.isActive && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-gray-600 break-all mb-2">
                          {user.address}
                        </div>
                      </div>
                    </div>
                    
                    {/* User Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            user.isTrusted 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.isTrusted ? 'Trusted' : 'Regular'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Referrals:</span>
                        <div className="mt-1 font-semibold text-purple-600">
                          {user.referralCount}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Total Earned:</span>
                        <div className="mt-1 font-medium text-orange-600">
                          {parseFloat(user.totalEarned).toFixed(4)} BEER
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {!user.isTrusted && user.isActive && (
                        <button
                          onClick={() => handlePromoteToTrusted(user.address, user.username)}
                          disabled={loading}
                          className="flex-1 min-w-0 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Processing...' : 'Make Trusted'}
                        </button>
                      )}
                      {user.isTrusted && (
                        <button
                          onClick={() => handleRemoveTrustedUser({ preventDefault: () => {}, target: { removeUserAddress: { value: user.address } } })}
                          disabled={loading}
                          className="flex-1 min-w-0 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Processing...' : 'Remove Trust'}
                        </button>
                      )}
                      <button
                        onClick={() => handleSendXDaiToUser(user.address, user.username)}
                        disabled={loading}
                        className="flex-1 min-w-0 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Sending...' : 'Send 0.01 xDAI'}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(user.address);
                          showMessage('Address copied to clipboard');
                        }}
                        className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            
            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold">Username</th>
                    <th className="text-left py-3 px-4 font-semibold">Address</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Referrals</th>
                    <th className="text-left py-3 px-4 font-semibold">Total Earned</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsersWithDetails
                    .sort((a, b) => {
                      // Sort by trusted status first, then by username
                      if (a.isTrusted !== b.isTrusted) return b.isTrusted - a.isTrusted;
                      return a.username.localeCompare(b.username);
                    })
                    .map((user, index) => (
                    <tr key={user.address} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span className="font-medium">{user.username}</span>
                          {user.isTrusted && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              ⭐ Trusted
                            </span>
                          )}
                          {!user.isActive && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-gray-600 break-all">
                          {user.address.substring(0, 6)}...{user.address.substring(user.address.length - 4)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            user.isTrusted 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.isTrusted ? 'Trusted User' : 'Regular User'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-purple-600">
                          {user.referralCount}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-orange-600">
                          {parseFloat(user.totalEarned).toFixed(4)} BEER
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col space-y-2">
                          {!user.isTrusted && user.isActive && (
                            <button
                              onClick={() => handlePromoteToTrusted(user.address, user.username)}
                              disabled={loading}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {loading ? '...' : 'Make Trusted'}
                            </button>
                          )}
                          {user.isTrusted && (
                            <button
                              onClick={() => handleRemoveTrustedUser({ preventDefault: () => {}, target: { removeUserAddress: { value: user.address } } })}
                              disabled={loading}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {loading ? '...' : 'Remove Trust'}
                            </button>
                          )}
                          <button
                            onClick={() => handleSendXDaiToUser(user.address, user.username)}
                            disabled={loading}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {loading ? '...' : 'Send 0.01 xDAI'}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(user.address);
                              showMessage('Address copied to clipboard');
                            }}
                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
                          >
                            Copy Address
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {allUsersWithDetails.length}
                </div>
                <div className="text-xs sm:text-sm text-blue-600">Total Users</div>
              </div>
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {allUsersWithDetails.filter(u => u.isTrusted).length}
                </div>
                <div className="text-xs sm:text-sm text-green-600">Trusted Users</div>
              </div>
              <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">
                  {allUsersWithDetails.reduce((sum, u) => sum + u.referralCount, 0)}
                </div>
                <div className="text-xs sm:text-sm text-purple-600">Total Referrals</div>
              </div>
              <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">
                  {allUsersWithDetails.reduce((sum, u) => sum + parseFloat(u.totalEarned), 0).toFixed(2)}
                </div>
                <div className="text-xs sm:text-sm text-orange-600">Total BEER Earned</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading state for users */}
        {allUsersWithDetails.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mt-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">👥 All Users</h2>
            <p className="text-sm sm:text-base text-gray-600 text-center py-8">No users found or still loading user data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
