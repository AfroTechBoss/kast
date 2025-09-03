import { sdk } from '@farcaster/frame-sdk';

// Farcaster SDK Actions Utility
export class FarcasterSDK {
  /**
   * Hides the splash screen and indicates the mini app is ready
   */
  static ready() {
    sdk.actions.ready();
  }

  /**
   * Prompts the user to add the mini app to their collection
   */
  static addMiniApp() {
    sdk.actions.addMiniApp();
  }

  /**
   * Closes the mini app
   */
  static close() {
    sdk.actions.close();
  }

  /**
   * Prompts the user to compose a cast
   * @param options - Cast composition options
   */
  static composeCast(options?: {
    text?: string;
    embeds?: string[];
    parentCastId?: {
      fid: number;
      hash: string;
    };
  }) {
    sdk.actions.composeCast(options);
  }

  /**
   * Opens an external URL
   * @param url - The URL to open
   */
  static openUrl(url: string) {
    sdk.actions.openUrl(url);
  }

  /**
   * Opens another mini app
   * @param miniAppId - The ID of the mini app to open
   */
  static openMiniApp(miniAppId: string) {
    sdk.actions.openMiniApp(miniAppId);
  }

  /**
   * Prompts the user to sign in with Farcaster
   */
  static signIn() {
    sdk.actions.signIn();
  }

  /**
   * Views a Farcaster profile
   * @param fid - The Farcaster ID of the profile to view
   */
  static viewProfile(fid: number) {
    sdk.actions.viewProfile(fid);
  }

  /**
   * Views a specific cast
   * @param castId - The cast identifier
   */
  static viewCast(castId: {
    fid: number;
    hash: string;
  }) {
    sdk.actions.viewCast(castId);
  }
}

// Export individual functions for convenience
export const {
  ready,
  addMiniApp,
  close,
  composeCast,
  openUrl,
  openMiniApp,
  signIn,
  viewProfile,
  viewCast
} = FarcasterSDK;

// Types for better TypeScript support
export interface CastComposition {
  text?: string;
  embeds?: string[];
  parentCastId?: {
    fid: number;
    hash: string;
  };
}

export interface CastId {
  fid: number;
  hash: string;
}