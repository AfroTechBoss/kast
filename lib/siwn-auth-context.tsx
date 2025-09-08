'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'

interface User {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  custodyAddress?: string
  verifications?: string[]
}

interface SIWNAuthContextType {
  user: User | null
  isLoading: boolean
  signIn: () => Promise<void>
  signOut: () => void
  authUrl: string | null
  isPolling: boolean
}

const SIWNAuthContext = createContext<SIWNAuthContextType | undefined>(undefined)

// Generate a secure nonce for SIWN
const generateNonce = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function SIWNAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)


  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('siwn_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Failed to parse saved user:', error)
        localStorage.removeItem('siwn_user')
      }
    }
  }, [])

  const signIn = async () => {
    try {
      setIsLoading(true)
      
      const nonce = generateNonce()
      
      // Create SIWN authentication URL using Neynar
      const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID
      if (!clientId) {
        toast.error('Neynar client ID not configured')
        return
      }
      
      const redirectUri = `${window.location.origin}/api/auth/neynar/callback`
      const state = nonce
      
      const authUrl = `https://app.neynar.com/login?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=read_write`
      
      setAuthUrl(authUrl)
      
      // Open authentication in a popup window
      const popup = window.open(
        authUrl,
        'neynar-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )
      
      if (!popup) {
        toast.error('Please allow popups for authentication')
        return
      }
      
      // Start polling for authentication completion
      setIsPolling(true)
      
      const pollForAuth = async () => {
        try {
          const response = await fetch(`/api/auth/neynar/status?nonce=${nonce}`)
          const data = await response.json()
          
          if (data.success && data.user) {
            setUser(data.user)
            localStorage.setItem('siwn_user', JSON.stringify(data.user))
            toast.success('Successfully signed in with Neynar!')
            popup.close()
            setIsPolling(false)
            setAuthUrl(null)
            return
          }
          
          // Continue polling if not authenticated yet
          if (!popup.closed) {
            setTimeout(pollForAuth, 2000)
          } else {
            setIsPolling(false)
            setAuthUrl(null)
            toast.error('Authentication cancelled')
          }
        } catch (error) {
          console.error('Polling error:', error)
          if (!popup.closed) {
            setTimeout(pollForAuth, 2000)
          } else {
            setIsPolling(false)
            setAuthUrl(null)
          }
        }
      }
      
      // Start polling after a short delay
      setTimeout(pollForAuth, 2000)
      
    } catch (error: unknown) {
      console.error('Sign in error:', error)
      toast.error('Failed to initiate sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('siwn_user')
    toast.success('Successfully signed out')
  }

  const value = {
    user,
    isLoading,
    signIn,
    signOut,
    authUrl,
    isPolling
  }

  return (
    <SIWNAuthContext.Provider value={value}>
      {children}
    </SIWNAuthContext.Provider>
  )
}

export function useSIWNAuth() {
  const context = useContext(SIWNAuthContext)
  if (context === undefined) {
    throw new Error('useSIWNAuth must be used within a SIWNAuthProvider')
  }
  return context
}