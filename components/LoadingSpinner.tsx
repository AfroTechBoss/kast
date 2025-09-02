'use client'

import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <Loader2 
        className={`${sizeClasses[size]} text-primary-purple animate-spin`} 
      />
      {text && (
        <span className="text-sm text-gray-400 animate-pulse">
          {text}
        </span>
      )}
    </div>
  )
}

// Full screen loading component
export function FullScreenLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black border border-primary-purple rounded-xl p-8 text-center">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  )
}

// Inline loading for cards/sections
export function InlineLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <LoadingSpinner size="md" />
    </div>
  )
}