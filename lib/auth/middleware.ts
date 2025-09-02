import { NextRequest, NextResponse } from 'next/server';
import { farcasterSigner } from '@/lib/farcaster/signer';

export interface AuthenticatedUser {
  id: string;
  farcasterFid: string;
  username: string;
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
  engagementScore: number;
  totalRewards: number;
  followerCount: number;
  followingCount: number;
  walletAddress?: string;
  custodyAddress: string;
  verifications: string[];
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser;
}

/**
 * Middleware to verify authentication for API routes
 */
export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: { required?: boolean } = { required: true }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Get session token from cookie or Authorization header
      const sessionToken = 
        req.cookies.get('session_token')?.value ||
        req.headers.get('Authorization')?.replace('Bearer ', '');

      if (!sessionToken) {
        if (options.required) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
        return handler(req as AuthenticatedRequest);
      }

      // Verify session
      const user = await farcasterSigner.verifySession(sessionToken);
      
      if (!user) {
        if (options.required) {
          return NextResponse.json(
            { error: 'Invalid or expired session' },
            { status: 401 }
          );
        }
        return handler(req as AuthenticatedRequest);
      }

      // Add user to request
      (req as AuthenticatedRequest).user = user;
      
      return handler(req as AuthenticatedRequest);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to verify FID ownership for specific operations
 */
export async function withFidVerification(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  getFidFromRequest: (req: NextRequest) => number | null
) {
  return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      const requestedFid = getFidFromRequest(req);
      
      if (!requestedFid) {
        return NextResponse.json(
          { error: 'FID is required' },
          { status: 400 }
        );
      }

      // Check if user owns the requested FID
      if (req.user && parseInt(req.user.farcasterFid) !== requestedFid) {
        return NextResponse.json(
          { error: 'Access denied: FID ownership required' },
          { status: 403 }
        );
      }

      return handler(req);
    } catch (error) {
      console.error('FID verification error:', error);
      return NextResponse.json(
        { error: 'FID verification failed' },
        { status: 500 }
      );
    }
  });
}

/**
 * Middleware to check campaign participation
 */
export async function withCampaignAccess(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  getCampaignIdFromRequest: (req: NextRequest) => string | null
) {
  return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      const campaignId = getCampaignIdFromRequest(req);
      
      if (!campaignId) {
        return NextResponse.json(
          { error: 'Campaign ID is required' },
          { status: 400 }
        );
      }

      if (!req.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check if user is participating in the campaign
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const participation = await prisma.campaignParticipant.findFirst({
        where: {
          campaignId,
          userId: req.user.id,
        },
      });

      if (!participation) {
        return NextResponse.json(
          { error: 'Campaign participation required' },
          { status: 403 }
        );
      }

      return handler(req);
    } catch (error) {
      console.error('Campaign access verification error:', error);
      return NextResponse.json(
        { error: 'Campaign access verification failed' },
        { status: 500 }
      );
    }
  });
}

/**
 * Utility function to extract user from request in API routes
 */
export function getAuthenticatedUser(req: AuthenticatedRequest): AuthenticatedUser | null {
  return req.user || null;
}

/**
 * Utility function to require authentication in API routes
 */
export function requireAuth(req: AuthenticatedRequest): AuthenticatedUser {
  if (!req.user) {
    throw new Error('Authentication required');
  }
  return req.user;
}

/**
 * Rate limiting middleware for authenticated users
 */
export async function withRateLimit(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (req: AuthenticatedRequest) => string;
  }
) {
  const { maxRequests, windowMs, keyGenerator } = options;
  const requests = new Map<string, { count: number; resetTime: number }>();

  return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      const key = keyGenerator ? keyGenerator(req) : req.user?.id || req.ip || 'anonymous';
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean up old entries
      Array.from(requests.entries()).forEach(([k, v]) => {
        if (v.resetTime < now) {
          requests.delete(k);
        }
      });

      // Get or create rate limit entry
      let rateLimitEntry = requests.get(key);
      if (!rateLimitEntry || rateLimitEntry.resetTime < windowStart) {
        rateLimitEntry = { count: 0, resetTime: now + windowMs };
        requests.set(key, rateLimitEntry);
      }

      // Check rate limit
      if (rateLimitEntry.count >= maxRequests) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((rateLimitEntry.resetTime - now) / 1000),
          },
          { status: 429 }
        );
      }

      // Increment counter
      rateLimitEntry.count++;

      return handler(req);
    } catch (error) {
      console.error('Rate limiting error:', error);
      return NextResponse.json(
        { error: 'Rate limiting error' },
        { status: 500 }
      );
    }
  });
}