'use client'

import { Suspense, useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { Button } from '@/components/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getCampaign, joinCampaign } from '@/services/campaigns'
import { Clock, Users, Trophy, CheckCircle, Share2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface CampaignDetailPageProps {
  params: {
    id: string
  }
}

// Mock leaderboard data
const mockLeaderboard = [
  { rank: 1, username: 'cryptomemer', points: 1250, avatar: '/avatars/1.png' },
  { rank: 2, username: 'defi_educator', points: 1180, avatar: '/avatars/2.png' },
  { rank: 3, username: 'base_builder', points: 1050, avatar: '/avatars/3.png' },
]

function CountdownTimer({ endDate }: { endDate: Date }) {
  // In a real app, this would update every second
  const now = new Date()
  const timeLeft = endDate.getTime() - now.getTime()
  
  if (timeLeft <= 0) {
    return <span className="text-red-400">Campaign Ended</span>
  }
  
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  
  return (
    <span className="font-mono">
      {days}d {hours}h {minutes}m
    </span>
  )
}

function CampaignContent({ id }: { id: string }) {
  interface Campaign {
    id: string;
    title: string;
    projectName: string;
    projectLogo?: string;
    description: string;
    rewardPool: string;
    endDate: Date;
    participants: number;
    tasks: string[];
    rules: string[];
  }

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const campaignData = await getCampaign(id)
        if (!campaignData) {
          notFound()
        }
        setCampaign(campaignData)
        // Check if user has already joined (mock check)
        setHasJoined(false)
      } catch (error) {
        console.error('Error loading campaign:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCampaign()
  }, [id])

  const handleJoinCampaign = async () => {
    setJoining(true)
    try {
      const success = await joinCampaign(id, 'anonymous')
      if (success) {
        setHasJoined(true)
        // Update campaign participant count
        setCampaign((prev) => prev ? ({
          ...prev,
          participants: prev.participants + 1
        }) : null)
      }
    } catch (error) {
      console.error('Error joining campaign:', error)
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return <CampaignLoading />
  }
  
  if (!campaign) {
    notFound()
  }
  
  return (
    <div className="space-y-6">
      {/* Campaign Header */}
      <div className="card p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 bg-primary-purple/20 rounded-xl flex items-center justify-center flex-shrink-0">
            {campaign.projectLogo ? (
              <Image
                src={campaign.projectLogo}
                alt={`${campaign.projectName} logo`}
                width={48}
                height={48}
                className="rounded-xl"
              />
            ) : (
              <Trophy className="w-8 h-8 text-primary-purple" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-black mb-1">
              {campaign.title}
            </h1>
            <p className="text-gray-600 mb-2">
              by {campaign.projectName}
            </p>
            <p className="text-gray-700">
              {campaign.description}
            </p>
          </div>
          <button className="p-2 text-gray-500 hover:text-primary-purple transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Reward Pool & Stats */}
      <div className="grid grid-cols-1 gap-4">
        <div className="card p-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Total Reward Pool</div>
            <div className="text-4xl font-bold text-primary-purple mb-4">
              {campaign.rewardPool}
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Time Left</span>
                </div>
                <div className="font-semibold text-black">
                  <CountdownTimer endDate={campaign.endDate} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Participants</span>
                </div>
                <div className="font-semibold text-black">
                  {campaign.participants.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-black mb-4">
          Campaign Tasks
        </h2>
        <div className="space-y-3">
          {campaign.tasks.map((task: string, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-purple/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-primary-purple" />
              </div>
              <span className="text-gray-700">{task}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-black mb-4">
          Campaign Rules
        </h2>
        <div className="space-y-2">
          {campaign.rules.map((rule: string, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary-purple rounded-full flex-shrink-0 mt-2"></div>
              <span className="text-sm text-gray-600">{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black">
            Leaderboard
          </h2>
          <Link 
            href={`/leaderboard?campaign=${campaign.id}`}
            className="text-primary-purple font-medium text-sm hover:underline"
          >
            View Full Leaderboard
          </Link>
        </div>
        <div className="space-y-3">
          {mockLeaderboard.map((entry) => (
            <div key={entry.rank} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-primary-purple text-white rounded-full flex items-center justify-center text-sm font-bold">
                {entry.rank}
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="font-medium text-black">{entry.username}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary-purple">{entry.points}</div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Join Campaign Button */}
      <div className="card p-6">
        {hasJoined ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">You&apos;ve joined this campaign!</span>
            </div>
            <p className="text-xs text-gray-500">
              Start creating content to earn points and climb the leaderboard
            </p>
          </div>
        ) : (
          <>
            <Button 
              fullWidth 
              size="lg" 
              className="mb-3" 
              onClick={handleJoinCampaign}
              disabled={joining}
            >
              {joining ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Joining...
                </>
              ) : (
                'Join Campaign'
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Click to join and start earning points
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function CampaignLoading() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card p-6 animate-pulse">
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            <div className="h-3 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Campaign Details" showMenu={false} />
      
      <main className="container-mobile section-padding pb-24">
        <Suspense fallback={<CampaignLoading />}>
          <CampaignContent id={params.id} />
        </Suspense>
      </main>

      <BottomNav />
    </div>
  )
}