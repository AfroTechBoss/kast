// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

/**
 * @title KASTBadges
 * @dev ERC1155 contract for KAST achievement badges and NFT rewards
 */
contract KASTBadges is ERC1155, ERC1155Supply, Ownable, Pausable {
    using Strings for uint256;

    // Badge rarity levels
    enum Rarity {
        COMMON,
        RARE,
        EPIC,
        LEGENDARY
    }

    struct Badge {
        string name;
        string description;
        Rarity rarity;
        uint256 maxSupply;
        bool isActive;
        string metadataURI;
        uint256 campaignId; // 0 for platform badges
    }

    // Badge ID counter
    uint256 public badgeCounter;
    
    // Mapping from badge ID to badge details
    mapping(uint256 => Badge) public badges;
    
    // Mapping from user to badge ID to earned timestamp
    mapping(address => mapping(uint256 => uint256)) public userBadgeTimestamp;
    
    // Mapping from campaign ID to badge IDs
    mapping(uint256 => uint256[]) public campaignBadges;
    
    // Platform badges (not tied to specific campaigns)
    uint256[] public platformBadges;
    
    // Authorized minters (backend services)
    mapping(address => bool) public authorizedMinters;

    event BadgeCreated(
        uint256 indexed badgeId,
        string name,
        Rarity rarity,
        uint256 maxSupply,
        uint256 campaignId
    );

    event BadgeMinted(
        uint256 indexed badgeId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    event BadgeUpdated(
        uint256 indexed badgeId,
        string name,
        string description,
        bool isActive
    );

    event MinterAuthorized(address indexed minter, bool authorized);

    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }

    modifier validBadge(uint256 _badgeId) {
        require(_badgeId < badgeCounter, "Invalid badge ID");
        require(badges[_badgeId].isActive, "Badge not active");
        _;
    }

    constructor(string memory _baseURI, address initialOwner) ERC1155(_baseURI) Ownable(initialOwner) {
        // Create initial platform badges
        _createInitialBadges();
    }

    /**
     * @dev Create initial platform badges
     */
    function _createInitialBadges() private {
        // Early Adopter Badge
        _createBadge(
            "Early Adopter",
            "Joined KAST in the first week",
            Rarity.EPIC,
            1000,
            0, // Platform badge
            "early-adopter.json"
        );

        // Meme Master Badge
        _createBadge(
            "Meme Master",
            "Created 10+ viral memes",
            Rarity.RARE,
            5000,
            0, // Platform badge
            "meme-master.json"
        );

        // Engagement King Badge
        _createBadge(
            "Engagement King",
            "Achieved 1000+ total engagement",
            Rarity.LEGENDARY,
            100,
            0, // Platform badge
            "engagement-king.json"
        );

        // First Campaign Badge
        _createBadge(
            "First Campaign",
            "Participated in your first campaign",
            Rarity.COMMON,
            0, // Unlimited
            0, // Platform badge
            "first-campaign.json"
        );

        // Top Performer Badge
        _createBadge(
            "Top Performer",
            "Finished in top 10 of a campaign",
            Rarity.RARE,
            0, // Unlimited
            0, // Platform badge
            "top-performer.json"
        );
    }

    /**
     * @dev Create a new badge
     * @param _name Badge name
     * @param _description Badge description
     * @param _rarity Badge rarity level
     * @param _maxSupply Maximum supply (0 for unlimited)
     * @param _campaignId Associated campaign ID (0 for platform badges)
     * @param _metadataURI Metadata URI for the badge
     */
    function createBadge(
        string calldata _name,
        string calldata _description,
        Rarity _rarity,
        uint256 _maxSupply,
        uint256 _campaignId,
        string calldata _metadataURI
    ) external onlyOwner returns (uint256) {
        return _createBadge(_name, _description, _rarity, _maxSupply, _campaignId, _metadataURI);
    }

    /**
     * @dev Internal function to create a badge
     */
    function _createBadge(
        string memory _name,
        string memory _description,
        Rarity _rarity,
        uint256 _maxSupply,
        uint256 _campaignId,
        string memory _metadataURI
    ) private returns (uint256) {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_description).length > 0, "Description required");
        require(bytes(_metadataURI).length > 0, "Metadata URI required");

        uint256 badgeId = badgeCounter++;

        badges[badgeId] = Badge({
            name: _name,
            description: _description,
            rarity: _rarity,
            maxSupply: _maxSupply,
            isActive: true,
            metadataURI: _metadataURI,
            campaignId: _campaignId
        });

        if (_campaignId == 0) {
            platformBadges.push(badgeId);
        } else {
            campaignBadges[_campaignId].push(badgeId);
        }

        emit BadgeCreated(badgeId, _name, _rarity, _maxSupply, _campaignId);

        return badgeId;
    }

    /**
     * @dev Mint badge to recipient
     * @param _to Recipient address
     * @param _badgeId Badge ID to mint
     * @param _amount Amount to mint
     */
    function mintBadge(
        address _to,
        uint256 _badgeId,
        uint256 _amount
    ) public onlyAuthorizedMinter validBadge(_badgeId) whenNotPaused {
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be greater than 0");

        Badge storage badge = badges[_badgeId];
        
        // Check max supply
        if (badge.maxSupply > 0) {
            require(
                totalSupply(_badgeId) + _amount <= badge.maxSupply,
                "Exceeds max supply"
            );
        }

        // Record timestamp for first badge earned
        if (userBadgeTimestamp[_to][_badgeId] == 0) {
            userBadgeTimestamp[_to][_badgeId] = block.timestamp;
        }

        _mint(_to, _badgeId, _amount, "");

        emit BadgeMinted(_badgeId, _to, _amount, block.timestamp);
    }

    /**
     * @dev Batch mint badges to multiple recipients
     * @param _recipients Array of recipient addresses
     * @param _badgeIds Array of badge IDs
     * @param _amounts Array of amounts
     */
    function batchMintBadges(
        address[] calldata _recipients,
        uint256[] calldata _badgeIds,
        uint256[] calldata _amounts
    ) external onlyAuthorizedMinter whenNotPaused {
        require(
            _recipients.length == _badgeIds.length && _badgeIds.length == _amounts.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < _recipients.length; i++) {
            mintBadge(_recipients[i], _badgeIds[i], _amounts[i]);
        }
    }

    /**
     * @dev Update badge details
     * @param _badgeId Badge ID
     * @param _name New name
     * @param _description New description
     * @param _isActive New active status
     */
    function updateBadge(
        uint256 _badgeId,
        string calldata _name,
        string calldata _description,
        bool _isActive
    ) external onlyOwner {
        require(_badgeId < badgeCounter, "Invalid badge ID");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_description).length > 0, "Description required");

        Badge storage badge = badges[_badgeId];
        badge.name = _name;
        badge.description = _description;
        badge.isActive = _isActive;

        emit BadgeUpdated(_badgeId, _name, _description, _isActive);
    }

    /**
     * @dev Set authorized minter status
     * @param _minter Minter address
     * @param _authorized Authorization status
     */
    function setAuthorizedMinter(address _minter, bool _authorized) external onlyOwner {
        require(_minter != address(0), "Invalid minter address");
        authorizedMinters[_minter] = _authorized;
        emit MinterAuthorized(_minter, _authorized);
    }

    /**
     * @dev Get badge details
     * @param _badgeId Badge ID
     */
    function getBadge(uint256 _badgeId) external view returns (Badge memory) {
        require(_badgeId < badgeCounter, "Invalid badge ID");
        return badges[_badgeId];
    }

    /**
     * @dev Get user's badges
     * @param _user User address
     * @return badgeIds Array of badge IDs owned by user
     * @return balances Array of corresponding balances
     * @return timestamps Array of earned timestamps
     */
    function getUserBadges(address _user)
        external
        view
        returns (
            uint256[] memory badgeIds,
            uint256[] memory balances,
            uint256[] memory timestamps
        )
    {
        uint256 ownedCount = 0;
        
        // Count owned badges
        for (uint256 i = 0; i < badgeCounter; i++) {
            if (balanceOf(_user, i) > 0) {
                ownedCount++;
            }
        }

        badgeIds = new uint256[](ownedCount);
        balances = new uint256[](ownedCount);
        timestamps = new uint256[](ownedCount);

        uint256 index = 0;
        for (uint256 i = 0; i < badgeCounter; i++) {
            uint256 balance = balanceOf(_user, i);
            if (balance > 0) {
                badgeIds[index] = i;
                balances[index] = balance;
                timestamps[index] = userBadgeTimestamp[_user][i];
                index++;
            }
        }
    }

    /**
     * @dev Get campaign badges
     * @param _campaignId Campaign ID
     */
    function getCampaignBadges(uint256 _campaignId)
        external
        view
        returns (uint256[] memory)
    {
        return campaignBadges[_campaignId];
    }

    /**
     * @dev Get platform badges
     */
    function getPlatformBadges() external view returns (uint256[] memory) {
        return platformBadges;
    }

    /**
     * @dev Get badge rarity as string
     * @param _rarity Rarity enum value
     */
    function getRarityString(Rarity _rarity) external pure returns (string memory) {
        if (_rarity == Rarity.COMMON) return "Common";
        if (_rarity == Rarity.RARE) return "Rare";
        if (_rarity == Rarity.EPIC) return "Epic";
        if (_rarity == Rarity.LEGENDARY) return "Legendary";
        return "Unknown";
    }

    /**
     * @dev Override URI function to return badge-specific metadata
     * @param _badgeId Badge ID
     */
    function uri(uint256 _badgeId) public view override returns (string memory) {
        require(_badgeId < badgeCounter, "Invalid badge ID");
        return string(abi.encodePacked(super.uri(_badgeId), badges[_badgeId].metadataURI));
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) whenNotPaused {
        super._update(from, to, ids, values);
    }

    /**
     * @dev Check if contract supports interface
     * @param interfaceId Interface ID to check
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}