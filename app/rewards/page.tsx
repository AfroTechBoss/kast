'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { Button } from '@/components/Button'
import { Gift, CheckCircle, Clock, Trophy, Star, ExternalLink } from 'lucide-react'

interface Reward {
  id: string
  campaignId: string
  campaignTitle: string
  amount: string
  tokenSymbol: string
  rank: number
  status: 'pending' | 'claimable' | 'claimed'
  claimedAt?: Date
  transactionHash?: string
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

// Mock data
const mockRewards: Reward[] = [
  {
    id: '1',
    campaignId: '1',
    campaignTitle: 'Meme Monday Challenge',
    amount: '150',
    tokenSymbol: 'USDC',
    rank: 8,
    status: 'claimable',
  },
  {
    id: '2',
    campaignId: '2',
    campaignTitle: 'DeFi Education Series',
    amount: '75',
    tokenSymbol: 'LEARN',
    rank: 12,
    status: 'pending',
  },
  {
    id: '3',
    campaignId: '3',
    campaignTitle: 'Base Builder Spotlight',
    amount: '200',
    tokenSymbol: 'BASE',
    rank: 5,
    status: 'claimed',
    claimedAt: new Date('2024-01-10'),
    transactionHash: '0xabcd...1234',
  },
]

const mockBadges: Badge[] = [
  {
    id: '1',
    name: 'Meme Master',
    description: 'Created 10+ viral memes',
    image: '/badges/meme-master.svg',
    rarity: 'rare',
    earnedAt: new Date('2024-01-15'),
    campaignTitle: 'Meme Monday Challenge',
  },
  {
    id: '2',
    name: 'Early Adopter',
    description: 'Joined KAST in the first week',
    image: '/badges/early-adopter.svg',
    rarity: 'epic',
    earnedAt: new Date('2024-01-01'),
    campaignTitle: 'Platform Launch',
  },
  {
    id: '3',
    name: 'Engagement King',
    description: 'Achieved 1000+ total engagement',
    image: '/badges/engagement-king.svg',
    rarity: 'legendary',
    earnedAt: new Date('2024-01-12'),
    campaignTitle: 'DeFi Education Series',
  },
]



function getRarityColor(rarity: Badge['rarity']) {
  switch (rarity) {
    case 'common':
      return 'border-gray-400'
    case 'rare':
      return 'border-blue-400'
    case 'epic':
      return 'border-purple-400'
    case 'legendary':
      return 'border-yellow-400'
    default:
      return 'border-gray-400'
  }
}

function getRarityGlow(rarity: Badge['rarity']) {
  switch (rarity) {
    case 'common':
      return 'shadow-gray-400/20'
    case 'rare':
      return 'shadow-blue-400/20'
    case 'epic':
      return 'shadow-purple-400/20'
    case 'legendary':
      return 'shadow-yellow-400/20 animate-glow'
    default:
      return 'shadow-gray-400/20'
  }
}

export default function RewardsPage() {
  const [activeTab, setActiveTab] = useState<'rewards' | 'badges'>('rewards')
  const [claimingReward, setClaimingReward] = useState<string | null>(null)

  const pendingRewards = mockRewards.filter(r => r.status === 'pending')
  const claimableRewards = mockRewards.filter(r => r.status === 'claimable')
  const claimedRewards = mockRewards.filter(r => r.status === 'claimed')

  const handleClaimReward = async (rewardId: string) => {
    setClaimingReward(rewardId)
    // Simulate claim process
    await new Promise(resolve => setTimeout(resolve, 2000))
    setClaimingReward(null)
    // In real app, update reward status
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="My Rewards" />
      
      <main className="container-mobile section-padding pb-24">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gift className="w-6 h-6 text-primary-purple" />
            <h1 className="text-2xl font-bold">
              My <span className="text-gradient">Rewards</span>
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            Track your earnings and achievements
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-900 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'rewards'
                  ? 'bg-primary-purple text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Rewards
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'badges'
                  ? 'bg-primary-purple text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Badges
            </button>
          </div>
        </div>

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            {/* Claimable Rewards */}
            {claimableRewards.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-green-400" />
                  Ready to Claim ({claimableRewards.length})
                </h2>
                <div className="space-y-3">
                  {claimableRewards.map((reward) => (
                    <div key={reward.id} className="bg-green-900/20 border border-green-400/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white">{reward.campaignTitle}</h3>
                          <p className="text-sm text-gray-400">Rank #{reward.rank}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-400">
                            {reward.amount} {reward.tokenSymbol}
                          </div>
                        </div>
                      </div>
                      <Button
                        fullWidth
                        variant="primary"
                        loading={claimingReward === reward.id}
                        onClick={() => handleClaimReward(reward.id)}
                        className="bg-green-600 border-green-600 hover:bg-green-700"
                      >
                        {claimingReward === reward.id ? 'Claiming...' : 'Claim Reward'}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pending Rewards */}
            {pendingRewards.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  Pending ({pendingRewards.length})
                </h2>
                <div className="space-y-3">
                  {pendingRewards.map((reward) => (
                    <div key={reward.id} className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{reward.campaignTitle}</h3>
                          <p className="text-sm text-gray-400">Rank #{reward.rank} • Campaign ending soon</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-yellow-400">
                            {reward.amount} {reward.tokenSymbol}
                          </div>
                          <p className="text-xs text-gray-400">Estimated</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Claimed Rewards */}
            {claimedRewards.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  Claimed ({claimedRewards.length})
                </h2>
                <div className="space-y-3">
                  {claimedRewards.map((reward) => (
                    <div key={reward.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-white">{reward.campaignTitle}</h3>
                          <p className="text-sm text-gray-400">
                            Claimed on {reward.claimedAt?.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-400">
                            {reward.amount} {reward.tokenSymbol}
                          </div>
                        </div>
                      </div>
                      {reward.transactionHash && (
                        <a
                          href={`https://basescan.org/tx/${reward.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary-purple text-sm hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Transaction
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {mockRewards.length === 0 && (
              <div className="text-center py-12">
                <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">
                  No rewards yet
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Participate in campaigns to start earning rewards
                </p>
                <Button variant="primary">
                  Browse Campaigns
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              {mockBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`bg-black border-2 ${getRarityColor(badge.rarity)} rounded-xl p-4 text-center shadow-lg ${getRarityGlow(badge.rarity)}`}
                >
                  <div className="w-16 h-16 bg-primary-purple/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-primary-purple" />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">
                    {badge.name}
                  </h3>
                  <p className="text-xs text-gray-400 mb-2">
                    {badge.description}
                  </p>
                  <div className="text-xs text-gray-500">
                    {badge.earnedAt.toLocaleDateString()}
                  </div>
                  <div className={`text-xs font-medium mt-1 capitalize ${getRarityColor(badge.rarity).replace('border-', 'text-')}`}>
                    {badge.rarity}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {mockBadges.length === 0 && (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">
                  No badges earned yet
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Complete campaigns and achievements to earn badges
                </p>
                <Button variant="primary">
                  View Achievements
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav activeTab="rewards" />
    </div>
  )
}