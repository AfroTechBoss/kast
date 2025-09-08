import { ReactNode } from 'react'

// Force dynamic rendering for all pages in the faucet route
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface FaucetLayoutProps {
  children: ReactNode
}

export default function FaucetLayout({ children }: FaucetLayoutProps) {
  return children
}