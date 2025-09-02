import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FarcasterProfile {
  fid: number;
  username?: string;
  displayName?: string;
  bio?: string;
  pfpUrl?: string;
  followerCount?: number;
  followingCount?: number;
}

export class FarcasterHubClient {
  private hubUrl: string;

  constructor() {
    this.hubUrl = process.env.FARCASTER_HUB_URL || 'https://nemes.farcaster.xyz:2281';
  }

  /**
   * Get user profile by FID (simplified implementation)
   */
  async getUserProfile(fid: number): Promise<FarcasterProfile> {
    try {
      // For now, return a basic profile structure
      // In a real implementation, this would fetch from Farcaster Hub
      const profile: FarcasterProfile = {
        fid,
        username: `user${fid}`,
        displayName: `User ${fid}`,
        bio: 'Farcaster user',
        pfpUrl: undefined,
        followerCount: 0,
        followingCount: 0
      };

      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get casts by FID with pagination (simplified implementation)
   */
  async getUserCasts(fid: number, pageToken?: string, limit: number = 100): Promise<any[]> {
    try {
      // For now, return empty array
      // In a real implementation, this would fetch from Farcaster Hub
      return [];
    } catch (error) {
      console.error('Error fetching user casts:', error);
      throw error;
    }
  }

  /**
   * Get cast reactions (likes, recasts, replies) - simplified implementation
   */
  async getCastReactions(castHash: string) {
    try {
      // For now, return mock data
      // In a real implementation, this would fetch from Farcaster Hub
      return { likes: 0, recasts: 0, replies: 0 };
    } catch (error) {
      console.error('Error fetching cast reactions:', error);
      throw error;
    }
  }

  /**
   * Calculate engagement score based on cast metrics
   */
  calculateEngagementScore(metrics: {
    likes: number;
    recasts: number;
    replies: number;
    followerCount: number;
  }): number {
    const { likes, recasts, replies, followerCount } = metrics;
    
    // Weighted scoring system
    const likeWeight = 1;
    const recastWeight = 3;
    const replyWeight = 5;
    const followerMultiplier = Math.log10(Math.max(followerCount, 1)) / 10;
    
    const baseScore = (likes * likeWeight) + (recasts * recastWeight) + (replies * replyWeight);
    const adjustedScore = baseScore * (1 + followerMultiplier);
    
    return Math.round(adjustedScore * 100) / 100;
  }

  /**
   * Get cast by hash - simplified implementation
   */
  async getCast(hash: string) {
    try {
      // For now, return mock data
      // In a real implementation, this would fetch from Farcaster Hub
      return {
        data: {
          castAddBody: {
            text: 'Mock cast content',
            mentions: [],
            mentionsPositions: []
          },
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Error fetching cast:', error);
      throw error;
    }
  }

  /**
   * Process and store cast data for engagement tracking
   */
  async processCastForEngagement(castHash: string, fid: number, campaignId?: string) {
    try {
      // Get cast details
      const cast = await this.getCast(castHash);
      const castData = cast.data?.castAddBody;
      
      if (!castData) {
        throw new Error('Invalid cast data');
      }

      // Get reactions
      const reactions = await this.getCastReactions(castHash);
      
      // Get user profile for follower count
      const profile = await this.getUserProfile(fid);
      
      // Calculate engagement score
      const engagementScore = this.calculateEngagementScore({
        likes: reactions.likes,
        recasts: reactions.recasts,
        replies: reactions.replies,
        followerCount: profile.followerCount || 0,
      });

      // Get or create user first
      let user = await prisma.user.findFirst({
        where: {
          farcasterFid: fid.toString(),
        },
      });

      if (!user) {
        // Create user if doesn't exist
        user = await this.syncUserData(fid);
      }

      // Store or update cast engagement data
      const castEngagement = await prisma.castEngagement.upsert({
        where: {
          castHash,
        },
        update: {
          likeCount: reactions.likes,
          recastCount: reactions.recasts,
          replyCount: reactions.replies,
          engagementScore,
          updatedAt: new Date(),
        },
        create: {
          castHash,
          farcasterFid: fid.toString(),
          text: castData.text,
          likeCount: reactions.likes,
          recastCount: reactions.recasts,
          replyCount: reactions.replies,
          engagementScore,
          userId: user.id,
          campaignId: campaignId || '',
          timestamp: new Date(cast.data?.timestamp || Date.now()),
        },
      });

      // Update user engagement score
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          engagementScore: {
            increment: engagementScore,
          },
        },
      });

      // Update campaign participation if applicable
      if (campaignId) {
        await prisma.campaignParticipant.updateMany({
          where: {
            userId: user.id,
            campaignId,
          },
          data: {
            engagementScore: {
              increment: engagementScore,
            },
          },
        });
      }

      return castEngagement;
    } catch (error) {
      console.error('Error processing cast for engagement:', error);
      throw error;
    }
  }

  /**
   * Sync user data from Farcaster to local database
   */
  async syncUserData(fid: number) {
    try {
      const profile = await this.getUserProfile(fid);
      
      const user = await prisma.user.upsert({
        where: {
          farcasterFid: fid.toString(),
        },
        update: {
          username: profile.username || `fid_${fid}`,
          displayName: profile.displayName,
          bio: profile.bio,
          profileImageUrl: profile.pfpUrl,
          followerCount: profile.followerCount,
          followingCount: profile.followingCount,
          updatedAt: new Date(),
        },
        create: {
          farcasterFid: fid.toString(),
          username: profile.username || `fid_${fid}`,
          displayName: profile.displayName,
          bio: profile.bio,
          profileImageUrl: profile.pfpUrl,
          followerCount: profile.followerCount,
          followingCount: profile.followingCount,
          engagementScore: 0,
          totalRewards: 0,
        },
      });

      return user;
    } catch (error) {
      console.error('Error syncing user data:', error);
      throw error;
    }
  }

  /**
   * Get trending casts for a specific timeframe
   */
  async getTrendingCasts(hours: number = 24, limit: number = 50) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const trendingCasts = await prisma.castEngagement.findMany({
        where: {
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          engagementScore: 'desc',
        },
        take: limit,
        include: {
          user: {
            select: {
              username: true,
              displayName: true,
              profileImageUrl: true,
            },
          },
        },
      });

      return trendingCasts;
    } catch (error) {
      console.error('Error fetching trending casts:', error);
      throw error;
    }
  }
}

export const hubClient = new FarcasterHubClient();