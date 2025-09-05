'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, User, Loader2 } from 'lucide-react'
import { useSIWNAuth } from '@/lib/siwn-auth-context'

interface SIWNButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  showUserInfo?: boolean
  className?: string
}

export function SIWNButton({ 
  variant = 'default', 
  size = 'default', 
  showUserInfo = true,
  className = ''
}: SIWNButtonProps) {
  const { user, isLoading, signIn, signOut } = useSIWNAuth()

  if (isLoading) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        disabled 
        className={className}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    )
  }

  if (user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showUserInfo && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.pfpUrl} alt={user.displayName} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium">{user.displayName}</p>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>
          </div>
        )}
        <Button 
          variant="outline" 
          size={size} 
          onClick={signOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={signIn}
      className={className}
    >
      Sign in with Neynar
    </Button>
  )
}

// Compact version for mobile/header use
export function SIWNButtonCompact({ className = '' }: { className?: string }) {
  const { user, isLoading, signIn, signOut } = useSIWNAuth()

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  if (user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Avatar className="h-6 w-6">
          <AvatarImage src={user.pfpUrl} alt={user.displayName} />
          <AvatarFallback className="text-xs">
            <User className="h-3 w-3" />
          </AvatarFallback>
        </Avatar>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={signOut}
          className="p-1"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={signIn}
      className={className}
    >
      Sign In
    </Button>
  )
}