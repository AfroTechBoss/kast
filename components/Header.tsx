'use client'

import { useState } from 'react'
import { Menu, X, Zap } from 'lucide-react'
import { SIWNButtonCompact } from './siwnbutton'

interface HeaderProps {
  showMenu?: boolean
  title?: string
}

export function Header({ showMenu = true, title }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-primary-purple/20">
      <div className="container-mobile">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-purple rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg leading-none">
                KAST
              </span>
              <div className="h-0.5 bg-primary-purple rounded-full"></div>
            </div>
          </div>

          {/* Title (if provided) */}
          {title && (
            <h1 className="text-white font-semibold text-lg truncate mx-4">
              {title}
            </h1>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* SIWN Auth Button */}
            <SIWNButtonCompact />
            
            {/* Menu Button */}
            {showMenu && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-white hover:text-primary-purple transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && showMenu && (
          <div className="border-t border-primary-purple/20 py-4 animate-slide-up">
            <nav className="space-y-3">
              <a
                href="/"
                className="block px-4 py-2 text-white hover:text-primary-purple hover:bg-primary-purple/10 rounded-lg transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="/leaderboard"
                className="block px-4 py-2 text-white hover:text-primary-purple hover:bg-primary-purple/10 rounded-lg transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Leaderboard
              </a>
              <a
                href="/rewards"
                className="block px-4 py-2 text-white hover:text-primary-purple hover:bg-primary-purple/10 rounded-lg transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                My Rewards
              </a>
              <a
                href="/console"
                className="block px-4 py-2 text-white hover:text-primary-purple hover:bg-primary-purple/10 rounded-lg transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Project Console
              </a>
              <a
                href="/faucet"
                className="block px-4 py-2 text-white hover:text-primary-purple hover:bg-primary-purple/10 rounded-lg transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                🚰 Faucet
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}