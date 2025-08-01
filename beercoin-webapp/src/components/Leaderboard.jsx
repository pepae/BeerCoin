import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import contractServiceV2 from '../lib/contractServiceV2';

const Leaderboard = () => {
  const { wallet } = useWallet();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Initialize contract service if needed
      if (!contractServiceV2.distributorContract && wallet) {
        await contractServiceV2.initialize(wallet);
      }
      
      // Get all users with their details
      const allUsers = await contractServiceV2.getAllUsersWithDetails();
      
      // Get BEER balances for each user
      const usersWithBalances = await Promise.all(
        allUsers.map(async (user) => {
          try {
            const beerBalance = await contractServiceV2.getBeerBalance(user.address);
            return {
              ...user,
              beerBalance: parseFloat(beerBalance) || 0
            };
          } catch (err) {
            console.error(`Error getting balance for ${user.username}:`, err);
            return {
              ...user,
              beerBalance: 0
            };
          }
        })
      );
      
      // Sort by BEER balance (highest first)
      const sortedUsers = usersWithBalances.sort((a, b) => b.beerBalance - a.beerBalance);
      
      setUsers(sortedUsers);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankBadgeStyle = (rank) => {
    switch (rank) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2: return 'bg-gray-100 text-gray-800 border-gray-200';
      case 3: return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="beer-container">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="beer-container">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Leaderboard</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="beer-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="beer-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">🏆 Leaderboard</h2>
          <p className="text-muted-foreground">Top BEER token holders</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-3 text-primary hover:text-primary/80 disabled:opacity-50"
          title="Refresh leaderboard"
        >
          <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
        </button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👥</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
          <p className="text-muted-foreground">No registered users found yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = wallet && user.address.toLowerCase() === wallet.address.toLowerCase();
            
            return (
              <div
                key={user.address}
                className={`beer-card ${
                  isCurrentUser ? 'ring-2 ring-primary ring-opacity-50 bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {/* Rank Badge */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-sm ${getRankBadgeStyle(rank)} flex-shrink-0`}>
                      <span>
                        {rank <= 3 ? getRankIcon(rank).split('').slice(0, 2).join('') : `${rank}`}
                      </span>
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">
                          {user.username}
                          {isCurrentUser && (
                            <span className="ml-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </h3>
                        {user.isTrusted && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800 font-medium flex-shrink-0">
                            ⭐
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        <span className="font-mono truncate">{formatAddress(user.address)}</span>
                        {user.referralCount > 0 && (
                          <span className="flex items-center">
                            👥 {user.referralCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* BEER Balance */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-primary">
                      {user.beerBalance.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">BEER</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Summary */}
      {users.length > 0 && (
        <div className="mt-8 beer-card bg-muted/50">
          <h3 className="font-semibold mb-4">📊 Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">{users.length}</div>
              <div className="text-xs text-muted-foreground">Total Users</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">
                {users.filter(u => u.isTrusted).length}
              </div>
              <div className="text-xs text-muted-foreground">Trusted Users</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-600">
                {users.reduce((sum, u) => sum + (u.referralCount || 0), 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Referrals</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-600">
                {users.reduce((sum, u) => sum + u.beerBalance, 0).toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">Total BEER</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
