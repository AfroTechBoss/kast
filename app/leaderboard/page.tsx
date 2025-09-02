'use client'

import { useState, useEffect, Suspense } from 'react'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Trophy, Medal, Award, Crown, TrendingUp } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface LeaderboardEntry {
  rank: number
  userAddress: string
  username: string
  avatar?: string
  points: number
  submissions: number
  trend: 'up' | 'down' | 'same'
  isCurrentUser?: boolean
}

// Mock leaderboard data
const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    userAddress: '0x1234...5678',
    username: 'cryptomemer',
    points: 1250,
    submissions: 12,
    trend: 'up',
  },
  {
    rank: 2,
    userAddress: '0x2345...6789',
    username: 'defi_educator',
    points: 1180,
    submissions: 8,
    trend: 'same',
  },
  {
    rank: 3,
    userAddress: '0x3456...7890',
    username: 'base_builder',
    points: 1050,
    submissions: 10,
    trend: 'up',
  },
  {
    rank: 4,
    userAddress: '0x4567...8901',
    username: 'meme_master',
    points: 980,
    submissions: 15,
    trend: 'down',
  },
  {
    rank: 5,
    userAddress: '0x5678...9012',
    username: 'cast_creator',
    points: 920,
    submissions: 7,
    trend: 'up',
  },
  {
    rank: 6,
    userAddress: '0x6789...0123',
    username: 'thread_writer',
    points: 850,
    submissions: 9,
    trend: 'same',
  },
  {
    rank: 7,
    userAddress: '0x7890...1234',
    username: 'engagement_king',
    points: 780,
    submissions: 11,
    trend: 'up',
  },
  {
    rank: 8,
    userAddress: '0x8901...2345',
    username: 'viral_content',
    points: 720,
    submissions: 6,
    trend: 'down',
  },
  {
    rank: 42,
    userAddress: '0x9999...9999',
    username: 'you',
    points: 245,
    submissions: 3,
    trend: 'up',
    isCurrentUser: true,
  },
]

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-500" />
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />
    default:
      return (
        <div className="w-6 h-6 bg-primary-purple text-white rounded-full flex items-center justify-center text-xs font-bold">
          {rank}
        </div>
      )
  }
}

function getTrendIcon(trend: LeaderboardEntry['trend']) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-green-500" />
    case 'down':
      return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
    default:
      return <div className="w-4 h-4 bg-gray-400 rounded-full" />
  }
}

function LeaderboardContent() {
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'week' | 'month'>('all')
  const searchParams = useSearchParams()
  const campaignId = searchParams.get('campaign')

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLeaderboard(mockLeaderboard)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [selectedPeriod])

  const currentUser = leaderboard.find(entry => entry.isCurrentUser)
  const topEntries = leaderboard.filter(entry => !entry.isCurrentUser)

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header title="Leaderboard" />
        <main className="container-mobile section-padding pb-24">
          <LoadingSpinner size="lg" text="Loading leaderboard..." className="py-20" />
        </main>
        <BottomNav activeTab="leaderboard" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Leaderboard" />
      
      <main className="container-mobile section-padding pb-24">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-primary-purple" />
            <h1 className="text-2xl font-bold">
              <span className="text-gradient">Leaderboard</span>
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            {campaignId ? 'Campaign Rankings' : 'Global Rankings'}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-900 rounded-lg p-1 flex">
            {(['all', 'week', 'month'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-primary-purple text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {period === 'all' ? 'All Time' : period === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-2 items-end mb-4">
            {/* 2nd Place */}
            {topEntries[1] && (
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Medal className="w-8 h-8 text-white" />
                </div>
                <div className="bg-gray-800 rounded-lg p-3 h-20 flex flex-col justify-center">
                  <div className="font-semibold text-sm truncate">{topEntries[1].username}</div>
                  <div className="text-primary-purple font-bold text-lg">{topEntries[1].points}</div>
                </div>
              </div>
            )}
            
            {/* 1st Place */}
            {topEntries[0] && (
              <div className="text-center">
                <div className="w-20 h-20 bg-yellow-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Crown className="w-10 h-10 text-white" />
                </div>
                <div className="bg-primary-purple rounded-lg p-4 h-24 flex flex-col justify-center">
                  <div className="font-semibold text-white truncate">{topEntries[0].username}</div>
                  <div className="text-white font-bold text-xl">{topEntries[0].points}</div>
                </div>
              </div>
            )}
            
            {/* 3rd Place */}
            {topEntries[2] && (
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="bg-gray-800 rounded-lg p-3 h-20 flex flex-col justify-center">
                  <div className="font-semibold text-sm truncate">{topEntries[2].username}</div>
                  <div className="text-primary-purple font-bold text-lg">{topEntries[2].points}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full Leaderboard */}
        <div className="space-y-2">
          {topEntries.slice(3).map((entry) => (
            <div key={entry.rank} className="bg-gray-900 rounded-lg p-4 flex items-center gap-4">
              <div className="flex items-center gap-3">
                {getRankIcon(entry.rank)}
                <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0"></div>
              </div>
              
              <div className="flex-1">
                <div className="font-semibold text-white">{entry.username}</div>
                <div className="text-sm text-gray-400">{entry.submissions} submissions</div>
              </div>
              
              <div className="text-right flex items-center gap-2">
                <div>
                  <div className="font-bold text-primary-purple text-lg">{entry.points}</div>
                  <div className="text-xs text-gray-400">points</div>
                </div>
                {getTrendIcon(entry.trend)}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Current User Position (Sticky) */}
      {currentUser && (
        <div className="fixed bottom-16 left-0 right-0 z-30">
          <div className="container-mobile">
            <div className="bg-primary-purple rounded-lg p-4 mx-4 shadow-lg border border-primary-purple-light">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {getRankIcon(currentUser.rank)}
                  <div className="w-10 h-10 bg-white/20 rounded-full flex-shrink-0"></div>
                </div>
                
                <div className="flex-1">
                  <div className="font-semibold text-white">{currentUser.username} (You)</div>
                  <div className="text-sm text-white/80">{currentUser.submissions} submissions</div>
                </div>
                
                <div className="text-right flex items-center gap-2">
                  <div>
                    <div className="font-bold text-white text-lg">{currentUser.points}</div>
                    <div className="text-xs text-white/80">points</div>
                  </div>
                  {getTrendIcon(currentUser.trend)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab="leaderboard" />
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white">
        <Header title="Leaderboard" />
        <main className="container-mobile section-padding pb-24">
          <LoadingSpinner size="lg" text="Loading leaderboard..." className="py-20" />
        </main>
        <BottomNav activeTab="leaderboard" />
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  )
}