'use client';

import React from 'react';
import { useFarcasterAuth } from '@/lib/farcaster/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FarcasterAuthButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export function FarcasterAuthButton({ 
  className, 
  variant = 'default', 
  size = 'default' 
}: FarcasterAuthButtonProps) {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useFarcasterAuth();

  if (isLoading) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className={className}
        disabled
      >
        Loading...
      </Button>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className={className}
        onClick={signIn}
      >
        <User className="w-4 h-4 mr-2" />
        Sign in with Farcaster
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`h-10 px-3 ${className}`}
        >
          <Avatar className="w-6 h-6 mr-2">
            <AvatarImage src={user.pfpUrl} alt={user.displayName} />
            <AvatarFallback>
              {user.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{user.displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.displayName}</p>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
          <p className="text-xs text-muted-foreground">FID: {user.fid}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Custom hook for render prop pattern (similar to ConnectButton.Custom)
export function useFarcasterAuthButton() {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useFarcasterAuth();

  return {
    account: user ? {
      address: user.custodyAddress || '',
      displayName: user.displayName,
      ensName: user.username,
    } : undefined,
    chain: undefined, // Not applicable for Farcaster
    openAccountModal: () => {}, // Not needed for Farcaster
    openChainModal: () => {}, // Not applicable
    openConnectModal: signIn,
    accountModalOpen: false,
    chainModalOpen: false,
    connectModalOpen: false,
    mounted: !isLoading,
    isConnected: isAuthenticated,
    isLoading,
    signOut,
  };
}