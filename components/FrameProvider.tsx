'use client'

import { ReactNode, useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

interface FrameProviderProps {
  children: ReactNode
}

export function FrameProvider({ children }: FrameProviderProps) {
  useEffect(() => {
    // Initialize Farcaster Frame SDK
    const initializeFrame = async () => {
      try {
        // Check if we're running in a Farcaster Frame context
        if (typeof window !== 'undefined') {
          // Add frame context detection
          const isInFrame = window.parent !== window || 
                           window.location !== window.parent.location ||
                           document.referrer.includes('warpcast.com') ||
                           document.referrer.includes('farcaster.xyz');

          if (isInFrame) {
            console.log('Initializing Farcaster Frame SDK...');
            
            // Call the ready method to signal that the frame is loaded
            await sdk.actions.ready();
            
            console.log('Farcaster Frame SDK initialized successfully');
          } else {
            console.log('Not running in Frame context, skipping SDK initialization');
          }
        }
      } catch (error) {
        console.error('Failed to initialize Farcaster Frame SDK:', error);
        
        // Fallback: still call ready() even if there's an error
        try {
          await sdk.actions.ready();
        } catch (fallbackError) {
          console.error('Fallback ready() call also failed:', fallbackError);
        }
      }
    }

    initializeFrame()
  }, [])

  // Add frame-specific event listeners
  useEffect(() => {
    const handleFrameMessage = (event: MessageEvent) => {
      // Handle messages from the parent frame if needed
      if (event.origin.includes('warpcast.com') || event.origin.includes('farcaster.xyz')) {
        console.log('Received frame message:', event.data)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleFrameMessage)
      
      return () => {
        window.removeEventListener('message', handleFrameMessage)
      }
    }
  }, [])

  return <>{children}</>
}