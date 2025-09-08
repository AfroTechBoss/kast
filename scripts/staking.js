const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

/**
 * KAST Token Staking Script
 * 
 * This script provides functionality for:
 * - Deploying a staking contract for KAST tokens
 * - Staking KAST tokens to earn rewards
 * - Unstaking tokens and claiming rewards
 * - Managing staking pools and reward rates
 */

class KASTStakingManager {
  constructor() {
    this.stakingContract = null
    this.kastToken = null
    this.deployer = null
  }

  async initialize() {
    console.log('🔧 Initializing KAST Staking Manager...')
    
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

  async deployStakingContract() {
    console.log('\n🚀 Deploying KAST Staking Contract...')
    
    const StakingContract = await ethers.getContractFactory('KASTStaking')
    
    // Deploy with KAST token address and initial reward rate (1% per day)
    const rewardRate = ethers.utils.parseEther('0.01') // 1% daily reward
    const minStakingPeriod = 7 * 24 * 60 * 60 // 7 days in seconds
    
    this.stakingContract = await StakingContract.deploy(
      this.kastToken.address,
      rewardRate,
      minStakingPeriod
    )
    
    await this.stakingContract.deployed()
    console.log('✅ KAST Staking Contract deployed to:', this.stakingContract.address)
    
    // Wait for confirmations
    await this.stakingContract.deployTransaction.wait(2)
    
    return this.stakingContract.address
  }

  async stakeTokens(amount) {
    console.log(`\n💰 Staking ${ethers.utils.formatEther(amount)} KAST tokens...`)
    
    // Check balance
    const balance = await this.kastToken.balanceOf(this.deployer.address)
    if (balance.lt(amount)) {
      throw new Error(`❌ Insufficient balance. Have: ${ethers.utils.formatEther(balance)} KAST`)
    }
    
    // Approve staking contract
    console.log('Approving tokens for staking...')
    const approveTx = await this.kastToken.approve(this.stakingContract.address, amount)
    await approveTx.wait()
    console.log('✅ Tokens approved')
    
    // Stake tokens
    const stakeTx = await this.stakingContract.stake(amount)
    await stakeTx.wait()
    
    console.log('✅ Tokens staked successfully!')
    
    // Show staking info
    await this.showStakingInfo()
  }

  async unstakeTokens(amount) {
    console.log(`\n📤 Unstaking ${ethers.utils.formatEther(amount)} KAST tokens...`)
    
    const unstakeTx = await this.stakingContract.unstake(amount)
    await unstakeTx.wait()
    
    console.log('✅ Tokens unstaked successfully!')
    
    // Show updated staking info
    await this.showStakingInfo()
  }

  async claimRewards() {
    console.log('\n🎁 Claiming staking rewards...')
    
    const claimTx = await this.stakingContract.claimRewards()
    await claimTx.wait()
    
    console.log('✅ Rewards claimed successfully!')
    
    // Show updated staking info
    await this.showStakingInfo()
  }

  async showStakingInfo() {
    console.log('\n📊 Current Staking Information:')
    
    const stakedAmount = await this.stakingContract.stakedBalance(this.deployer.address)
    const pendingRewards = await this.stakingContract.pendingRewards(this.deployer.address)
    const totalStaked = await this.stakingContract.totalStaked()
    const rewardRate = await this.stakingContract.rewardRate()
    
    console.log(`Staked Amount: ${ethers.utils.formatEther(stakedAmount)} KAST`)
    console.log(`Pending Rewards: ${ethers.utils.formatEther(pendingRewards)} KAST`)
    console.log(`Total Staked in Pool: ${ethers.utils.formatEther(totalStaked)} KAST`)
    console.log(`Daily Reward Rate: ${ethers.utils.formatEther(rewardRate.mul(100))}%`)
  }

  async emergencyUnstake() {
    console.log('\n🚨 Emergency unstaking all tokens...')
    
    const emergencyTx = await this.stakingContract.emergencyUnstake()
    await emergencyTx.wait()
    
    console.log('✅ Emergency unstake completed!')
  }

  async updateRewardRate(newRate) {
    console.log(`\n⚙️ Updating reward rate to ${ethers.utils.formatEther(newRate.mul(100))}%...`)
    
    const updateTx = await this.stakingContract.updateRewardRate(newRate)
    await updateTx.wait()
    
    console.log('✅ Reward rate updated!')
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  const stakingManager = new KASTStakingManager()
  await stakingManager.initialize()
  
  switch (command) {
    case 'deploy':
      await stakingManager.deployStakingContract()
      break
      
    case 'stake':
      const stakeAmount = args[1]
      if (!stakeAmount) {
        console.log('❌ Please provide stake amount: npm run staking stake <amount>')
        return
      }
      await stakingManager.stakeTokens(ethers.utils.parseEther(stakeAmount))
      break
      
    case 'unstake':
      const unstakeAmount = args[1]
      if (!unstakeAmount) {
        console.log('❌ Please provide unstake amount: npm run staking unstake <amount>')
        return
      }
      await stakingManager.unstakeTokens(ethers.utils.parseEther(unstakeAmount))
      break
      
    case 'claim':
      await stakingManager.claimRewards()
      break
      
    case 'info':
      await stakingManager.showStakingInfo()
      break
      
    case 'emergency':
      await stakingManager.emergencyUnstake()
      break
      
    case 'update-rate':
      const newRate = args[1]
      if (!newRate) {
        console.log('❌ Please provide new rate: npm run staking update-rate <rate>')
        return
      }
      await stakingManager.updateRewardRate(ethers.utils.parseEther(newRate))
      break
      
    default:
      console.log('\n🔧 KAST Staking Script Usage:')
      console.log('npm run staking deploy          - Deploy staking contract')
      console.log('npm run staking stake <amount>  - Stake KAST tokens')
      console.log('npm run staking unstake <amount> - Unstake KAST tokens')
      console.log('npm run staking claim           - Claim pending rewards')
      console.log('npm run staking info            - Show staking information')
      console.log('npm run staking emergency       - Emergency unstake all')
      console.log('npm run staking update-rate <rate> - Update reward rate (owner only)')
      console.log('\nExamples:')
      console.log('npm run staking stake 100       - Stake 100 KAST tokens')
      console.log('npm run staking unstake 50      - Unstake 50 KAST tokens')
      console.log('npm run staking update-rate 0.02 - Set 2% daily reward rate')
      break
  }
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Staking script faile