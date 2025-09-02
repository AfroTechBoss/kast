'use client'

import { ReactNode } from 'react'
import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { base } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import { FrameProvider } from '../components/FrameProvider'
import '@rainbow-me/rainbowkit/styles.css'

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [base],
  [publicProvider()]
)

// Configure wallets
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID

// Only configure WalletConnect if project ID is available
const { connectors } = getDefaultWallets({
  appName: 'KAST',
  projectId: projectId || '2f5a2b1c8d3e4f5a6b7c8d9e0f1a2b3c', // Fallback project ID
  chains,
})

// Create wagmi config
const wagmiConfig = createConfig({
  autoConnect: false, // Disable auto-connect to prevent immediate WebSocket errors
  connectors,
  publicClient,
  webSocketPublicClient,
})

// Custom RainbowKit theme
const customTheme = {
  blurs: {
    modalOverlay: 'blur(4px)',
  },
  colors: {
    accentColor: '#9B59B6',
    accentColorForeground: '#FFFFFF',
    actionButtonBorder: '#9B59B6',
    actionButtonBorderMobile: '#9B59B6',
    actionButtonSecondaryBackground: '#000000',
    closeButton: '#FFFFFF',
    closeButtonBackground: '#000000',
    connectButtonBackground: '#000000',
    connectButtonBackgroundError: '#FF4444',
    connectButtonInnerBackground: '#9B59B6',
    connectButtonText: '#FFFFFF',
    connectButtonTextError: '#FFFFFF',
    connectionIndicator: '#00FF00',
    downloadBottomCardBackground: '#000000',
    downloadTopCardBackground: '#000000',
    error: '#FF4444',
    generalBorder: '#9B59B6',
    generalBorderDim: '#7B3F96',
    menuItemBackground: '#000000',
    modalBackdrop: 'rgba(0, 0, 0, 0.8)',
    modalBackground: '#000000',
    modalBorder: '#9B59B6',
    modalText: '#FFFFFF',
    modalTextDim: '#CCCCCC',
    modalTextSecondary: '#AAAAAA',
    profileAction: '#9B59B6',
    profileActionHover: '#BB7EDB',
    profileForeground: '#000000',
    selectedOptionBorder: '#9B59B6',
    standby: '#FFD700',
  },
  fonts: {
    body: 'Inter, system-ui, sans-serif',
  },
  radii: {
    actionButton: '8px',
    connectButton: '8px',
    menuButton: '8px',
    modal: '12px',
    modalMobile: '12px',
  },
  shadows: {
    connectButton: '0 4px 12px rgba(155, 89, 182, 0.25)',
    dialog: '0 8px 32px rgba(0, 0, 0, 0.32)',
    profileDetailsAction: '0 2px 6px rgba(155, 89, 182, 0.15)',
    selectedOption: '0 2px 6px rgba(155, 89, 182, 0.24)',
    selectedWallet: '0 2px 6px rgba(155, 89, 182, 0.24)',
    walletLogo: '0 2px 16px rgba(0, 0, 0, 0.16)',
  },
}

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <FrameProvider>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider
          chains={chains}
          theme={customTheme}
          modalSize="compact"
          coolMode
        >
          {children}
        </RainbowKitProvider>
      </WagmiConfig>
    </FrameProvider>
  )
}