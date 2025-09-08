// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract KASTGovernance is 
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    Ownable
{
    uint256 public proposalCount;
    mapping(uint256 => bool) public proposalExecuted;
    mapping(address => uint256) public proposalsByAddress;
    
    uint256 constant MAX_VD = 50400;
    uint256 constant MAX_VP = 100800;
    uint256 constant MIN_VP = 7200;
    uint256 constant MAX_PT = 1000000 * 10**18;
    uint256 constant MIN_QP = 1;
    uint256 constant MAX_QP = 50;
    
    constructor(
        IVotes _token,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumPercentage
    )
        Governor("KAST")
        GovernorSettings(uint48(_votingDelay), uint32(_votingPeriod), _proposalThreshold)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumPercentage)
        Ownable(msg.sender)
    {
        require(_votingDelay <= MAX_VD, "VD");
        require(_votingPeriod >= MIN_VP && _votingPeriod <= MAX_VP, "VP");
        require(_proposalThreshold <= MAX_PT, "PT");
        require(_quorumPercentage >= MIN_QP && _quorumPercentage <= MAX_QP, "QP");
    }
    
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override returns (uint256) {
        require(getVotes(msg.sender, block.number - 1) >= proposalThreshold(), "IV");
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        proposalCount++;
        proposalsByAddress[msg.sender]++;
        return proposalId;
    }
    
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable override returns (uint256) {
        uint256 proposalId = super.execute(targets, values, calldatas, descriptionHash);
        proposalExecuted[proposalId] = true;
        return proposalId;
    }
    
    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public override onlyOwner returns (uint256) {
        return super.cancel(targets, values, calldatas, descriptionHash);
    }

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }
    
    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }
    
    function quorum(uint256 blockNumber) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }
    
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
    
    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32
    ) internal {
        for (uint256 i = 0; i < targets.length; i++) {
            (bool success, ) = targets[i].call{value: values[i]}(calldatas[i]);
            require(success, "EF");
        }
        proposalExecuted[proposalId] = true;
    }
    
    function _executor() internal view override returns (address) {
        return address(this);
    }
}