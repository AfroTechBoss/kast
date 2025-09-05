// Global type declarations

interface AuthSession {
  user: {
    fid: number
    username: string
    displayName: string
    pfpUrl: string
    custodyAddress?: string
    verifications?: string[]
  }
  timestamp: number
}

declare global {
  var authSessions: Map<string, AuthSession> | undefined
}

ex