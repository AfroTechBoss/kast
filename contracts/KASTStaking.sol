// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title KASTStaking
 * @dev Staking contract for KAST tokens with reward distribution
 */
contract KASTStaking is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // The KAST token contract
    IERC20 public immutable kastToken;
    
    // Staking parameters
    uint256 public rewardRate; // Reward rate per second (as a percentage of staked amount)
    uint256 public minStakingPeriod; // Minimum staking period in seconds
    uint256 public totalStaked; // Total amount of tokens staked
    
    // Staking info for each user
    struct StakeInfo {
        uint256 amount; // Amount of tokens staked
        uint256 rewardDebt; // Reward debt for accurate reward calculation
        uint256 lastStakeTime; // Timestamp of last stake
        uint256 lastRewardTime; // Timestamp of last reward calculation
    }
    
    // Mapping from user address to stake info
    mapping(address => StakeInfo) public stakes;
    
    // Accumulated reward per token (scaled by 1e18 for precision)
    uint256 public accRewardPerToken;
    uint256 public lastRewardUpdateTime;
    
    // Events
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event EmergencyUnstake(address indexed user, uint256 amount, uint256 timestamp);
    
    /**
     * @dev Constructor
     * @param _kastToken Address of the KAST token contract
     * @param _rewardRate Initial reward rate per second (as a fraction of 1e18)
     * @param _minStakingPeriod Minimum staking period in seconds
     */
    constructor(
        address _kastToken,
        uint256 _rewardRate,
        uint256 _minStakingPeriod
    ) Ownable(msg.sender) {
        require(_kastToken != address(0), "Invalid token address");
        require(_rewardRate > 0, "Reward rate must be positive");
        require(_minStakingPeriod > 0, "Min staking period must be positive");
        
        kastToken = IERC20(_kastToken);
        rewardRate = _rewardRate;
        minStakingPeriod = _minStakingPeriod;
        lastRewardUpdateTime = block.timestamp;
    }
    
    /**
     * @dev Update reward variables
     */
    function updateReward() internal {
        if (totalStaked == 0) {
            lastRewardUpdateTime = block.timestamp;
            return;
        }
        
        uint256 timeElapsed = block.timestamp - lastRewardUpdateTime;
        if (timeElapsed > 0) {
            uint256 reward = (totalStaked * rewardRate * timeElapsed) / 1e18;
            accRewardPerToken += (reward * 1e18) / totalStaked;
            lastRewardUpdateTime = block.timestamp;
        }
    }
    
    /**
     * @dev Stake KAST tokens
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Cannot stake 0 tokens");
        
        updateReward();
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        // If user already has staked tokens, claim pending rewards first
        if (userStake.amount > 0) {
            uint256 pending = (userStake.amount * accRewardPerToken) / 1e18 - userStake.rewardDebt;
            if (pending > 0) {
                kastToken.safeTransfer(msg.sender, pending);
                emit RewardsClaimed(msg.sender, pending, block.timestamp);
            }
        }
        
        // Transfer tokens from user to contract
        kastToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update user stake info
        userStake.amount += amount;
        userStake.lastStakeTime = block.timestamp;
        userStake.lastRewardTime = block.timestamp;
        userStake.rewardDebt = (userStake.amount * accRewardPerToken) / 1e18;
        
        // Update total staked
        totalStaked += amount;
        
        emit Staked(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Unstake KAST tokens
     * @param amount Amount of tokens to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot unstake 0 tokens");
        
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked amount");
        require(
            block.timestamp >= userStake.lastStakeTime + minStakingPeriod,
            "Minimum staking period not met"
        );
        
        updateReward();
        
        // Calculate and transfer pending rewards
        uint256 pending = (userStake.amount * accRewardPerToken) / 1e18 - userStake.rewardDebt;
        if (pending > 0) {
            kastToken.safeTransfer(msg.sender, pending);
            emit RewardsClaimed(msg.sender, pending, block.timestamp);
        }
        
        // Update user stake info
        userStake.amount -= amount;
        userStake.rewardDebt = (userStake.amount * accRewardPerToken) / 1e18;
        
        // Update total staked
        totalStaked -= amount;
        
        // Transfer unstaked tokens back to user
        kastToken.safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Claim pending rewards without unstaking
     */
    function claimRewards() external nonReentrant {
        updateReward();
        
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No tokens staked");
        
        uint256 pending = (userStake.amount * accRewardPerToken) / 1e18 - userStake.rewardDebt;
        require(pending > 0, "No rewards to claim");
        
        userStake.rewardDebt = (userStake.amount * accRewardPerToken) / 1e18;
        userStake.lastRewardTime = block.timestamp;
        
        kastToken.safeTransfer(msg.sender, pending);
        
        emit RewardsClaimed(msg.sender, pending, block.timestamp);
    }
    
    /**
     * @dev Emergency unstake without reward calculation (for emergencies only)
     */
    function emergencyUnstake() external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        uint256 amount = userStake.amount;
        require(amount > 0, "No tokens staked");
        
        // Reset user stake
        userStake.amount = 0;
        userStake.rewardDebt = 0;
        
        // Update total staked
        totalStaked -= amount;
        
        // Transfer tokens back to user (no rewards)
        kastToken.safeTransfer(msg.sender, amount);
        
        emit EmergencyUnstake(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Get pending rewards for a user
     * @param user Address of the user
     * @return pending Pending reward amount
     */
    function pendingRewards(address user) external view returns (uint256 pending) {
        StakeInfo memory userStake = stakes[user];
        if (userStake.amount == 0) {
            return 0;
        }
        
        uint256 tempAccRewardPerToken = accRewardPerToken;
        if (totalStaked > 0) {
            uint256 timeElapsed = block.timestamp - lastRewardUpdateTime;
            uint256 reward = (totalStaked * rewardRate * timeElapsed) / 1e18;
            tempAccRewardPerToken += (reward * 1e18) / totalStaked;
        }
        
        pending = (userStake.amount * tempAccRewardPerToken) / 1e18 - userStake.rewardDebt;
    }
    
    /**
     * @dev Get staked balance for a user
     * @param user Address of the user
     * @return amount Staked amount
     */
    function stakedBalance(address user) external view returns (uint256 amount) {
        return stakes[user].amount;
    }
    
    /**
     * @dev Get time until user can unstake
     * @param user Address of the user
     * @return timeLeft Time left in seconds (0 if can unstake now)
     */
    function timeUntilUnstake(address user) external view returns (uint256 timeLeft) {
        StakeInfo memory userStake = stakes[user];
        if (userStake.amount == 0) {
            return 0;
        }
        
        uint256 unlockTime = userStake.lastStakeTime + minStakingPeriod;
        if (block.timestamp >= unlockTime) {
            return 0;
        } else {
            return unlockTime - block.timestamp;
        }
    }
    
    /**
     * @dev Update reward rate (only owner)
     * @param newRewardRate New reward rate per second
     */
    function updateRewardRate(uint256 newRewardRate) external onlyOwner {
        require(newRewardRate > 0, "Reward rate must be positive");
        
        updateReward();
        
        uint256 oldRate = rewardRate;
        rewardRate = newRewardRate;
        
        emit RewardRateUpdated(oldRate, newRewardRate);
    }
    
    /**
     * @dev Update minimum staking period (only owner)
     * @param newMinStakingPeriod New minimum staking period in seconds
     */
    function updateMinStakingPeriod(uint256 newMinStakingPeriod) external onlyOwner {
        require(newMinStakingPeriod > 0, "Min staking period must be positive");
        minStakingPeriod = newMinStakingPeriod;
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
     * @dev Emergency function to recover any accidentally sent tokens (only owner)
     * @param token Token contract address
     * @param amount Amount to recover
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        require(token != address(kastToken), "Cannot recover staked tokens");
        IERC20(token).safeTransfer(owner(), amount);
    }
}