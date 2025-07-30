// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BeerCoin
 * @dev ERC20 token for the BeerCoin ecosystem
 * Symbol: BEER
 * Decimals: 18
 * Initial Supply: 1,000,000 BEER (can be minted by owner)
 */
contract BeerCoin is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18; // 100 million BEER max supply
    
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    constructor(address initialOwner) ERC20("BeerCoin", "BEER") Ownable(initialOwner) {
        // Mint initial supply to the owner
        _mint(initialOwner, 1_000_000 * 10**18); // 1 million BEER initial supply
        emit TokensMinted(initialOwner, 1_000_000 * 10**18);
    }
    
    /**
     * @dev Mint new tokens (only owner can call this)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "BeerCoin: mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "BeerCoin: exceeds max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Burn tokens from caller's balance
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        require(amount > 0, "BeerCoin: burn amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "BeerCoin: insufficient balance to burn");
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @dev Burn tokens from a specific address (requires allowance)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) external {
        require(amount > 0, "BeerCoin: burn amount must be greater than 0");
        require(balanceOf(from) >= amount, "BeerCoin: insufficient balance to burn");
        
        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "BeerCoin: burn amount exceeds allowance");
        
        _approve(from, msg.sender, currentAllowance - amount);
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
    
    /**
     * @dev Get the maximum supply of tokens
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
}

