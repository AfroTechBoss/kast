'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Button } from '@/components/Button'
import { 
  User, 
  Trophy, 
  Award, 
  TrendingUp, 
  Calendar, 
  Target,
  ExternalLink,
  Copy,
  Settings,
  Wallet,
  Crown,
  Medal,
  Star
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface UserProfile {
  id: string
  username: string
  displayName: string
  walletAddress: string
  avatarUrl?: string
  totalScore: number
  campaignsJoined: number
  totalSubmissions: number
  badgesEarned: number
  rewardsClaimed: number
  totalRewardsValue: string
  joinedAt: Date
  rank: number
  totalUsers: number
}

interface Badge {
  id: string
  name: string
  description: string
  image: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  earnedAt: Date
  campaignTitle: string
}

interface CampaignHistory {
  id: string
  title: string
  status: 'active' | 'ended'
  rank: number
  points: number
  submissions: number
  joinedAt: Date
  endDate: Date
}

// Mock data
const mockProfile: UserProfile = {
  id: '1',
  username: 'cryptomemer',
  displayName: 'Crypto Memer',
  walletAddress: '0x1234567890123456789012345678901234567890',
  avatarUrl: undefined,
  totalScore: 2450,
  campaignsJoined: 5,
  totalSubmissions: 23,
  badgesEarned: 4,
  rewardsClaimed: 3,
  totalRewardsValue: '1,250 USDC',
  joinedAt: new Date('2024-01-01'),
  rank: 42,
  totalUsers: 1250
}

const mockBadges: Badge[] = [
  {
    id: '1',
    name: 'First Campaign',
    description: 'Participated in your first campaign',
    image: '/badges/first-campaign.png',
    rarity: 'common',
    earnedAt: new Date('2024-01-02'),
    campaignTitle: 'Meme Monday Challenge'
  },
  {
    id: '2',
    name: 'Top Performer',
    description: 'Ranked in top 10 of a campaign',
    image: '/badges/top-performer.png',
    rarity: 'rare',
    earnedAt: new Date('2024-01-15'),
    campaignTitle: 'DeFi Education Series'
  },
  {
    id: '3',
    name: 'Engagement King',
    description: 'Achieved 1000+ total engagement',
    image: '/badges/engagement-king.png',
    rarity: 'epic',
    earnedAt: new Date('2024-01-20'),
    campaignTitle: 'Base Builder Spotlight'
  },
  {
    id: '4',
    name: 'Viral Creator',
    description: 'Created content with 10k+ engagement',
    image: '/badges/viral-creator.png',
    rarity: 'legendary',
    earnedAt: new Date('2024-01-25'),
    campaignTitle: 'Meme Monday Challenge'
  }
]

const mockCampaignHistory: CampaignHistory[] = [
  {
    id: '1',
    title: 'Meme Monday Challenge',
    status: 'active',
    rank: 3,
    points: 1250,
    submissions: 8,
    joinedAt: new Date('2024-01-01'),
    endDate: new Date('2024-01-31')
  },
  {
    id: '2',
    title: 'DeFi Education Series',
    status: 'active',
    rank: 7,
    points: 890,
    submissions: 6,
    joinedAt: new Date('2024-01-15'),
    endDate: new Date('2024-02-15')
  },
  {
    id: '3',
    title: 'Base Builder Spotlight',
    status: 'ended',
    rank: 2,
    points: 1580,
    submissions: 9,
    joinedAt: new Date('2023-12-01'),
    endDate: new Date('2023-12-31')
  }
]

function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'common': return 'text-gray-400 border-gray-400'
    case 'rare': return 'text-blue-400 border-blue-400'
    case 'epic': return 'text-purple-400 border-purple-400'
    case 'legendary': return 'text-yellow-400 border-yellow-400'
    default: return 'text-gray-400 border-gray-400'
  }
}

function getRarityIcon(rarity: string) {
  switch (rarity) {
    case 'common': return <Medal className="w-4 h-4" />
    case 'rare': return <Award className="w-4 h-4" />
    case 'epic': return <Trophy className="w-4 h-4" />
    case 'legendary': return <Crown className="w-4 h-4" />
    default: return <Medal className="w-4 h-4" />
  }
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'history'>('overview')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    await navigator.clipboard.writeText(mockProfile.walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        {/* Profile Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-primary-purple rounded-full flex items-center justify-center text-white text-xl font-bold">
              {mockProfile.displayName.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-black mb-1">{mockProfile.displayName}</h1>
              <p className="text-gray-600 mb-2">@{mockProfile.username}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Wallet className="w-4 h-4" />
                <span>{formatAddress(mockProfile.walletAddress)}</span>
                <button 
                  onClick={copyAddress}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Copy className={`w-3 h-3 ${copied ? 'text-green-500' : 'text-gray-400'}`} />
                </button>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-purple">{mockProfile.totalScore.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-purple">#{mockProfile.rank}</div>
              <div className="text-sm text-gray-500">Global Rank</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-purple">{mockProfile.campaignsJoined}</div>
              <div className="text-sm text-gray-500">Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-purple">{mockProfile.badgesEarned}</div>
              <div className="text-sm text-gray-500">Badges</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white rounded-lg p-1 mb-6 shadow-sm">
          {[
            { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
            { id: 'badges', label: 'Badges', icon: <Trophy className="w-4 h-4" /> },
            { id: 'history', label: 'History', icon: <Calendar className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-purple text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Achievement Summary */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-purple" />
                Achievement Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-primary-purple" />
                    <span className="text-sm text-gray-600">Submissions</span>
                  </div>
                  <div className="text-xl font-bold text-black">{mockProfile.totalSubmissions}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-primary-purple" />
                    <span className="text-sm text-gray-600">Rewards Claimed</span>
                  </div>
                  <div className="text-xl font-bold text-black">{mockProfile.rewardsClaimed}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-primary-purple" />
                    <span className="text-sm text-gray-600">Total Value</span>
                  </div>
                  <div className="text-xl font-bold text-black">{mockProfile.totalRewardsValue}</div>
                </div>
              </div>
            </div>

            {/* Recent Badges */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-black flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary-purple" />
                  Recent Badges
                </h2>
                <Link href="#" onClick={() => setActiveTab('badges')} className="text-primary-purple text-sm font-medium hover:underline">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {mockBadges.slice(0, 4).map((badge) => (
                  <div key={badge.id} className={`border-2 rounded-lg p-3 text-center ${getRarityColor(badge.rarity)}`}>
                    <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                      {getRarityIcon(badge.rarity)}
                    </div>
                    <div className="text-xs font-medium text-black">{badge.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="space-y-4">
            {mockBadges.map((badge) => (
              <div key={badge.id} className="card p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 border-2 rounded-lg flex items-center justify-center ${getRarityColor(badge.rarity)}`}>
                    {getRarityIcon(badge.rarity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-black">{badge.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getRarityColor(badge.rarity)}`}>
                        {badge.rarity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Earned: {badge.earnedAt.toLocaleDateString()}</span>
                      <span>Campaign: {badge.campaignTitle}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {mockCampaignHistory.map((campaign) => (
              <div key={campaign.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-black">{campaign.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        campaign.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        Rank #{campaign.rank}
                      </span>
                      <span>{campaign.points} points</span>
                      <span>{campaign.submissions} submissions</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Joined: {campaign.joinedAt.toLocaleDateString()} • 
                      {campaign.status === 'active' ? 'Ends' : 'Ended'}: {campaign.endDate.toLocaleDateString()}
                    </div>
                  </div>
                  <Link href={`/campaign/${campaign.id}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav activeTab="profile" />
    </div>
  )
}