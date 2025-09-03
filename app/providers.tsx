'use client'

import { ReactNode } from 'react'
import { FrameProvider } from '../components/FrameProvider'
import { FarcasterAuthProvider } from '../lib/farcaster/auth-context'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <FrameProvider>
      <FarcasterAuthProvider>
        {children}
      </FarcasterAuthProvider>
    </FrameProvider>
  )
}