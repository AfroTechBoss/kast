export type CampaignStatus = 'active' | 'ending_soon' | 'ended' | 'draft'

export interface Campaign {
  id: string
  title: string
  projectName: string
  projectLogo: string
  rewardPool: string // Display string like "5000 USDC"
  rewardPoolValue: number // Numeric value for calculations
  timeLeft: string // Display string like "2d 14h 32m"
  endDate: Date
  participants: number
  status: CampaignStatus
  description: string
  tasks: string[]
  rules: string[]
  createdBy: string // Wallet address
  createdAt: Date
  totalSubmissions: number
  averageEngagement: number
}

export interface CreateCampaignData {
  title: string
  projectName: string
  projectLogo: string
  rewardPool: string
  rewardPoolValue: number
  endDate: Date
  description: string
  tasks: string[]
  rules: string[]
  createdBy: string
}

export interface CampaignSubmission {
  id: string
  campaignId: string
  userAddress: string
  username: string
  castHash: string
  castUrl: string
  submissionType: 'cast' | 'meme' | 'thread' | 'reply'
  content: string
  points: number
  engagement: {
    likes: number
    recasts: number
    replies: number
    uniqueEngagers: number
  }
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: Date
  reviewedAt?: Date
  rejectionReason?: string
}

export interface CampaignLeaderboard {
  campaignId: string
  entries: LeaderboardEntry[]
  userRank?: number
  totalParticipants: number
  lastUpdated: Date
}

export interface LeaderboardEntry {
  rank: number
  userAddress: string
  username: string
  avatar?: string
  points: number
  submissions: number
  isCurrentUser?: boolean
}

export interface CampaignReward {
  id: string
  campaignId: string
  userAddress: string
  amount: string
  tokenAddress: string
  tokenSymbol: string
  rank: number
  status: 'pending' | 'claimable' | 'claimed'
  claimedAt?: Date
  transactionHash?: string
}

export interface CampaignAnalytics {
  totalParticipants: number
  totalSubmissions: number
  averageEngagement: number
  topPerformers: {
    username: string
    points: number
    submissions: number
  }[]
  dailyStats: {
    date: string
    submissions: number
    engagement: number
  }[]
}