// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./BeerCoinV2.sol";

/**
 * @title BeerCoinDistributorV2
 * @dev Distributes BeerCoin tokens based on referral system and time-based rewards
 * 
 * Features:
 * - Trusted users can register new users directly
 * - Time-based token earning (tokens per second)
 * - Referrers earn multiplier rewards for each person they refer
 * - Admin controls for managing trusted users and distribution
 */
contract BeerCoinDistributorV2 is Ownable, ReentrancyGuard {
    BeerCoinV2 public immutable beerCoin;
    
    // Distribution parameters
    uint256 public baseRewardRate = 1 * 10**15; // 0.001 BEER per second (base rate)
    uint256 public referrerMultiplier = 50; // 0.5x multiplier per referral (50/100)
    uint256 public constant MULTIPLIER_BASE = 100;
    bool public distributionActive = true;
    
    // User data structures
    struct User {
        string username;
        bool isTrusted;
        bool isActive;
        address referrer;
        uint256 referralCount;
        uint256 lastClaimTime;
        uint256 totalEarned;
        uint256 joinTime;
    }
    
    mapping(address => User) public users;
    mapping(string => address) public usernameToAddress;
    mapping(address => bool) public isRegistered;
    
    address[] public allUsers;
    address[] public trustedUsers;
    
    // Events
    event UserRegistered(address indexed user, string username, address indexed referrer);
    event UserRegisteredByTrusted(address indexed user, string username, address indexed trustedUser);
    event UserTrusted(address indexed user, string username);
    event UserUntrusted(address indexed user, string username);
    event UserKicked(address indexed user, string username);
    event TokensClaimed(address indexed user, uint256 amount);
    event DistributionToggled(bool active);
    event RewardRateUpdated(uint256 newRate);
    event ReferrerMultiplierUpdated(uint256 newMultiplier);
    
    constructor(address _beerCoin, address initialOwner) Ownable(initialOwner) {
        require(_beerCoin != address(0), "BeerCoin address cannot be zero");
        beerCoin = BeerCoinV2(_beerCoin);
    }
    
    modifier onlyActiveDistribution() {
        require(distributionActive, "Distribution is not active");
        _;
    }
    
    modifier onlyRegisteredUser() {
        require(isRegistered[msg.sender], "User not registered");
        _;
    }
    
    modifier onlyActiveUser() {
        require(users[msg.sender].isActive, "User is not active");
        _;
    }
    
    modifier onlyTrustedUser() {
        require(isRegistered[msg.sender] && users[msg.sender].isTrusted && users[msg.sender].isActive, "Must be active trusted user");
        _;
    }
    
    /**
     * @dev Register a new user with referral (only trusted users can refer)
     * @param username Unique username for the user
     * @param referrer Address of the trusted user who is referring
     */
    function registerUser(string memory username, address referrer) external onlyActiveDistribution {
        require(!isRegistered[msg.sender], "User already registered");
        require(bytes(username).length > 0, "Username cannot be empty");
        require(usernameToAddress[username] == address(0), "Username already taken");
        require(referrer != msg.sender, "Cannot refer yourself");
        require(users[referrer].isTrusted, "Referrer must be trusted");
        require(users[referrer].isActive, "Referrer must be active");
        
        // Register the user
        users[msg.sender] = User({
            username: username,
            isTrusted: false,
            isActive: true,
            referrer: referrer,
            referralCount: 0,
            lastClaimTime: block.timestamp,
            totalEarned: 0,
            joinTime: block.timestamp
        });
        
        // Update mappings
        isRegistered[msg.sender] = true;
        usernameToAddress[username] = msg.sender;
        allUsers.push(msg.sender);
        
        // Update referrer's referral count
        users[referrer].referralCount++;
        
        emit UserRegistered(msg.sender, username, referrer);
    }
    
    /**
     * @dev Trusted users can register new users directly
     * @param userAddress Address of the new user to register
     * @param username Unique username for the new user
     */
    function registerUserByTrusted(address userAddress, string memory username) external onlyTrustedUser onlyActiveDistribution {
        require(userAddress != address(0), "User address cannot be zero");
        require(!isRegistered[userAddress], "User already registered");
        require(bytes(username).length > 0, "Username cannot be empty");
        require(usernameToAddress[username] == address(0), "Username already taken");
        require(userAddress != msg.sender, "Cannot register yourself");
        
        // Register the user with the trusted user as referrer
        users[userAddress] = User({
            username: username,
            isTrusted: false,
            isActive: true,
            referrer: msg.sender,
            referralCount: 0,
            lastClaimTime: block.timestamp,
            totalEarned: 0,
            joinTime: block.timestamp
        });
        
        // Update mappings
        isRegistered[userAddress] = true;
        usernameToAddress[username] = userAddress;
        allUsers.push(userAddress);
        
        // Update referrer's referral count
        users[msg.sender].referralCount++;
        
        emit UserRegisteredByTrusted(userAddress, username, msg.sender);
    }
    
    /**
     * @dev Admin function to add a trusted user directly
     * @param user Address of the user to make trusted
     * @param username Username for the trusted user
     */
    function addTrustedUser(address user, string memory username) external onlyOwner {
        require(user != address(0), "User address cannot be zero");
        require(bytes(username).length > 0, "Username cannot be empty");
        require(usernameToAddress[username] == address(0), "Username already taken");
        
        if (!isRegistered[user]) {
            // Register new trusted user
            users[user] = User({
                username: username,
                isTrusted: true,
                isActive: true,
                referrer: address(0),
                referralCount: 0,
                lastClaimTime: block.timestamp,
                totalEarned: 0,
                joinTime: block.timestamp
            });
            
            isRegistered[user] = true;
            usernameToAddress[username] = user;
            allUsers.push(user);
            trustedUsers.push(user);
        } else {
            // Elevate existing user to trusted
            require(!users[user].isTrusted, "User is already trusted");
            users[user].isTrusted = true;
            trustedUsers.push(user);
        }
        
        emit UserTrusted(user, username);
    }
    
    /**
     * @dev Admin function to remove trusted status from a user
     * @param user Address of the user to untrust
     */
    function removeTrustedUser(address user) external onlyOwner {
        require(isRegistered[user], "User not registered");
        require(users[user].isTrusted, "User is not trusted");
        
        users[user].isTrusted = false;
        
        // Remove from trusted users array
        for (uint256 i = 0; i < trustedUsers.length; i++) {
            if (trustedUsers[i] == user) {
                trustedUsers[i] = trustedUsers[trustedUsers.length - 1];
                trustedUsers.pop();
                break;
            }
        }
        
        emit UserUntrusted(user, users[user].username);
    }
    
    /**
     * @dev Admin function to kick a user from distribution
     * @param user Address of the user to kick
     */
    function kickUser(address user) external onlyOwner {
        require(isRegistered[user], "User not registered");
        require(users[user].isActive, "User is already inactive");
        
        users[user].isActive = false;
        
        emit UserKicked(user, users[user].username);
    }
    
    /**
     * @dev Calculate pending rewards for a user
     * @param user Address of the user
     * @return pendingRewards Amount of tokens the user can claim
     */
    function calculatePendingRewards(address user) public view returns (uint256 pendingRewards) {
        if (!isRegistered[user] || !users[user].isActive || !distributionActive) {
            return 0;
        }
        
        User memory userData = users[user];
        uint256 timeElapsed = block.timestamp - userData.lastClaimTime;
        
        // Base reward calculation
        uint256 baseReward = timeElapsed * baseRewardRate;
        
        // Add referral bonus if user has referrals
        if (userData.referralCount > 0) {
            uint256 referralBonus = (baseReward * referrerMultiplier * userData.referralCount) / MULTIPLIER_BASE;
            pendingRewards = baseReward + referralBonus;
        } else {
            pendingRewards = baseReward;
        }
        
        return pendingRewards;
    }
    
    /**
     * @dev Claim pending rewards
     */
    function claimRewards() external onlyRegisteredUser onlyActiveUser onlyActiveDistribution nonReentrant {
        uint256 pendingRewards = calculatePendingRewards(msg.sender);
        require(pendingRewards > 0, "No rewards to claim");
        
        // Update user's last claim time and total earned
        users[msg.sender].lastClaimTime = block.timestamp;
        users[msg.sender].totalEarned += pendingRewards;
        
        // Mint and transfer tokens to user
        beerCoin.mint(msg.sender, pendingRewards);
        
        emit TokensClaimed(msg.sender, pendingRewards);
    }
    
    /**
     * @dev Admin function to toggle distribution on/off
     */
    function toggleDistribution() external onlyOwner {
        distributionActive = !distributionActive;
        emit DistributionToggled(distributionActive);
    }
    
    /**
     * @dev Admin function to update base reward rate
     * @param newRate New reward rate in tokens per second
     */
    function updateRewardRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Reward rate must be greater than 0");
        baseRewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }
    
    /**
     * @dev Admin function to update referrer multiplier
     * @param newMultiplier New multiplier (e.g., 150 for 1.5x)
     */
    function updateReferrerMultiplier(uint256 newMultiplier) external onlyOwner {
        require(newMultiplier >= MULTIPLIER_BASE, "Multiplier must be at least 100 (1x)");
        referrerMultiplier = newMultiplier;
        emit ReferrerMultiplierUpdated(newMultiplier);
    }
    
    /**
     * @dev Get user information
     * @param user Address of the user
     */
    function getUserInfo(address user) external view returns (
        string memory username,
        bool isTrusted,
        bool isActive,
        address referrer,
        uint256 referralCount,
        uint256 totalEarned,
        uint256 pendingRewards,
        uint256 joinTime
    ) {
        require(isRegistered[user], "User not registered");
        
        User storage userData = users[user];
        return (
            userData.username,
            userData.isTrusted,
            userData.isActive,
            userData.referrer,
            userData.referralCount,
            userData.totalEarned,
            calculatePendingRewards(user),
            userData.joinTime
        );
    }
    
    /**
     * @dev Get total number of users
     */
    function getTotalUsers() external view returns (uint256) {
        return allUsers.length;
    }
    
    /**
     * @dev Get total number of trusted users
     */
    function getTotalTrustedUsers() external view returns (uint256) {
        return trustedUsers.length;
    }
    
    /**
     * @dev Get all trusted users
     */
    function getAllTrustedUsers() external view returns (address[] memory) {
        return trustedUsers.length > 0 ? trustedUsers : new address[](0);
    }
    
    /**
     * @dev Check if a username is available
     * @param username Username to check
     */
    function isUsernameAvailable(string memory username) external view returns (bool) {
        return usernameToAddress[username] == address(0);
    }
}

