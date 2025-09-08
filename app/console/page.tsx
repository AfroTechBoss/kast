'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { Button } from '@/components/ui/button'
import { 
  Settings, 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Eye, 
  Edit, 
  Download,
  Plus 
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Campaign {
  id: string
  title: string
  description: string
  rewardPool: string
  tokenSymbol: string
  status: 'active' | 'ended' | 'draft'
  participants: number
  submissions: number
  startDate: Date
  endDate: Date
  totalEngagement: number
}

interface Analytics {
  totalCampaigns: number
  totalParticipants: number
  totalRewardsDistributed: string
  avgEngagementRate: number
  topPerformingCampaign: string
}

// Mock data
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'Meme Monday Challenge',
    description: 'Create viral memes about our DeFi protocol',
    rewardPool: '5000',
    tokenSymbol: 'USDC',
    status: 'active',
    participants: 234,
    submissions: 456,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    totalEngagement: 12500,
  },
  {
    id: '2',
    title: 'DeFi Education Series',
    description: 'Educational content about yield farming',
    rewardPool: '3000',
    tokenSymbol: 'LEARN',
    status: 'active',
    participants: 156,
    submissions: 289,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-02-15'),
    totalEngagement: 8900,
  },
  {
    id: '3',
    title: 'Base Builder Spotlight',
    description: 'Showcase your Base ecosystem projects',
    rewardPool: '10000',
    tokenSymbol: 'BASE',
    status: 'ended',
    participants: 89,
    submissions: 134,
    startDate: new Date('2023-12-01'),
    endDate: new Date('2023-12-31'),
    totalEngagement: 15600,
  },
]

const mockAnalytics: Analytics = {
  totalCampaigns: 12,
  totalParticipants: 1250,
  totalRewardsDistributed: '45,000',
  avgEngagementRate: 8.5,
  topPerformingCampaign: 'Base Builder Spotlight',
}

function getStatusColor(status: Campaign['status']) {
  switch (status) {
    case 'active':
      return 'text-green-400 bg-green-400/10 border-green-400/30'
    case 'ended':
      return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
    case 'draft':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
    default:
      return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
  }
}

export default function ConsolePage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'analytics'>('campaigns')
  const router = useRouter()

  const activeCampaigns = mockCampaigns.filter(c => c.status === 'active')
  const endedCampaigns = mockCampaigns.filter(c => c.status === 'ended')
  const draftCampaigns = mockCampaigns.filter(c => c.status === 'draft')

  const handleCreateCampaign = () => {
    router.push('/console/create')
  }

  const handleViewCampaign = (campaignId: string) => {
    router.push(`/campaign/${campaignId}`)
  }

  const handleEditCampaign = (campaignId: string) => {
    router.push(`/console/edit/${campaignId}`)
  }

  const handleEndCampaign = async () => {
    // Simulate ending campaign
    await new Promise(resolve => setTimeout(resolve, 2000))
    // In real app, update campaign status
  }

  const handleExportAnalytics = async () => {
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 1500))
    // In real app, trigger download
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Project Console" />
      
      <main className="container-mobile section-padding pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Project <span className="text-gradient">Console</span>
            </h1>
            <p className="text-gray-400 text-sm">
              Manage your campaigns and track performance
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleCreateCampaign}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create
          </Button>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-900 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'campaigns'
                  ? 'bg-primary-purple text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Campaigns
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-primary-purple text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            {/* Active Campaigns */}
            {activeCampaigns.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Active Campaigns ({activeCampaigns.length})
                </h2>
                <div className="space-y-3">
                  {activeCampaigns.map((campaign) => (
                    <div key={campaign.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{campaign.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{campaign.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {campaign.participants} participants
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              {campaign.submissions} submissions
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Ends {campaign.endDate.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-lg font-bold text-primary-purple">
                            {campaign.rewardPool} {campaign.tokenSymbol}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewCampaign(campaign.id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditCampaign(campaign.id)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleEndCampaign()}
                          className="flex items-center gap-1 ml-auto"
                        >
                          End Campaign
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Draft Campaigns */}
            {draftCampaigns.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-yellow-400" />
                  Drafts ({draftCampaigns.length})
                </h2>
                <div className="space-y-3">
                  {draftCampaigns.map((campaign) => (
                    <div key={campaign.id} className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{campaign.title}</h3>
                          <p className="text-sm text-gray-400">{campaign.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEditCampaign(campaign.id)}>
                            Continue Editing
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Ended Campaigns */}
            {endedCampaigns.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  Ended Campaigns ({endedCampaigns.length})
                </h2>
                <div className="space-y-3">
                  {endedCampaigns.map((campaign) => (
                    <div key={campaign.id} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{campaign.title}</h3>
                          <p className="text-sm text-gray-400 mb-2">{campaign.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{campaign.participants} participants</span>
                            <span>{campaign.submissions} submissions</span>
                            <span>Ended {campaign.endDate.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-lg font-bold text-gray-400">
                            {campaign.rewardPool} {campaign.tokenSymbol}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewCampaign(campaign.id)}
                            className="mt-2"
                          >
                            View Results
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {mockCampaigns.length === 0 && (
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">
                  No campaigns yet
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Create your first campaign to start engaging with the community
                </p>
                <Button variant="default" onClick={handleCreateCampaign}>
                  Create Campaign
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-purple" />
                Overview
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-primary-purple" />
                    <span className="text-sm text-gray-400">Total Campaigns</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {mockAnalytics.totalCampaigns}
                  </div>
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-primary-purple" />
                    <span className="text-sm text-gray-400">Total Participants</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {mockAnalytics.totalParticipants.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-primary-purple" />
                    <span className="text-sm text-gray-400">Rewards Distributed</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ${mockAnalytics.totalRewardsDistributed}
                  </div>
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary-purple" />
                    <span className="text-sm text-gray-400">Avg Engagement</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {mockAnalytics.avgEngagementRate}%
                  </div>
                </div>
              </div>
            </section>

            {/* Top Performing Campaign */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">
                Top Performing Campaign
              </h2>
              <div className="bg-gradient-to-r from-primary-purple/20 to-transparent border border-primary-purple/30 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">
                  {mockAnalytics.topPerformingCampaign}
                </h3>
                <p className="text-sm text-gray-400">
                  Highest engagement rate and participant satisfaction
                </p>
              </div>
            </section>

            {/* Export Options */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">
                Export Analytics
              </h2>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => handleExportAnalytics()}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleExportAnalytics()}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </Button>
              </div>
            </section>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}