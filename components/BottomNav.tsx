'use client'

import { Home, Trophy, Gift, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BottomNavProps {
  activeTab?: 'home' | 'leaderboard' | 'rewards' | 'profile'
}

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    href: '/',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    href: '/leaderboard',
  },
  {
    id: 'rewards',
    label: 'My Rewards',
    icon: Gift,
    href: '/rewards',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    href: '/profile',
  },
]

export function BottomNav({ activeTab }: BottomNavProps) {
  const pathname = usePathname()

  const getActiveTab = () => {
    if (activeTab) return activeTab
    
    // Auto-detect active tab based on pathname
    if (pathname === '/') return 'home'
    if (pathname.startsWith('/leaderboard')) return 'leaderboard'
    if (pathname.startsWith('/rewards')) return 'rewards'
    if (pathname.startsWith('/profile')) return 'profile'
    
    return 'home'
  }

  const currentActiveTab = getActiveTab()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-sm border-t border-primary-purple/20 safe-area-bottom">
      <div className="container-mobile">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentActiveTab === item.id
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon 
                  className={`w-5 h-5 transition-colors ${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-400 group-hover:text-primary-purple'
                  }`} 
                />
                <span 
                  className={`text-xs font-medium transition-colors ${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-400 group-hover:text-primary-purple'
                  }`}
                >
                  {item.label}
                </span>
                
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary-purple rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}