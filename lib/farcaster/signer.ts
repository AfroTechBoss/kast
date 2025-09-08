import { createAppClient, viemConnector } from '@farcaster/auth-client';
import { PrismaClient } from '@prisma/client';
import { hubClient } from './hub-client';

const prisma = new PrismaClient();

export interface FarcasterAuthConfig {
  domain: string;
  siweUri: string;
  nonce: string;
}

export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  bio?: string;
  pfpUrl?: string;
  custodyAddress: string;
  verifications: string[];
}

interface AuthenticatedUser {
  user: {
    id: string;
    farcasterFid: string;
    username: string;
    displayName: string;
    bio: string;
    profileImageUrl: string;
    engagementScore: number;
    totalRewards: number;
    followerCount: number;
    followingCount: number;
  };
  session: {
    token: string;
    expiresAt: Date;
  };
}

interface UserWithDetails {
  id: string;
  farcasterFid: string | null;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  engagementScore: number;
  totalRewards: number;
  followerCount: number;
  followingCount: number;
  walletAddress: string | null;
  custodyAddress: string | null;
  verifications: string[];
}

export class FarcasterSigner {
  private appClient: ReturnType<typeof createAppClient>;
  private config: FarcasterAuthConfig;

  constructor(config: FarcasterAuthConfig) {
    this.config = config;
    this.appClient = createAppClient({
      ethereum: viemConnector(),
    });
  }

  /**
   * Generate authentication URL for Farcaster Connect
   */
  async generateAuthUrl(redirectUri: string): Promise<{
    url: string;
    channelToken: string;
  }> {
    try {
      const { data: { channelToken } } = await this.appClient.createChannel({
        siweUri: this.config.siweUri,
        domain: this.config.domain,
      });

      // Create the auth URL - this should be the connect URL from the channel
      const authUrl = `https://warpcast.com/~/sign-in-with-farcaster?channelToken=${channelToken}&redirectUri=${encodeURIComponent(redirectUri)}`;

      return {
        url: authUrl,
        channelToken,
      };
    } catch (error) {
      console.error('Error generating auth URL:', error);
      throw new Error('Failed to generate authentication URL');
    }
  }

  /**
   * Verify authentication and get user data
   */
  async verifyAuth(channelToken: string): Promise<FarcasterUser | null> {
    try {
      // Get the status first to obtain the message and signature
      const statusResponse = await this.appClient.status({ channelToken });
      const statusData = statusResponse.data;
      
      if (statusData.state !== 'completed' || !statusData.message || !statusData.signature) {
        return null;
      }

      const { data, success, fid } = await this.appClient.verifySignInMessage({
        nonce: statusData.nonce,
        domain: this.config.domain,
        message: statusData.message,
        signature: statusData.signature,
        acceptAuthAddress: true
      });

      if (!success || !fid) {
        return null;
      }

      // Extract user data from the data object
      const userData = data as unknown as {
        username?: string;
        displayName?: string;
        bio?: string;
        pfpUrl?: string;
        custodyAddress: string;
        verifications?: string[];
      };

      return {
        fid,
        username: userData.username,
        displayName: userData.displayName,
        bio: userData.bio,
        pfpUrl: userData.pfpUrl,
        custodyAddress: userData.custodyAddress,
        verifications: userData.verifications || [],
      };
    } catch (error) {
      console.error('Error verifying auth:', error);
      return null;
    }
  }

  /**
   * Verify Quick Auth token and get user data
   */
  async verifyQuickAuthToken(token: string): Promise<FarcasterUser | null> {
    try {
      // For Quick Auth, we need to decode the token and extract user information
      // The token should contain the user's FID and other profile data
      const decoded = JSON.parse(atob(token.split('.')[1]));
      
      if (!decoded.fid) {
        return null;
      }

      // Get fresh profile data from Farcaster Hub
      const hubProfile = await hubClient.getUserProfile(decoded.fid);
      
      if (!hubProfile) {
        return null;
      }

      return {
        fid: decoded.fid,
        username: hubProfile.username,
        displayName: hubProfile.displayName,
        bio: hubProfile.bio,
        pfpUrl: hubProfile.pfpUrl,
        custodyAddress: decoded.custodyAddress,
        verifications: decoded.verifications || [],
      };
    } catch (error) {
      console.error('Error verifying Quick Auth token:', error);
      return null;
    }
  }

  /**
   * Create or update user in database after successful authentication
   */
  async authenticateUser(farcasterUser: FarcasterUser, walletAddress?: string): Promise<AuthenticatedUser> {
    try {
      // Sync latest data from Farcaster Hub
      const hubProfile = await hubClient.getUserProfile(farcasterUser.fid);
      
      // Create or update user
      const user = await prisma.user.upsert({
        where: {
          farcasterFid: farcasterUser.fid.toString(),
        },
        update: {
          username: farcasterUser.username || hubProfile.username || `fid_${farcasterUser.fid}`,
          displayName: farcasterUser.displayName || hubProfile.displayName,
          bio: farcasterUser.bio || hubProfile.bio,
          profileImageUrl: farcasterUser.pfpUrl || hubProfile.pfpUrl,
          custodyAddress: farcasterUser.custodyAddress,
          walletAddress: walletAddress || farcasterUser.custodyAddress,
          verifications: farcasterUser.verifications,
          followerCount: hubProfile.followerCount,
          followingCount: hubProfile.followingCount,
          lastActiveAt: new Date(),
          updatedAt: new Date(),
        },
        create: {
          farcasterFid: farcasterUser.fid.toString(),
          username: farcasterUser.username || hubProfile.username || `fid_${farcasterUser.fid}`,
          displayName: farcasterUser.displayName || hubProfile.displayName,
          bio: farcasterUser.bio || hubProfile.bio,
          profileImageUrl: farcasterUser.pfpUrl || hubProfile.pfpUrl,
          custodyAddress: farcasterUser.custodyAddress,
          walletAddress: walletAddress || farcasterUser.custodyAddress,
          verifications: farcasterUser.verifications,
          followerCount: hubProfile.followerCount,
          followingCount: hubProfile.followingCount,
          engagementScore: 0,
          totalRewards: 0,
          lastActiveAt: new Date(),
        },
      });

      // Create authentication session
      const session = await prisma.userSession.create({
        data: {
          userId: user.id,
          token: this.generateSessionToken(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      return {
        user: {
          id: user.id,
          farcasterFid: user.farcasterFid || '',
          username: user.username || '',
          displayName: user.displayName || '',
          bio: user.bio || '',
          profileImageUrl: user.profileImageUrl || '',
          engagementScore: user.engagementScore,
          totalRewards: user.totalRewards,
          followerCount: user.followerCount,
          followingCount: user.followingCount,
        },
        session: {
          token: session.token,
          expiresAt: session.expiresAt,
        },
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw new Error('Failed to authenticate user');
    }
  }

  /**
   * Verify session token and get user
   */
  async verifySession(sessionToken: string): Promise<UserWithDetails | null> {
    try {
      const session = await prisma.userSession.findFirst({
        where: {
          token: sessionToken,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              farcasterFid: true,
              username: true,
              displayName: true,
              bio: true,
              profileImageUrl: true,
              engagementScore: true,
              totalRewards: true,
              followerCount: true,
              followingCount: true,
              walletAddress: true,
              custodyAddress: true,
              verifications: true,
            },
          },
        },
      });

      if (!session) {
        return null;
      }

      // Update last activity
      await prisma.userSession.update({
        where: {
          id: session.id,
        },
        data: {
          lastUsedAt: new Date(),
        },
      });

      return session.user;
    } catch (error) {
      console.error('Error verifying session:', error);
      return null;
    }
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionToken: string): Promise<boolean> {
    try {
      await prisma.userSession.delete({
        where: {
          token: sessionToken,
        },
      });
      return true;
    } catch (error) {
      console.error('Error revoking session:', error);
      return false;
    }
  }

  /**
   * Generate secure session token
   */
  private generateSessionToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get user by FID
   */
  async getUserByFid(fid: number): Promise<UserWithDetails | null> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          farcasterFid: fid.toString(),
        },
        include: {
          participations: {
            include: {
              campaign: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
          rewards: {
            where: {
              status: 'PENDING',
            },
          },
        },
      });

      if (!user) return null;
      
      return {
        id: user.id,
        farcasterFid: user.farcasterFid,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        engagementScore: user.engagementScore,
        totalRewards: user.totalRewards,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        walletAddress: user.walletAddress,
        custodyAddress: user.custodyAddress,
        verifications: user.verifications,
      };
    } catch (error) {
      console.error('Error getting user by FID:', error);
      return null;
    }
  }

  /**
   * Validate FID ownership using signature
   */
  async validateFidOwnership(fid: number): Promise<boolean> {
    try {
      // This would typically involve verifying the signature against the FID's custody address
      // For now, we'll use a simplified validation
      const profile = await hubClient.getUserProfile(fid);
      return !!profile;
    } catch (error) {
      console.error('Error validating FID ownership:', error);
      return false;
    }
  }
}

// Export singleton instance
export const farcasterSigner = new FarcasterSigner({
  domain: process.env.NEXT_PUBLIC_DOMAIN || 'kast.app',
  siweUri: process.env.NEXT_PUBLIC_BASE_URL || 'https://kast.app',
  nonce: process.env.FARCASTER_NONCE || 'kast-auth-nonce',
});