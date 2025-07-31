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
      
      // Convert user input (e.g., 1.5) to contract format (e.g., 150)
      const multiplierValue = parseFloat(newReferrerMultiplier);
      if (isNaN(multiplierValue) || multiplierValue < 1) {
        showMessage('Multiplier must be at least 1.0', true);
        return;
      }
      
      const contractMultiplier = Math.round(multiplierValue * 100); // Convert to contract format
      
      const result = await contractServiceV2.updateReferrerMultiplier(contractMultiplier);
      
      if (result.success) {
        showMessage(`Successfully updated referrer multiplier to ${multiplierValue}x`);
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

  const handleRemoveTrustedFromUser = async (userAddress, username) => {
    try {
      setLoading(true);
      const result = await contractServiceV2.removeTrustedUser(userAddress);
      
      if (result.success) {
        showMessage(`Successfully removed trusted status from ${username}`);
        await loadContractData();
      } else {
        showMessage(result.error, true);
      }
    } catch (err) {
      showMessage(`Failed to remove trusted status from ${username}`, true);
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Please connect your wallet to access the admin panel.</p>
        </div>
      </div>
    );
  }

  if (loading && !isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You are not authorized to access this admin panel.</p>
          <p className="text-sm text-gray-500">Only the contract owner can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile-optimized header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                🍺 <span className="ml-2">Admin Panel</span>
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                distributionActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  distributionActive ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="hidden sm:inline">{distributionActive ? 'Active' : 'Inactive'}</span>
                <span className="sm:hidden">{distributionActive ? '✓' : '✗'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg shadow-sm">
            <div className="flex">
              <span className="text-red-500 mr-3">❌</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg shadow-sm">
            <div className="flex">
              <span className="text-green-500 mr-3">✅</span>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">👥</span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Users</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">⭐</span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Trusted</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{totalTrustedUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-lg">🍺</span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Rate/Day</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{parseFloat(baseRewardRate).toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-lg">🔥</span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Multiplier</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{(referrerMultiplier / 100).toFixed(1)}x</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                ⚡ Quick Actions
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleToggleDistribution}
                  disabled={loading}
                  className={`flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    distributionActive 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <span className="mr-2">{distributionActive ? '🛑' : '▶️'}</span>
                  {loading ? 'Processing...' : distributionActive ? 'Stop Distribution' : 'Start Distribution'}
                </button>
                
                <button
                  onClick={() => loadContractData()}
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <span className="mr-2">🔄</span>
                  {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
              </div>
            </div>
          </div>

          {/* Search User */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                🔍 Find User
              </h2>
            </div>
            <div className="p-4">
              <form onSubmit={handleSearchUser} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter username to search..."
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    required
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">🔍</span>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search User'}
                </button>
              </form>
              
              {searchResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{searchResult.username}</h3>
                      <p className="text-xs font-mono text-gray-500 mt-1 break-all">{searchResult.address}</p>
                    </div>
                    <div className="flex flex-col gap-1 ml-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${
                        searchResult.isTrusted 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {searchResult.isTrusted ? '⭐ Trusted' : 'Regular'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${
                        searchResult.isActive 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {searchResult.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Referrals:</span>
                      <span className="ml-1 font-semibold text-purple-600">{searchResult.referralCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Earned:</span>
                      <span className="ml-1 font-semibold text-orange-600">{parseFloat(searchResult.totalEarned).toFixed(2)} BEER</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {!searchResult.isTrusted && searchResult.isActive && (
                      <button
                        onClick={() => handlePromoteToTrusted(searchResult.address, searchResult.username)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md font-medium transition-colors disabled:opacity-50"
                      >
                        Make Trusted
                      </button>
                    )}
                    {searchResult.isTrusted && (
                      <button
                        onClick={() => handleRemoveTrustedFromUser(searchResult.address, searchResult.username)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md font-medium transition-colors disabled:opacity-50"
                      >
                        Remove Trust
                      </button>
                    )}
                    <button
                      onClick={() => handleSendXDaiToUser(searchResult.address, searchResult.username)}
                      disabled={loading}
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md font-medium transition-colors disabled:opacity-50"
                    >
                      💰 Send 0.01 xDAI
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(searchResult.address);
                        showMessage('Address copied!');
                      }}
                      className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-md font-medium transition-colors"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Tools */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                ⚙️ Admin Tools
              </h2>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Add Trusted User */}
              <div className="border border-gray-200 rounded-lg">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">Add Trusted User</h3>
                </div>
                <div className="p-4">
                  <form onSubmit={handleAddTrustedUser} className="space-y-3">
                    <input
                      type="text"
                      placeholder="User Address (0x...)"
                      value={trustUserAddress}
                      onChange={(e) => setTrustUserAddress(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Username"
                      value={trustUserUsername}
                      onChange={(e) => setTrustUserUsername(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add Trusted User'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Remove Trusted User */}
              <div className="border border-gray-200 rounded-lg">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">Remove Trusted User</h3>
                </div>
                <div className="p-4">
                  <form onSubmit={handleRemoveTrustedUser} className="space-y-3">
                    <input
                      type="text"
                      placeholder="User Address (0x...)"
                      value={removeTrustAddress}
                      onChange={(e) => setRemoveTrustAddress(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Removing...' : 'Remove Trusted User'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Send xDAI */}
              <div className="border border-gray-200 rounded-lg">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">Send xDAI</h3>
                </div>
                <div className="p-4">
                  <form onSubmit={handleSendXdai} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Recipient Address (0x...)"
                      value={sendXdaiAddress}
                      onChange={(e) => setSendXdaiAddress(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Amount (xDAI)"
                      value={sendXdaiAmount}
                      onChange={(e) => setSendXdaiAmount(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Send xDAI'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Config Updates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg">
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900 text-sm">Update Reward Rate</h3>
                  </div>
                  <div className="p-3">
                    <form onSubmit={handleUpdateRewardRate} className="space-y-3">
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="New Rate (BEER/day)"
                        value={newRewardRate}
                        onChange={(e) => setNewRewardRate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                      >
                        {loading ? 'Updating...' : 'Update Rate'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg">
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900 text-sm">Update Multiplier</h3>
                  </div>
                  <div className="p-3">
                    <form onSubmit={handleUpdateReferrerMultiplier} className="space-y-3">
                      <input
                        type="number"
                        step="0.1"
                        min="1.0"
                        placeholder="New Multiplier (e.g., 1.5 for 1.5x)"
                        value={newReferrerMultiplier}
                        onChange={(e) => setNewReferrerMultiplier(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        required
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                      >
                        {loading ? 'Updating...' : 'Update'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* All Users List - Mobile Optimized */}
          {allUsersWithDetails.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  👥 All Users ({allUsersWithDetails.length})
                </h2>
              </div>
              
              {/* Mobile-first user list */}
              <div className="divide-y divide-gray-100">
                {allUsersWithDetails
                  .sort((a, b) => {
                    if (a.isTrusted !== b.isTrusted) return b.isTrusted - a.isTrusted;
                    return a.username.localeCompare(b.username);
                  })
                  .map((user, index) => (
                    <div key={user.address} className="p-4">
                      {/* User Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{user.username}</h3>
                            {user.isTrusted && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 font-medium flex-shrink-0">
                                ⭐ Trusted
                              </span>
                            )}
                            {!user.isActive && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 font-medium flex-shrink-0">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono text-gray-500 break-all">{user.address}</p>
                        </div>
                      </div>
                      
                      {/* User Stats */}
                      <div className="flex justify-between items-center mb-3 text-sm">
                        <div className="flex items-center space-x-4">
                          <div>
                            <span className="text-gray-500">Referrals:</span>
                            <span className="ml-1 font-semibold text-purple-600">{user.referralCount}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Earned:</span>
                            <span className="ml-1 font-semibold text-orange-600">{parseFloat(user.totalEarned).toFixed(2)} BEER</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {!user.isTrusted && user.isActive && (
                          <button
                            onClick={() => handlePromoteToTrusted(user.address, user.username)}
                            disabled={loading}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md font-medium transition-colors disabled:opacity-50"
                          >
                            {loading ? '...' : 'Make Trusted'}
                          </button>
                        )}
                        {user.isTrusted && (
                          <button
                            onClick={() => handleRemoveTrustedFromUser(user.address, user.username)}
                            disabled={loading}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md font-medium transition-colors disabled:opacity-50"
                          >
                            {loading ? '...' : 'Remove Trust'}
                          </button>
                        )}
                        <button
                          onClick={() => handleSendXDaiToUser(user.address, user.username)}
                          disabled={loading}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md font-medium transition-colors disabled:opacity-50"
                        >
                          {loading ? '...' : '💰 0.01 xDAI'}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.address);
                            showMessage('Address copied!');
                          }}
                          className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-md font-medium transition-colors"
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              
              {/* Summary Stats */}
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{allUsersWithDetails.length}</div>
                    <div className="text-xs text-gray-600">Total Users</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{allUsersWithDetails.filter(u => u.isTrusted).length}</div>
                    <div className="text-xs text-gray-600">Trusted</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{allUsersWithDetails.reduce((sum, u) => sum + u.referralCount, 0)}</div>
                    <div className="text-xs text-gray-600">Referrals</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{allUsersWithDetails.reduce((sum, u) => sum + parseFloat(u.totalEarned), 0).toFixed(0)}</div>
                    <div className="text-xs text-gray-600">BEER Earned</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Loading state for users */}
          {allUsersWithDetails.length === 0 && !loading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-600">Still loading user data or no users are registered yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
