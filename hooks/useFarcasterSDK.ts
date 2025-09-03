import { useEffect, useState } from 'react';
import { FarcasterSDK, CastComposition, CastId } from '@/lib/farcaster-sdk';

// Hook to manage Farcaster SDK integration
export function useFarcasterSDK() {
  const [isReady, setIsReady] = useState(false);
  const [isInMiniApp, setIsInMiniApp] = useState(false);

  useEffect(() => {
    // Check if we're running in a Farcaster mini app context
    const checkMiniAppContext = () => {
      if (typeof window !== 'undefined') {
        // Check for Farcaster SDK availability
        const isMiniApp = !!(window as any).parent && 
                         (window as any).parent !== window &&
                         (window as any).frameElement;
        setIsInMiniApp(isMiniApp);
        
        if (isMiniApp) {
          // Initialize SDK and mark as ready
          FarcasterSDK.ready();
          setIsReady(true);
        }
      }
    };

    checkMiniAppContext();
  }, []);

  // SDK action wrappers with error handling
  const actions = {
    ready: () => {
      if (isInMiniApp) {
        FarcasterSDK.ready();
        setIsReady(true);
      }
    },

    addMiniApp: () => {
      if (isInMiniApp) {
        FarcasterSDK.addMiniApp();
      } else {
        console.warn('addMiniApp can only be called within a Farcaster mini app');
      }
    },

    close: () => {
      if (isInMiniApp) {
        FarcasterSDK.close();
      } else {
        console.warn('close can only be called within a Farcaster mini app');
      }
    },

    composeCast: (options?: CastComposition) => {
      if (isInMiniApp) {
        FarcasterSDK.composeCast(options);
      } else {
        console.warn('composeCast can only be called within a Farcaster mini app');
      }
    },

    openUrl: (url: string) => {
      if (isInMiniApp) {
        FarcasterSDK.openUrl(url);
      } else {
        // Fallback to regular window.open for non-mini app context
        window.open(url, '_blank');
      }
    },

    openMiniApp: (miniAppId: string) => {
      if (isInMiniApp) {
        FarcasterSDK.openMiniApp(miniAppId);
      } else {
        console.warn('openMiniApp can only be called within a Farcaster mini app');
      }
    },

    signIn: () => {
      if (isInMiniApp) {
        FarcasterSDK.signIn();
      } else {
        console.warn('signIn can only be called within a Farcaster mini app');
      }
    },

    viewProfile: (fid: number) => {
      if (isInMiniApp) {
        FarcasterSDK.viewProfile(fid);
      } else {
        // Fallback to Warpcast URL
        window.open(`https://warpcast.com/~/profiles/${fid}`, '_blank');
      }
    },

    viewCast: (castId: CastId) => {
      if (isInMiniApp) {
        FarcasterSDK.viewCast(castId);
      } else {
        // Fallback to Warpcast URL
        window.open(`https://warpcast.com/~/conversations/${castId.hash}`, '_blank');
      }
    }
  };

  return {
    isReady,
    isInMiniApp,
    actions
  };
}

// Convenience hooks for specific actions
export function useFarcasterCompose() {
  const { actions, isInMiniApp } = useFarcasterSDK();
  
  return {
    composeCast: actions.composeCast,
    isAvailable: isInMiniApp
  };
}

export function useFarcasterNavigation() {
  const { actions, isInMiniApp } = useFarcasterSDK();
  
  return {
    openUrl: actions.openUrl,
    openMiniApp: actions.openMiniApp,
    viewProfile: actions.viewProfile,
    viewCast: actions.viewCast,
    close: actions.close,
    isAvailable: isInMiniApp
  };
}