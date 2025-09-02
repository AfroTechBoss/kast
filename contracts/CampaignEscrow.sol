// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CampaignEscrow
 * @dev Manages escrow for KAST campaign rewards with secure fund management
 */
contract CampaignEscrow is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    struct Campaign {
        address creator;
        IERC20 rewardToken;
        uint256 totalRewards;
        uint256 remainingRewards;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool rewardsDistributed;
        string metadataURI;
    }

    struct Participant {
        uint256 score;
        uint256 rank;
        bool hasWithdrawn;
        uint256 rewardAmount;
    }

    // Campaign ID counter
    uint256 public campaignCounter;
    
    // Mapping from campaign ID to campaign details
    mapping(uint256 => Campaign) public campaigns;
    
    // Mapping from campaign ID to participant address to participant data
    mapping(uint256 => mapping(address => Participant)) public participants;
    
    // Mapping from campaign ID to array of participant addresses
    mapping(uint256 => address[]) public campaignParticipants;
    
    // Platform fee (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFee = 250;
    
    // Platform fee recipient
    address public feeRecipient;
    
    // Minimum campaign duration (1 day)
    uint256 public constant MIN_CAMPAIGN_DURATION = 1 days;
    
    // Maximum campaign duration (90 days)
    uint256 public constant MAX_CAMPAIGN_DURATION = 90 days;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        address indexed rewardToken,
        uint256 totalRewards,
        uint256 startTime,
        uint256 endTime
    );

    event CampaignEnded(
        uint256 indexed campaignId,
        uint256 totalParticipants
    );

    event RewardDistributed(
        uint256 indexed campaignId,
        address indexed participant,
        uint256 amount
    );

    event ParticipantScoreUpdated(
        uint256 indexed campaignId,
        address indexed participant,
        uint256 newScore,
        uint256 newRank
    );

    event EmergencyWithdraw(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );

    modifier validCampaign(uint256 _campaignId) {
        require(_campaignId < campaignCounter, "Invalid campaign ID");
        require(campaigns[_campaignId].isActive, "Campaign not active");
        _;
    }

    modifier onlyCampaignCreator(uint256 _campaignId) {
        require(campaigns[_campaignId].creator == msg.sender, "Not campaign creator");
        _;
    }

    constructor(address _feeRecipient, address initialOwner) Ownable(initialOwner) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Create a new campaign with escrow
     * @param _rewardToken The ERC20 token used for rewards
     * @param _totalRewards Total amount of rewards to be distributed
     * @param _duration Campaign duration in seconds
     * @param _metadataURI IPFS URI containing campaign metadata
     */
    function createCampaign(
        IERC20 _rewardToken,
        uint256 _totalRewards,
        uint256 _duration,
        string calldata _metadataURI
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(address(_rewardToken) != address(0), "Invalid token address");
        require(_totalRewards > 0, "Rewards must be greater than 0");
        require(
            _duration >= MIN_CAMPAIGN_DURATION && _duration <= MAX_CAMPAIGN_DURATION,
            "Invalid campaign duration"
        );
        require(bytes(_metadataURI).length > 0, "Metadata URI required");

        uint256 campaignId = campaignCounter++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + _duration;

        campaigns[campaignId] = Campaign({
            creator: msg.sender,
            rewardToken: _rewardToken,
            totalRewards: _totalRewards,
            remainingRewards: _totalRewards,
            startTime: startTime,
            endTime: endTime,
            isActive: true,
            rewardsDistributed: false,
            metadataURI: _metadataURI
        });

        // Transfer tokens to escrow
        _rewardToken.safeTransferFrom(msg.sender, address(this), _totalRewards);

        emit CampaignCreated(
            campaignId,
            msg.sender,
            address(_rewardToken),
            _totalRewards,
            startTime,
            endTime
        );

        return campaignId;
    }

    /**
     * @dev Update participant scores (only callable by authorized backend)
     * @param _campaignId Campaign ID
     * @param _participants Array of participant addresses
     * @param _scores Array of corresponding scores
     * @param _ranks Array of corresponding ranks
     */
    function updateParticipantScores(
        uint256 _campaignId,
        address[] calldata _participants,
        uint256[] calldata _scores,
        uint256[] calldata _ranks
    ) external onlyOwner validCampaign(_campaignId) {
        require(
            _participants.length == _scores.length && _scores.length == _ranks.length,
            "Array length mismatch"
        );
        require(block.timestamp <= campaigns[_campaignId].endTime, "Campaign ended");

        for (uint256 i = 0; i < _participants.length; i++) {
            address participant = _participants[i];
            
            // Add to participants list if first time
            if (participants[_campaignId][participant].score == 0 && _scores[i] > 0) {
                campaignParticipants[_campaignId].push(participant);
            }
            
            participants[_campaignId][participant].score = _scores[i];
            participants[_campaignId][participant].rank = _ranks[i];

            emit ParticipantScoreUpdated(_campaignId, participant, _scores[i], _ranks[i]);
        }
    }

    /**
     * @dev End campaign and calculate final rewards
     * @param _campaignId Campaign ID
     * @param _finalParticipants Final list of participants
     * @param _rewardAmounts Corresponding reward amounts
     */
    function endCampaign(
        uint256 _campaignId,
        address[] calldata _finalParticipants,
        uint256[] calldata _rewardAmounts
    ) external onlyOwner validCampaign(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp >= campaign.endTime, "Campaign not ended yet");
        require(!campaign.rewardsDistributed, "Rewards already distributed");
        require(
            _finalParticipants.length == _rewardAmounts.length,
            "Array length mismatch"
        );

        uint256 totalDistribution = 0;
        
        // Set final reward amounts
        for (uint256 i = 0; i < _finalParticipants.length; i++) {
            address participant = _finalParticipants[i];
            uint256 rewardAmount = _rewardAmounts[i];
            
            participants[_campaignId][participant].rewardAmount = rewardAmount;
            totalDistribution += rewardAmount;
        }

        require(totalDistribution <= campaign.totalRewards, "Distribution exceeds total rewards");

        // Calculate platform fee
        uint256 fee = (totalDistribution * platformFee) / 10000;
        uint256 netDistribution = totalDistribution - fee;

        // Transfer platform fee
        if (fee > 0) {
            campaign.rewardToken.safeTransfer(feeRecipient, fee);
        }

        // Return unused funds to creator
        uint256 unusedFunds = campaign.totalRewards - totalDistribution;
        if (unusedFunds > 0) {
            campaign.rewardToken.safeTransfer(campaign.creator, unusedFunds);
        }

        campaign.isActive = false;
        campaign.rewardsDistributed = true;
        campaign.remainingRewards = netDistribution;

        emit CampaignEnded(_campaignId, _finalParticipants.length);
    }

    /**
     * @dev Withdraw rewards for a participant
     * @param _campaignId Campaign ID
     */
    function withdrawReward(uint256 _campaignId) external nonReentrant {
        require(_campaignId < campaignCounter, "Invalid campaign ID");
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.rewardsDistributed, "Rewards not distributed yet");
        
        Participant storage participant = participants[_campaignId][msg.sender];
        require(participant.rewardAmount > 0, "No rewards to withdraw");
        require(!participant.hasWithdrawn, "Already withdrawn");

        uint256 rewardAmount = participant.rewardAmount;
        participant.hasWithdrawn = true;
        campaign.remainingRewards -= rewardAmount;

        campaign.rewardToken.safeTransfer(msg.sender, rewardAmount);

        emit RewardDistributed(_campaignId, msg.sender, rewardAmount);
    }

    /**
     * @dev Emergency withdraw for campaign creator (only if campaign is stuck)
     * @param _campaignId Campaign ID
     */
    function emergencyWithdraw(uint256 _campaignId) 
        external 
        onlyCampaignCreator(_campaignId) 
        nonReentrant 
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(
            block.timestamp > campaign.endTime + 30 days,
            "Emergency withdraw not available yet"
        );
        require(campaign.remainingRewards > 0, "No funds to withdraw");

        uint256 amount = campaign.remainingRewards;
        campaign.remainingRewards = 0;
        campaign.isActive = false;

        campaign.rewardToken.safeTransfer(campaign.creator, amount);

        emit EmergencyWithdraw(_campaignId, campaign.creator, amount);
    }

    /**
     * @dev Get campaign details
     * @param _campaignId Campaign ID
     */
    function getCampaign(uint256 _campaignId) 
        external 
        view 
        returns (Campaign memory) 
    {
        require(_campaignId < campaignCounter, "Invalid campaign ID");
        return campaigns[_campaignId];
    }

    /**
     * @dev Get participant details
     * @param _campaignId Campaign ID
     * @param _participant Participant address
     */
    function getParticipant(uint256 _campaignId, address _participant)
        external
        view
        returns (Participant memory)
    {
        return participants[_campaignId][_participant];
    }

    /**
     * @dev Get all participants for a campaign
     * @param _campaignId Campaign ID
     */
    function getCampaignParticipants(uint256 _campaignId)
        external
        view
        returns (address[] memory)
    {
        return campaignParticipants[_campaignId];
    }

    /**
     * @dev Update platform fee (only owner)
     * @param _newFee New fee in basis points
     */
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = _newFee;
    }

    /**
     * @dev Update fee recipient (only owner)
     * @param _newRecipient New fee recipient address
     */
    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid address");
        feeRecipient = _newRecipient;
    }

    /**
     * @dev Pause contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}