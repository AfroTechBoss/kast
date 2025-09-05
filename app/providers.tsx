'use client'

import { ReactNode } from 'react'
import { FrameProvider } from '../components/FrameProvider'
import { SIWNAuthProvider } from '../lib/siwn-auth-context'
import { Toaster } from 'sonner'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SIWNAuthProvider>
      <FrameProvider>
        {children}
        <Toaster position="top-right" richColors />
      </FrameProvider>
    </SIWNAuthProvider>
  )
}