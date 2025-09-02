import { Suspense } from 'react'
import { Header } from '@/components/Header'
import { CampaignCard } from '@/components/CampaignCard'
import { BottomNav } from '@/components/BottomNav'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getCampaigns } from '@/services/campaigns'

// Mock data for development
const mockCampaigns = [
  {
    id: '1',
    title: 'Meme Monday Challenge',
    projectName: 'BasedMemes',
    projectLogo: '/logos/basedmemes.png',
    rewardPool: '5000 USDC',
    timeLeft: '2d 14h 32m',
    participants: 1247,
    status: 'active' as const,
    description: 'Create the funniest Base-themed memes and earn rewards!',
    tasks: [
      'Create original meme about Base L2',
      'Include #BasedMemes hashtag',
      'Get at least 10 likes'
    ]
  },
  {
    id: '2',
    title: 'DeFi Education Series',
    projectName: 'LearnDeFi',
    projectLogo: '/logos/learndefi.png',
    rewardPool: '10000 LEARN',
    timeLeft: '5d 8h 15m',
    participants: 892,
    status: 'active' as const,
    description: 'Share educational content about DeFi protocols on Base',
    tasks: [
      'Write educational thread about DeFi',
      'Minimum 5 tweets in thread',
      'Include #LearnDeFi tag'
    ]
  },
  {
    id: '3',
    title: 'Base Builder Spotlight',
    projectName: 'BaseBuilders',
    projectLogo: '/logos/basebuilders.svg',
    rewardPool: '2500 BASE',
    timeLeft: '12h 45m',
    participants: 2156,
    status: 'ending_soon' as const,
    description: 'Showcase your favorite Base ecosystem projects',
    tasks: [
      'Create cast about Base project',
      'Tag the project team',
      'Explain why you love it'
    ]
  }
]

function CampaignsList() {
  return (
    <div className="space-y-4">
      {mockCampaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  )
}

function CampaignsLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-6 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="container-mobile section-padding pb-24">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">
            Welcome to <span className="text-gradient">KAST</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Earn rewards by creating amazing content on Farcaster
          </p>
        </div>

        {/* Active Campaigns Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Active Campaigns
            </h2>
            <span className="text-sm text-primary-purple font-medium">
              {mockCampaigns.length} Live
            </span>
          </div>
          
          <Suspense fallback={<CampaignsLoading />}>
            <CampaignsList />
          </Suspense>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 gap-4 mb-8">
          <div className="card-dark p-4 text-center">
            <div className="text-2xl font-bold text-primary-purple mb-1">
              $47.2K
            </div>
            <div className="text-sm text-gray-400">
              Total Rewards
            </div>
          </div>
          <div className="card-dark p-4 text-center">
            <div className="text-2xl font-bold text-primary-purple mb-1">
              3,247
            </div>
            <div className="text-sm text-gray-400">
              Active Casters
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="card-dark p-6">
            <h3 className="text-lg font-semibold mb-2">
              Ready to start earning?
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Connect your wallet and join your first campaign
            </p>
            <button className="btn-primary w-full">
              Connect Wallet
            </button>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab="home" />
    </div>
  )
}