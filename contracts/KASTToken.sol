// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KASTToken
 * @dev ERC20 token for KAST platform with faucet functionality
 */
contract KASTToken is ERC20, Ownable, Pausable, ReentrancyGuard {
    // Faucet configuration
    uint256 public constant FAUCET_AMOUNT = 100 * 10**18; // 100 KAST tokens
    uint256 public constant FAUCET_COOLDOWN = 24 hours;
    
    // Mapping to track last faucet claim time for each address
    mapping(address => uint256) public lastFaucetClaim;
    
    // Events
    event FaucetClaim(address indexed user, uint256 amount, uint256 timestamp);
    event FaucetAmountUpdated(uint256 newAmount);
    
    /**
     * @dev Constructor that gives msg.sender all of existing tokens
     * @param initialOwner The address that will own the contract
     */
    constructor(address initialOwner) 
        ERC20("KAST Token", "KAST") 
        Ownable(initialOwner)
    {
        // Mint initial supply of 1,000,000 KAST tokens to the owner
        _mint(initialOwner, 1000000 * 10**decimals());
    }
    
    /**
     * @dev Mint new tokens (only owner can call this)
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Faucet function - allows users to claim free tokens
     * Users can claim 100 KAST tokens once every 24 hours
     */
    function claimFromFaucet() external nonReentrant whenNotPaused {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "Faucet cooldown not met"
        );
        
        // Update last claim time
        lastFaucetClaim[msg.sender] = block.timestamp;
        
        // Mint tokens to the user
        _mint(msg.sender, FAUCET_AMOUNT);
        
        emit FaucetClaim(msg.sender, FAUCET_AMOUNT, block.timestamp);
    }
    
    /**
     * @dev Check if user can claim from faucet
     * @param user The address to check
     * @return canClaim Whether the user can claim
     * @return timeUntilNextClaim Time in seconds until next claim (0 if can claim now)
     */
    function canClaimFromFaucet(address user) external view returns (bool canClaim, uint256 timeUntilNextClaim) {
        uint256 nextClaimTime = lastFaucetClaim[user] + FAUCET_COOLDOWN;
        
        if (block.timestamp >= nextClaimTime) {
            return (true, 0);
        } else {
            return (false, nextClaimTime - block.timestamp);
        }
    }
    
    /**
     * @dev Get the next claim time for a user
     * @param user The address to check
     * @return nextClaimTime Timestamp when user can claim next
     */
    function getNextClaimTime(address user) external view returns (uint256 nextClaimTime) {
        return lastFaucetClaim[user] + FAUCET_COOLDOWN;
    }
    
    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override transfer to add pause functionality
     */
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
    
    /**
     * @dev Emergency function to withdraw any accidentally sent tokens
     * @param token The token contract address
     * @param amount The amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(this), "Cannot withdraw KAST tokens");
        IERC20(token).transfer(owner(), amount);
    }
}