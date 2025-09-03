'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  custodyAddress?: string;
  verifications?: string[];
}

interface FarcasterAuthContextType {
  user: FarcasterUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  token: string | null;
}

const FarcasterAuthContext = createContext<FarcasterAuthContextType | undefined>(undefined);

export function useFarcasterAuth() {
  const context = useContext(FarcasterAuthContext);
  if (context === undefined) {
    throw new Error('useFarcasterAuth must be used within a FarcasterAuthProvider');
  }
  return context;
}

interface FarcasterAuthProviderProps {
  children: ReactNode;
}

export function FarcasterAuthProvider({ children }: FarcasterAuthProviderProps) {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Initialize SDK and check for existing authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize the Farcaster SDK
        await sdk.actions.ready();
        
        // Check if user is already authenticated
        const { token: existingToken } = await sdk.quickAuth.getToken();
        if (existingToken) {
          setToken(existingToken);
          await fetchUserData(existingToken);
        }
      } catch (error) {
        console.error('Failed to initialize Farcaster auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
    
    // Attempt automatic Quick Auth if no existing session
    if (!user && !isLoading) {
      attemptAutoAuth();
    }
  }, [user, isLoading]);

  const fetchUserData = async (authToken: string) => {
    try {
      // Call our backend API to verify the token and get user data
      const response = await fetch('/api/auth/farcaster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: authToken }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser({
          fid: userData.fid,
          username: userData.username,
          displayName: userData.displayName,
          pfpUrl: userData.pfpUrl,
          custodyAddress: userData.custodyAddress,
          verifications: userData.verifications,
        });
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Clear invalid token
      setToken(null);
      setUser(null);
    }
  };

  const signIn = async () => {
    try {
      setIsLoading(true);
      
      // Try Quick Auth first if in miniapp environment
      if (typeof window !== 'undefined' && window.parent !== window) {
        try {
          const { sdk } = await import('@farcaster/miniapp-sdk');
          const { token } = await sdk.quickAuth.getToken();
          
          if (token) {
            // Verify token with backend
            const response = await fetch('/api/auth/farcaster', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token }),
            });
            
            if (response.ok) {
              const data = await response.json();
              setUser({
                fid: data.fid,
                username: data.username,
                displayName: data.displayName,
                pfpUrl: data.pfpUrl,
                custodyAddress: data.custodyAddress,
                verifications: data.verifications,
              });
              setIsLoading(false);
              return;
            }
          }
        } catch (sdkError) {
          console.log('Quick Auth failed, falling back to traditional auth:', sdkError);
        }
      }
      
      // Fallback to traditional auth flow
      // Get auth URL from backend
      const authResponse = await fetch('/api/auth/farcaster');
      const { authUrl, channelToken } = await authResponse.json();
      
      // Open auth window
      const authWindow = window.open(authUrl, 'farcaster-auth', 'width=500,height=600');
      
      // Poll for completion
      const pollForCompletion = () => {
        const interval = setInterval(async () => {
          try {
            if (authWindow?.closed) {
              clearInterval(interval);
              
              // Verify authentication
              const verifyResponse = await fetch('/api/auth/farcaster', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ channelToken }),
              });
              
              if (verifyResponse.ok) {
                const userData = await verifyResponse.json();
                setUser(userData.user);
              }
              
              setIsLoading(false);
            }
          } catch (error) {
            console.error('Auth verification error:', error);
            clearInterval(interval);
            setIsLoading(false);
          }
        }, 1000);
      };
      
      pollForCompletion();
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  const attemptAutoAuth = async () => {
    try {
      // Check if we're in a Farcaster miniapp environment
      if (typeof window !== 'undefined' && window.parent !== window) {
        // Try to get Quick Auth token from miniapp SDK
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        try {
          const { token } = await sdk.quickAuth.getToken();
          
          if (token) {
            // Verify token with backend
            const response = await fetch('/api/auth/farcaster', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token }),
            });
            
            if (response.ok) {
              const data = await response.json();
              setUser({
                fid: data.fid,
                username: data.username,
                displayName: data.displayName,
                pfpUrl: data.pfpUrl,
                custodyAddress: data.custodyAddress,
                verifications: data.verifications,
              });
            }
          }
        } catch (sdkError) {
          // Quick Auth not available or failed, continue without auto-auth
          console.log('Quick Auth not available:', sdkError);
        }
      }
    } catch (error) {
      console.error('Auto auth error:', error);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Call backend to revoke session
      if (token) {
        await fetch('/api/auth/farcaster', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
      
      // Clear local state
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: FarcasterAuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    token,
  };

  return (
    <FarcasterAuthContext.Provider value={value}>
      {children}
    </FarcasterAuthContext.Provider>
  );
}

// Hook for components that need authentication
export function useRequireAuth() {
  const { isAuthenticated, isLoading, signIn } = useFarcasterAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      signIn().catch(console.error);
    }
  }, [isAuthenticated, isLoading, signIn]);
  
  return { isAuthenticated, isLoading };
}