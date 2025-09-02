'use client'

import { Clock, Users, Trophy, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Campaign {
  id: string
  title: string
  projectName: string
  projectLogo: string
  rewardPool: string
  timeLeft: string
  participants: number
  status: 'active' | 'ending_soon' | 'ended'
  description: string
  tasks: string[]
}

interface CampaignCardProps {
  campaign: Campaign
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-400'
      case 'ending_soon':
        return 'text-yellow-400'
      case 'ended':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusText = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'ending_soon':
        return 'Ending Soon'
      case 'ended':
        return 'Ended'
      default:
        return 'Unknown'
    }
  }

  return (
    <Link href={`/campaign/${campaign.id}`}>
      <div className="card p-6 hover:shadow-xl hover:shadow-primary-purple/20 transition-all duration-300 cursor-pointer group">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Project Logo */}
          <div className="w-12 h-12 bg-primary-purple/20 rounded-lg flex items-center justify-center flex-shrink-0">
            {campaign.projectLogo ? (
              <Image
                src={campaign.projectLogo}
                alt={`${campaign.projectName} logo`}
                width={32}
                height={32}
                className="rounded-lg"
              />
            ) : (
              <Trophy className="w-6 h-6 text-primary-purple" />
            )}
          </div>

          {/* Campaign Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-black truncate group-hover:text-primary-purple transition-colors">
                {campaign.title}
              </h3>
              <span className={`text-xs font-medium ${getStatusColor(campaign.status)}`}>
                {getStatusText(campaign.status)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              by {campaign.projectName}
            </p>
            <p className="text-sm text-gray-700 line-clamp-2">
              {campaign.description}
            </p>
          </div>

          {/* Arrow Icon */}
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-purple group-hover:translate-x-1 transition-all flex-shrink-0" />
        </div>

        {/* Reward Pool */}
        <div className="mb-4">
          <div className="bg-primary-purple/10 rounded-lg p-3 border border-primary-purple/20">
            <div className="text-xs text-gray-600 mb-1">Total Reward Pool</div>
            <div className="text-xl font-bold text-primary-purple">
              {campaign.rewardPool}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500">Time Left</div>
              <div className="text-sm font-medium text-black">
                {campaign.timeLeft}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500">Participants</div>
              <div className="text-sm font-medium text-black">
                {campaign.participants.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Preview */}
        <div className="border-t border-gray-200 pt-4">
          <div className="text-xs text-gray-500 mb-2">Tasks ({campaign.tasks.length})</div>
          <div className="space-y-1">
            {campaign.tasks.slice(0, 2).map((task, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary-purple rounded-full flex-shrink-0"></div>
                <span className="text-xs text-gray-600 truncate">{task}</span>
              </div>
            ))}
            {campaign.tasks.length > 2 && (
              <div className="text-xs text-primary-purple font-medium">
                +{campaign.tasks.length - 2} more tasks
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}