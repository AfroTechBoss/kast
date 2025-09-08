// Shared types for Neynar authentication

export interface AuthUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  custodyAddress: string;
  verifications: string[];
}

export interface AuthSession {
  user: AuthUser;
  timestamp: number;
}

// Global type declaration for auth sessions
declare global {
  var authSessions: Map<string, AuthSession> | undefined;
}

export {};