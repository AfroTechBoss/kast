import type { Metadata } from 'next'
import '../styles/globals.css'
import { Providers } from './providers'

// Use system fonts as fallback to avoid network issues during build
const fontClass = 'font-sans'

export const metadata: Metadata = {
  title: 'KAST - Farcaster Reward Campaigns',
  description: 'Launch reward campaigns and earn points by creating casts, memes, or threads on Farcaster',
  keywords: ['farcaster', 'web3', 'rewards', 'campaigns', 'base', 'ethereum'],
  authors: [{ name: 'KAST Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#9B59B6',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'KAST - Farcaster Reward Campaigns',
    description: 'Launch reward campaigns and earn points by creating casts, memes, or threads on Farcaster',
    url: 'https://kast.app',
    siteName: 'KAST',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KAST - Farcaster Reward Campaigns',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KAST - Farcaster Reward Campaigns',
    description: 'Launch reward campaigns and earn points by creating casts, memes, or threads on Farcaster',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${fontClass} bg-background text-foreground antialiased`}>
        <Providers>
          <div className="min-h-screen bg-black">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}