import { hubClient } from '@/lib/farcaster/hub-client';
import { PrismaClient } from '@prisma/client';
import * as cron from 'node-cron';

interface WorkerConfig {
  batchSize: number;
  intervalMinutes: number;
  maxRetries: number;
  retryDelayMs: number;
}

class EngagementWorker {
  private prisma: PrismaClient;
  private isRunning: boolean = false;
  private config: WorkerConfig;
  private cronJob?: cron.ScheduledTask;

  constructor(config: Partial<WorkerConfig> = {}) {
    this.prisma = new PrismaClient();
    this.config = {
      batchSize: 100,
      intervalMinutes: 5,
      maxRetries: 3,
      retryDelayMs: 5000,
      ...config,
    };
  }

  /**
   * Start the engagement worker
   */
  start(): void {
    if (this.isRunning) {
      console.log('Engagement worker is already running');
      return;
    }

    console.log(`Starting engagement worker with ${this.config.intervalMinutes}min intervals`);
    
    // Schedule the worker to run every N minutes
    this.cronJob = cron.schedule(`*/${this.config.intervalMinutes} * * * *`, async () => {
      await this.processEngagementBatch();
    });

    this.isRunning = true;
    
    // Run initial batch immediately
    this.processEngagementBatch().catch(console.error);
  }

  /**
   * Stop the engagement worker
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Engagement worker is not running');
      return;
    }

    console.log('Stopping engagement worker');
    
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = undefined;
    }

    this.isRunning = false;
  }

  /**
   * Process a batch of engagement data
   */
  private async processEngagementBatch(): Promise<void> {
    try {
      console.log('Processing engagement batch...');
      
      // Get active campaign participants
      const participants = await this.getActiveCampaignParticipants();
      
      if (participants.length === 0) {
        console.log('No active campaign participants found');
        return;
      }

      console.log(`Processing ${participants.length} participants`);

      // Process participants in batches
      for (let i = 0; i < participants.length; i += this.config.batchSize) {
        const batch = participants.slice(i, i + this.config.batchSize);
        await this.processBatch(batch);
        
        // Small delay between batches to avoid rate limiting
        if (i + this.config.batchSize < participants.length) {
          await this.delay(1000);
        }
      }

      console.log('Engagement batch processing completed');
    } catch (error) {
      console.error('Error processing engagement batch:', error);
    }
  }

  /**
   * Get active campaign participants
   */
  private async getActiveCampaignParticipants() {
    return await this.prisma.campaignParticipant.findMany({
      where: {
        campaign: {
          status: 'ACTIVE',
          endDate: {
            gt: new Date(),
          },
        },
      },
      include: {
        user: true,
        campaign: true,
      },
      orderBy: {
        lastEngagementSync: 'asc',
      },
    });
  }

  /**
   * Process a batch of participants
   */
  private async processBatch(participants: any[]): Promise<void> {
    const promises = participants.map(participant => 
      this.processParticipant(participant)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Process individual participant engagement
   */
  private async processParticipant(participant: any): Promise<void> {
    try {
      const { user, campaign } = participant;
      
      if (!user.farcasterFid) {
        console.log(`Skipping user ${user.id} - no Farcaster FID`);
        return;
      }

      // Get recent casts from the user
      const casts = await this.getCastsWithRetry(parseInt(user.farcasterFid));
      
      if (casts.length === 0) {
        console.log(`No new casts found for FID ${user.farcasterFid}`);
        return;
      }

      // Process and score casts
      let totalEngagementScore = 0;
      const processedCasts = [];

      for (const cast of casts) {
        try {
          // Check if cast is related to campaign
          const isRelevant = this.isCastRelevantToCampaign(cast, campaign);
          
          if (isRelevant) {
            const score = await hubClient.calculateEngagementScore(cast);
            totalEngagementScore += score;
            
            // Store cast data
            await this.storeCastData(cast, user.id, campaign.id, score);
            processedCasts.push({ castHash: cast.hash, score });
          }
        } catch (error) {
          console.error(`Error processing cast ${cast.hash}:`, error);
        }
      }

      // Update participant engagement
      if (totalEngagementScore > 0) {
        await this.updateParticipantEngagement(
          participant.id,
          totalEngagementScore,
          processedCasts.length
        );
        
        console.log(
          `Updated engagement for FID ${user.farcasterFid}: +${totalEngagementScore} points from ${processedCasts.length} casts`
        );
      }

      // Update sync timestamp
      await this.prisma.campaignParticipant.update({
        where: { id: participant.id },
        data: { lastEngagementSync: new Date() },
      });

    } catch (error) {
      console.error(`Error processing participant ${participant.id}:`, error);
    }
  }

  /**
   * Get casts with retry logic
   */
  private async getCastsWithRetry(fid: number, retries = 0): Promise<any[]> {
    try {
      return await hubClient.getUserCasts(fid, undefined, 50);
    } catch (error) {
      if (retries < this.config.maxRetries) {
        console.log(`Retrying getCasts for FID ${fid} (attempt ${retries + 1})`);
        await this.delay(this.config.retryDelayMs * (retries + 1));
        return this.getCastsWithRetry(fid, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Check if cast is relevant to campaign
   */
  private isCastRelevantToCampaign(cast: any, campaign: any): boolean {
    const text = cast.text?.toLowerCase() || '';
    const campaignKeywords = [
      campaign.title?.toLowerCase(),
      campaign.description?.toLowerCase(),
      ...((campaign.hashtags as string[]) || []).map(tag => tag.toLowerCase()),
    ].filter(Boolean);

    // Check for campaign-related keywords
    return campaignKeywords.some(keyword => 
      keyword && text.includes(keyword)
    );
  }

  /**
   * Store cast data in database
   */
  private async storeCastData(
    cast: any,
    userId: string,
    campaignId: string,
    engagementScore: number
  ): Promise<void> {
    try {
      await this.prisma.castEngagement.upsert({
        where: {
          castHash: cast.hash,
        },
        update: {
          engagementScore,
          likeCount: cast.reactions?.likes || 0,
          recastCount: cast.reactions?.recasts || 0,
          replyCount: cast.reactions?.replies || 0,
          updatedAt: new Date(),
        },
        create: {
          castHash: cast.hash,
          userId,
          campaignId,
          farcasterFid: cast.fid.toString(),
          text: cast.text || '',
          engagementScore,
          likeCount: cast.reactions?.likes || 0,
          recastCount: cast.reactions?.recasts || 0,
          replyCount: cast.reactions?.replies || 0,
          timestamp: new Date(cast.timestamp),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Error storing cast data for ${cast.hash}:`, error);
    }
  }

  /**
   * Update participant engagement metrics
   */
  private async updateParticipantEngagement(
    participantId: string,
    additionalScore: number,
    newCastsCount: number
  ): Promise<void> {
    await this.prisma.campaignParticipant.update({
      where: { id: participantId },
      data: {
        engagementScore: {
          increment: additionalScore,
        },
        totalCasts: {
          increment: newCastsCount,
        },
        lastEngagementUpdate: new Date(),
      },
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get worker status
   */
  getStatus(): { isRunning: boolean; config: WorkerConfig } {
    return {
      isRunning: this.isRunning,
      config: this.config,
    };
  }

  /**
   * Manual trigger for processing
   */
  async triggerManualProcess(): Promise<void> {
    if (this.isRunning) {
      console.log('Manual engagement processing triggered');
      await this.processEngagementBatch();
    } else {
      throw new Error('Worker is not running');
    }
  }
}

// Export singleton instance
export const engagementWorker = new EngagementWorker();

// Export class for custom instances
export { EngagementWorker };