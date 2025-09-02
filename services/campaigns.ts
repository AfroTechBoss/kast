import { Campaign, CampaignStatus, CreateCampaignData } from '@/types/campaign'

// Mock data for development - replace with actual API calls
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'Meme Monday Challenge',
    projectName: 'BasedMemes',
    projectLogo: '/logos/basedmemes.svg',
    rewardPool: '5000 USDC',
    rewardPoolValue: 5000,
    timeLeft: '2d 14h 32m',
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
    participants: 1247,
    status: 'active',
    description: 'Create the funniest Base-themed memes and earn rewards!',
    tasks: [
      'Create original meme about Base L2',
      'Include #BasedMemes hashtag',
      'Get at least 10 likes'
    ],
    rules: [
      'Original content only',
      'Must be Base ecosystem related',
      'No offensive content',
      'Account must be 14+ days old'
    ],
    createdBy: '0x1234...5678',
    createdAt: new Date('2024-01-15'),
    totalSubmissions: 3421,
    averageEngagement: 24.5
  },
  {
    id: '2',
    title: 'DeFi Education Series',
    projectName: 'LearnDeFi',
    projectLogo: '/logos/learndefi.svg',
    rewardPool: '10000 LEARN',
    rewardPoolValue: 10000,
    timeLeft: '5d 8h 15m',
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
    participants: 892,
    status: 'active',
    description: 'Share educational content about DeFi protocols on Base',
    tasks: [
      'Write educational thread about DeFi',
      'Minimum 5 tweets in thread',
      'Include #LearnDeFi tag'
    ],
    rules: [
      'Educational content only',
      'Minimum 5 tweets per thread',
      'Must include sources',
      'No financial advice'
    ],
    createdBy: '0x5678...9012',
    createdAt: new Date('2024-01-10'),
    totalSubmissions: 1876,
    averageEngagement: 18.2
  }
]

/**
 * Get all campaigns with optional filtering
 */
export async function getCampaigns(status?: CampaignStatus): Promise<Campaign[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  if (status) {
    return mockCampaigns.filter(campaign => campaign.status === status)
  }
  
  return mockCampaigns
}

/**
 * Get a single campaign by ID
 */
export async function getCampaign(id: string): Promise<Campaign | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const campaign = mockCampaigns.find(c => c.id === id)
  return campaign || null
}

/**
 * Create a new campaign
 */
export async function createCampaign(data: CreateCampaignData): Promise<Campaign> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Calculate time left based on end date
  const now = new Date()
  const timeDiff = data.endDate.getTime() - now.getTime()
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
  const timeLeft = `${days}d ${hours}h ${minutes}m`

  const newCampaign: Campaign = {
    id: Math.random().toString(36).substr(2, 9),
    ...data,
    timeLeft,
    participants: 0,
    status: 'active',
    createdAt: new Date(),
    totalSubmissions: 0,
    averageEngagement: 0
  }
  
  mockCampaigns.push(newCampaign)
  return newCampaign
}

/**
 * Join a campaign
 */
export async function joinCampaign(campaignId: string, userAddress: string): Promise<boolean> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const campaign = mockCampaigns.find(c => c.id === campaignId)
  if (campaign) {
    campaign.participants += 1
    return true
  }
  
  return false
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(campaignId: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400))
  
  const campaign = mockCampaigns.find(c => c.id === campaignId)
  if (!campaign) return null
  
  return {
    totalParticipants: campaign.participants,
    totalSubmissions: campaign.totalSubmissions,
    averageEngagement: campaign.averageEngagement,
    topPerformers: [
      { username: 'cryptomemer', points: 1250, submissions: 12 },
      { username: 'defi_educator', points: 1180, submissions: 8 },
      { username: 'base_builder', points: 1050, submissions: 10 }
    ],
    dailyStats: [
      { date: '2024-01-15', submissions: 45, engagement: 23.2 },
      { date: '2024-01-16', submissions: 52, engagement: 26.8 },
      { date: '2024-01-17', submissions: 38, engagement: 21.5 }
    ]
  }
}