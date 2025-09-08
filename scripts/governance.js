const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

/**
 * KAST Token Governance Script
 * 
 * This script provides functionality for:
 * - Deploying a governance contract for KAST token holders
 * - Creating and managing proposals
 * - Voting on proposals
 * - Executing approved proposals
 * - Managing governance parameters
 */

class KASTGovernanceManager {
  constructor() {
    this.governanceContract = null
    this.kastToken = null
    this.deployer = null
    this.proposals = new Map()
  }

  async initialize() {
    console.log('🏛️ Initializing KAST Governance Manager...')
    
    const [deployer] = await ethers.getSigners()
    this.deployer = deployer
    console.log('Using account:', deployer.address)
    console.log('Account balance:', ethers.utils.formatEther(await deployer.getBalance()), 'ETH')

    // Load existing deployment info
    const network = await ethers.provider.getNetwork()
    const deploymentFile = path.join(__dirname, '..', 'deployments', `${network.name}-${network.chainId}.json`)
    
    if (fs.existsSync(deploymentFile)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'))
      const kastTokenAddress = deploymentInfo.contracts.KASTToken.address
      
      // Connect to existing KAST token
      this.kastToken = await ethers.getContractAt('KASTToken', kastTokenAddress)
      console.log('✅ Connected to KAST Token at:', kastTokenAddress)
    } else {
      throw new Error('❌ No deployment found. Please run deploy script first.')
    }
  }

  async deployGovernanceContract() {
    console.log('\n🚀 Deploying KAST Governance Contract...')
    
    const GovernanceContract = await ethers.getContractFactory('KASTGovernance')
    
    // Governance parameters
    const votingDelay = 1 * 24 * 60 * 60 // 1 day in seconds
    const votingPeriod = 7 * 24 * 60 * 60 // 7 days in seconds
    const proposalThreshold = ethers.utils.parseEther('1000') // 1000 KAST tokens to create proposal
    const quorumPercentage = 10 // 10% quorum required
    
    this.governanceContract = await GovernanceContract.deploy(
      this.kastToken.address,
      votingDelay,
      votingPeriod,
      proposalThreshold,
      quorumPercentage
    )
    
    await this.governanceContract.deployed()
    console.log('✅ KAST Governance Contract deployed to:', this.governanceContract.address)
    
    // Wait for confirmations
    await this.governanceContract.deployTransaction.wait(2)
    
    return this.governanceContract.address
  }

  async createProposal(title, description, targets, values, calldatas) {
    console.log(`\n📝 Creating proposal: ${title}...`)
    
    // Check if user has enough tokens to create proposal
    const balance = await this.kastToken.balanceOf(this.deployer.address)
    const threshold = await this.governanceContract.proposalThreshold()
    
    if (balance.lt(threshold)) {
      throw new Error(`❌ Insufficient tokens to create proposal. Need: ${ethers.utils.formatEther(threshold)} KAST`)
    }
    
    // Create proposal
    const proposalTx = await this.governanceContract.propose(
      targets,
      values,
      calldatas,
      description
    )
    
    const receipt = await proposalTx.wait()
    
    // Get proposal ID from event
    const proposalCreatedEvent = receipt.events.find(e => e.event === 'ProposalCreated')
    const proposalId = proposalCreatedEvent.args.proposalId
    
    console.log('✅ Proposal created with ID:', proposalId.toString())
    
    // Store proposal info locally
    this.proposals.set(proposalId.toString(), {
      id: proposalId.toString(),
      title,
      description,
      targets,
      values,
      calldatas,
      proposer: this.deployer.address,
      createdAt: new Date().toISOString()
    })
    
    await this.showProposalInfo(proposalId)
    
    return proposalId
  }

  async vote(proposalId, support, reason = '') {
    console.log(`\n🗳️ Voting on proposal ${proposalId}...`)
    
    const supportText = ['Against', 'For', 'Abstain'][support]
    console.log(`Vote: ${supportText}`)
    if (reason) console.log(`Reason: ${reason}`)
    
    const voteTx = await this.governanceContract.castVoteWithReason(
      proposalId,
      support,
      reason
    )
    
    await voteTx.wait()
    
    console.log('✅ Vote cast successfully!')
    
    // Show updated proposal info
    await this.showProposalInfo(proposalId)
  }

  async executeProposal(proposalId) {
    console.log(`\n⚡ Executing proposal ${proposalId}...`)
    
    const proposal = this.proposals.get(proposalId.toString())
    if (!proposal) {
      throw new Error('❌ Proposal not found in local storage')
    }
    
    const executeTx = await this.governanceContract.execute(
      proposal.targets,
      proposal.values,
      proposal.calldatas,
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposal.description))
    )
    
    await executeTx.wait()
    
    console.log('✅ Proposal executed successfully!')
    
    // Show updated proposal info
    await this.showProposalInfo(proposalId)
  }

  async showProposalInfo(proposalId) {
    console.log(`\n📊 Proposal ${proposalId} Information:`)
    
    const state = await this.governanceContract.state(proposalId)
    const proposal = await this.governanceContract.proposals(proposalId)
    const votes = await this.governanceContract.proposalVotes(proposalId)
    
    const stateNames = [
      'Pending', 'Active', 'Canceled', 'Defeated', 
      'Succeeded', 'Queued', 'Expired', 'Executed'
    ]
    
    console.log(`State: ${stateNames[state]}`)
    console.log(`Proposer: ${proposal.proposer}`)
    console.log(`Start Block: ${proposal.startBlock}`)
    console.log(`End Block: ${proposal.endBlock}`)
    console.log(`For Votes: ${ethers.utils.formatEther(votes.forVotes)} KAST`)
    console.log(`Against Votes: ${ethers.utils.formatEther(votes.againstVotes)} KAST`)
    console.log(`Abstain Votes: ${ethers.utils.formatEther(votes.abstainVotes)} KAST`)
    
    // Check if proposal has reached quorum
    const quorum = await this.governanceContract.quorum(proposal.startBlock)
    const totalVotes = votes.forVotes.add(votes.againstVotes).add(votes.abstainVotes)
    console.log(`Quorum Required: ${ethers.utils.formatEther(quorum)} KAST`)
    console.log(`Total Votes: ${ethers.utils.formatEther(totalVotes)} KAST`)
    console.log(`Quorum Reached: ${totalVotes.gte(quorum) ? 'Yes' : 'No'}`)
  }

  async listAllProposals() {
    console.log('\n📋 All Proposals:')
    
    const proposalCount = await this.governanceContract.proposalCount()
    console.log(`Total Proposals: ${proposalCount}`)
    
    for (let i = 1; i <= proposalCount; i++) {
      try {
        await this.showProposalInfo(i)
        console.log('---')
      } catch (error) {
        console.log(`❌ Error fetching proposal ${i}:`, error.message)
      }
    }
  }

  async getVotingPower(address = null) {
    const account = address || this.deployer.address
    console.log(`\n🔍 Voting Power for ${account}:`)
    
    const balance = await this.kastToken.balanceOf(account)
    const votes = await this.governanceContract.getVotes(account)
    
    console.log(`Token Balance: ${ethers.utils.formatEther(balance)} KAST`)
    console.log(`Voting Power: ${ethers.utils.formatEther(votes)} KAST`)
    
    return votes
  }

  async delegateVotes(delegatee) {
    console.log(`\n🤝 Delegating votes to ${delegatee}...`)
    
    const delegateTx = await this.kastToken.delegate(delegatee)
    await delegateTx.wait()
    
    console.log('✅ Votes delegated successfully!')
    
    // Show updated voting power
    await this.getVotingPower()
  }

  // Helper function to create common proposal types
  async createParameterChangeProposal(parameterName, newValue, description) {
    console.log(`\n⚙️ Creating parameter change proposal for ${parameterName}...`)
    
    let targets, values, calldatas
    
    switch (parameterName) {
      case 'votingDelay':
        targets = [this.governanceContract.address]
        values = [0]
        calldatas = [this.governanceContract.interface.encodeFunctionData('setVotingDelay', [newValue])]
        break
        
      case 'votingPeriod':
        targets = [this.governanceContract.address]
        values = [0]
        calldatas = [this.governanceContract.interface.encodeFunctionData('setVotingPeriod', [newValue])]
        break
        
      case 'proposalThreshold':
        targets = [this.governanceContract.address]
        values = [0]
        calldatas = [this.governanceContract.interface.encodeFunctionData('setProposalThreshold', [newValue])]
        break
        
      default:
        throw new Error(`❌ Unknown parameter: ${parameterName}`)
    }
    
    return await this.createProposal(
      `Change ${parameterName}`,
      description,
      targets,
      values,
      calldatas
    )
  }

  async createTokenMintProposal(recipient, amount, description) {
    console.log(`\n💰 Creating token mint proposal...`)
    
    const targets = [this.kastToken.address]
    const values = [0]
    const calldatas = [this.kastToken.interface.encodeFunctionData('mint', [recipient, amount])]
    
    return await this.createProposal(
      'Mint KAST Tokens',
      description,
      targets,
      values,
      calldatas
    )
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  const governanceManager = new KASTGovernanceManager()
  await governanceManager.initialize()
  
  switch (command) {
    case 'deploy':
      await governanceManager.deployGovernanceContract()
      break
      
    case 'propose':
      const title = args[1]
      const description = args[2]
      if (!title || !description) {
        console.log('❌ Usage: npm run governance propose "<title>" "<description>"')
        return
      }
      // Simple proposal with no actions (for demonstration)
      await governanceManager.createProposal(title, description, [], [], [])
      break
      
    case 'vote':
      const proposalId = args[1]
      const support = parseInt(args[2]) // 0=Against, 1=For, 2=Abstain
      const reason = args[3] || ''
      if (!proposalId || support === undefined) {
        console.log('❌ Usage: npm run governance vote <proposalId> <support> [reason]')
        console.log('Support: 0=Against, 1=For, 2=Abstain')
        return
      }
      await governanceManager.vote(proposalId, support, reason)
      break
      
    case 'execute':
      const execProposalId = args[1]
      if (!execProposalId) {
        console.log('❌ Usage: npm run governance execute <proposalId>')
        return
      }
      await governanceManager.executeProposal(execProposalId)
      break
      
    case 'info':
      const infoProposalId = args[1]
      if (!infoProposalId) {
        console.log('❌ Usage: npm run governance info <proposalId>')
        return
      }
      await governanceManager.showProposalInfo(infoProposalId)
      break
      
    case 'list':
      await governanceManager.listAllProposals()
      break
      
    case 'power':
      const address = args[1]
      await governanceManager.getVotingPower(address)
      break
      
    case 'delegate':
      const delegatee = args[1]
      if (!delegatee) {
        console.log('❌ Usage: npm run governance delegate <address>')
        return
      }
      await governanceManager.delegateVotes(delegatee)
      break
      
    case 'change-param':
      const paramName = args[1]
      const newValue = args[2]
      const paramDescription = args[3]
      if (!paramName || !newValue || !paramDescription) {
        console.log('❌ Usage: npm run governance change-param <parameter> <value> "<description>"')
        return
      }
      await governanceManager.createParameterChangeProposal(paramName, newValue, paramDescription)
      break
      
    case 'mint-proposal':
      const recipient = args[1]
      const amount = args[2]
      const mintDescription = args[3]
      if (!recipient || !amount || !mintDescription) {
        console.log('❌ Usage: npm run governance mint-proposal <recipient> <amount> "<description>"')
        return
      }
      await governanceManager.createTokenMintProposal(
        recipient,
        ethers.utils.parseEther(amount),
        mintDescription
      )
      break
      
    default:
      console.log('\n🏛️ KAST Governance Script Usage:')
      console.log('npm run governance deploy                    - Deploy governance contract')
      console.log('npm run governance propose "<title>" "<desc>" - Create a proposal')
      console.log('npm run governance vote <id> <support>      - Vote on proposal (0=Against, 1=For, 2=Abstain)')
      console.log('npm run governance execute <id>             - Execute approved proposal')
      console.log('npm run governance info <id>                - Show proposal information')
      console.log('npm run governance list                     - List all proposals')
      console.log('npm run governance power [address]          - Show voting power')
      console.log('npm run governance delegate <address>       - Delegate voting power')
      console.log('npm run governance change-param <param> <value> "<desc>" - Create parameter change proposal')
      console.log('npm run governance mint-proposal <recipient> <amount> "<desc>" - Create token mint proposal')
      console.log('\nExamples:')
      console.log('npm run governance propose "Increase rewards" "Proposal to increase staking rewards"')
      console.log('npm run governance vote 1 1 "I support this proposal"')
      console.log('npm run governance change-param votingPeriod 604800 "Extend voting period to 7 days"')
      console.log('npm run governance mint-proposal 0x123... 1000 "Mint tokens for development fund"')
      break
  }
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Governance script failed:')
    console.error(error)
    process.exit(1)
  })

module.exports = { KASTGovernanceManager }