'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { Droplets, Clock, CheckCircle, AlertCircle, Wallet } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { toast } from 'sonner'

// This page uses Web3 hooks and must be rendered dynamically
export const dynamic = 'force-dynamic'

const KAST_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_KAST_TOKEN_ADDRESS as `0x${string}`
const CLAIM_AMOUNT = '100' // 100 KAST tokens
const COOLDOWN_HOURS = 24

// ERC20 ABI for the faucet function
const KAST_TOKEN_ABI = [
  {
    inputs: [],
    name: 'faucet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'lastClaimTime',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

interface ClaimStatus {
  canClaim: boolean
  timeUntilNextClaim: number
  lastClaimTime: number
}

export default function FaucetPage() {
  const { address, isConnected } = useAccount()
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>({
    canClaim: true,
    timeUntilNextClaim: 0,
    lastClaimTime: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

  // Contract interactions
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Read user's KAST balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: KAST_TOKEN_ADDRESS,
    abi: KAST_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Read last claim time
  const { data: lastClaimTime, refetch: refetchLastClaimTime } = useReadContract({
    address: KAST_TOKEN_ADDRESS,
    abi: KAST_TOKEN_ABI,
    functionName: 'lastClaimTime',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Check claim eligibility
  useEffect(() => {
    if (!lastClaimTime || !address) {
      setClaimStatus({ canClaim: true, timeUntilNextClaim: 0, lastClaimTime: 0 })
      return
    }

    const lastClaim = Number(lastClaimTime)
    const now = Math.floor(Date.now() / 1000)
    const cooldownSeconds = COOLDOWN_HOURS * 60 * 60
    const timeSinceLastClaim = now - lastClaim
    const canClaim = timeSinceLastClaim >= cooldownSeconds
    const timeUntilNextClaim = canClaim ? 0 : cooldownSeconds - timeSinceLastClaim

    setClaimStatus({
      canClaim,
      timeUntilNextClaim,
      lastClaimTime: lastClaim,
    })
  }, [lastClaimTime, address])

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess) {
      toast.success(`Successfully claimed ${CLAIM_AMOUNT} KAST tokens!`)
      refetchBalance()
      refetchLastClaimTime()
      setIsLoading(false)
    }
  }, [isSuccess, refetchBalance, refetchLastClaimTime])

  const handleClaim = async () => {
    if (!address || !claimStatus.canClaim) return

    try {
      setIsLoading(true)
      await writeContract({
        address: KAST_TOKEN_ADDRESS,
        abi: KAST_TOKEN_ABI,
        functionName: 'faucet',
      })
    } catch (error) {
      console.error('Claim failed:', error)
      toast.error('Failed to claim tokens. Please try again.')
      setIsLoading(false)
    }
  }

  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // Auto-update countdown
  useEffect(() => {
    if (claimStatus.timeUntilNextClaim > 0) {
      const interval = setInterval(() => {
        setClaimStatus(prev => ({
          ...prev,
          timeUntilNextClaim: Math.max(0, prev.timeUntilNextClaim - 1),
          canClaim: prev.timeUntilNextClaim <= 1,
        }))
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [claimStatus.timeUntilNextClaim])

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="KAST Faucet" />
      
      <main className="container-mobile section-padding pb-24">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-purple rounded-full flex items-center justify-center mx-auto mb-4">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            <span className="text-gradient">KAST</span> Token Faucet
          </h1>
          <p className="text-gray-400 text-sm">
            Claim free KAST testnet tokens for development and testing
          </p>
        </div>

        {/* Wallet Connection Status */}
        {!isConnected ? (
          <div className="card-dark p-6 text-center mb-6">
            <Wallet className="w-12 h-12 text-primary-purple mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-gray-400 text-sm mb-4">
              Connect your wallet to claim free KAST tokens
            </p>
            <button className="btn-primary w-full">
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Balance Display */}
            <div className="card-dark p-6 mb-6">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">Your KAST Balance</div>
                <div className="text-2xl font-bold text-primary-purple">
                  {balance ? formatEther(balance) : '0'} KAST
                </div>
              </div>
            </div>

            {/* Claim Section */}
            <div className="card-dark p-6 mb-6">
              <div className="text-center mb-6">
                <div className="text-lg font-semibold mb-2">Claim Tokens</div>
                <div className="text-3xl font-bold text-primary-purple mb-1">
                  {CLAIM_AMOUNT} KAST
                </div>
                <div className="text-sm text-gray-400">
                  Available every {COOLDOWN_HOURS} hours
                </div>
              </div>

              {/* Claim Status */}
              {claimStatus.canClaim ? (
                <div className="flex items-center justify-center gap-2 mb-4 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Ready to claim!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 mb-4 text-yellow-400">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Next claim in: {formatTimeRemaining(claimStatus.timeUntilNextClaim)}
                  </span>
                </div>
              )}

              {/* Claim Button */}
              <button
                onClick={handleClaim}
                disabled={!claimStatus.canClaim || isLoading || isPending || isConfirming}
                className={`w-full py-4 rounded-lg font-semibold transition-all duration-200 ${
                  claimStatus.canClaim && !isLoading && !isPending && !isConfirming
                    ? 'btn-primary hover:shadow-lg hover:shadow-primary-purple/25'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading || isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Confirming...
                  </div>
                ) : isConfirming ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : claimStatus.canClaim ? (
                  `Claim ${CLAIM_AMOUNT} KAST`
                ) : (
                  'Claim Unavailable'
                )}
              </button>
            </div>

            {/* Information Section */}
            <div className="card-dark p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary-purple" />
                Faucet Information
              </h3>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Claim Amount:</span>
                  <span className="text-white">{CLAIM_AMOUNT} KAST</span>
                </div>
                <div className="flex justify-between">
                  <span>Cooldown Period:</span>
                  <span className="text-white">{COOLDOWN_HOURS} hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span className="text-white">Base Testnet</span>
                </div>
                <div className="flex justify-between">
                  <span>Token Contract:</span>
                  <span className="text-white font-mono text-xs">
                    {KAST_TOKEN_ADDRESS?.slice(0, 6)}...{KAST_TOKEN_ADDRESS?.slice(-4)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}