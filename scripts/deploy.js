const { ethers } = require('hardhat')
const fs = require('fs')
const path = require('path')

async function main() {
  console.log('🚀 Starting KAST contract deployment...')
  
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with account:', deployer.address)
  console.log('Account balance:', (await deployer.getBalance()).toString())

  const network = await ethers.provider.getNetwork()
  console.log('Network:', network.name, 'Chain ID:', network.chainId)

  // Deploy KAST Token contract
  console.log('\n🪙 Deploying KAST Token contract...')
  const KASTToken = await ethers.getContractFactory('KASTToken')
  const initialOwner = process.env.INITIAL_OWNER || deployer.address
  const kastToken = await KASTToken.deploy(initialOwner)
  await kastToken.deployed()
  console.log('✅ KAST Token deployed to:', kastToken.address)

  // Deploy KASTBadges contract
  console.log('\n📋 Deploying KASTBadges contract...')
  const KASTBadges = await ethers.getContractFactory('KASTBadges')
  const badgesBaseURI = process.env.BADGES_BASE_URI || 'https://getkast.xyz/api/badges/metadata/'
  const kastBadges = await KASTBadges.deploy(badgesBaseURI, initialOwner)
  await kastBadges.deployed()
  console.log('✅ KASTBadges deployed to:', kastBadges.address)

  // Deploy CampaignEscrow contract
  console.log('\n💰 Deploying CampaignEscrow contract...')
  const CampaignEscrow = await ethers.getContractFactory('CampaignEscrow')
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address
  const campaignEscrow = await CampaignEscrow.deploy(feeRecipient, initialOwner)
  await campaignEscrow.deployed()
  console.log('✅ CampaignEscrow deployed to:', campaignEscrow.address)

  // Wait for confirmations
  console.log('\n⏳ Waiting for confirmations...')
  await kastToken.deployTransaction.wait(2)
  await kastBadges.deployTransaction.wait(2)
  await campaignEscrow.deployTransaction.wait(2)

  // Set up initial configuration
  console.log('\n⚙️ Setting up initial configuration...')
  
  // Authorize the escrow contract to mint badges
  console.log('Authorizing CampaignEscrow to mint badges...')
  const authTx = await kastBadges.setAuthorizedMinter(campaignEscrow.address, true)
  await authTx.wait()
  console.log('✅ Authorization complete')

  // Authorize deployer as minter (for backend services)
  console.log('Authorizing deployer as badge minter...')
  const deployerAuthTx = await kastBadges.setAuthorizedMinter(deployer.address, true)
  await deployerAuthTx.wait()
  console.log('✅ Deployer authorization complete')

  // Save deployment addresses
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    contracts: {
      KASTToken: {
        address: kastToken.address,
        constructorArgs: [initialOwner],
      },
      KASTBadges: {
        address: kastBadges.address,
        constructorArgs: [badgesBaseURI, initialOwner],
      },
      CampaignEscrow: {
        address: campaignEscrow.address,
        constructorArgs: [feeRecipient, initialOwner],
      },
    },
    deploymentTime: new Date().toISOString(),
  }

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '..', 'deployments')
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true })
  }

  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `${network.name}-${network.chainId}.json`)
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2))
  console.log(`\n📄 Deployment info saved to: ${deploymentFile}`)

  // Update app config with contract addresses
  const appConfigPath = path.join(__dirname, '..', 'app.config.js')
  if (fs.existsSync(appConfigPath)) {
    console.log('\n🔧 Updating app.config.js with contract addresses...')
    let appConfig = fs.readFileSync(appConfigPath, 'utf8')
    
    // Replace contract addresses in the config
    appConfig = appConfig.replace(
      /KAST_TOKEN_ADDRESS: '[^']*'/,
      `KAST_TOKEN_ADDRESS: '${kastToken.address}'`
    )
    appConfig = appConfig.replace(
      /CAMPAIGN_ESCROW_ADDRESS: '[^']*'/,
      `CAMPAIGN_ESCROW_ADDRESS: '${campaignEscrow.address}'`
    )
    appConfig = appConfig.replace(
      /KAST_BADGES_ADDRESS: '[^']*'/,
      `KAST_BADGES_ADDRESS: '${kastBadges.address}'`
    )
    
    fs.writeFileSync(appConfigPath, appConfig)
    console.log('✅ App config updated')
  }

  console.log('\n🎉 Deployment completed successfully!')
  console.log('\n📋 Contract Addresses:')
  console.log('KAST Token:', kastToken.address)
  console.log('KASTBadges:', kastBadges.address)
  console.log('CampaignEscrow:', campaignEscrow.address)
  console.log('\n🔗 Verification Commands:')
  console.log(`npx hardhat verify --network ${network.name} ${kastToken.address} "${initialOwner}"`)
  console.log(`npx hardhat verify --network ${network.name} ${kastBadges.address} "${badgesBaseURI}" "${initialOwner}"`)
  console.log(`npx hardhat verify --network ${network.name} ${campaignEscrow.address} "${feeRecipient}" "${initialOwner}"`)

  // Test basic functionality
  console.log('\n🧪 Running basic functionality tests...')
  
  try {
    // Test KAST token
    console.log('Testing KAST token...')
    const tokenName = await kastToken.name()
    const tokenSymbol = await kastToken.symbol()
    const totalSupply = await kastToken.totalSupply()
    console.log(`✅ Token: ${tokenName} (${tokenSymbol}), Total Supply: ${ethers.utils.formatEther(totalSupply)} KAST`)
    
    // Test badge creation
    console.log('Testing badge creation...')
    const badgeCount = await kastBadges.badgeCounter()
    console.log(`✅ Initial badge count: ${badgeCount}`)
    
    // Test campaign creation (would need test tokens)
    console.log('Testing campaign counter...')
    const campaignCount = await campaignEscrow.campaignCounter()
    console.log(`✅ Initial campaign count: ${campaignCount}`)
    
    console.log('\n✅ All tests passed!')
  } catch (error) {
    console.log('\n⚠️ Some tests failed:', error.message)
  }

  console.log('\n🚀 KAST deployment complete! Ready to launch campaigns.')
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:')
    console.error(error)
    process.exit(1)
  })