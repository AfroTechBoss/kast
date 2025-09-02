import { PrismaClient } from '@prisma/client';
import { hubClient } from '@/lib/farcaster/hub-client';

interface ModerationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action: 'WARNING' | 'HIDE_CONTENT' | 'SUSPEND_USER' | 'BAN_USER' | 'REMOVE_FROM_CAMPAIGN';
  check: (content: any, user: any) => Promise<boolean>;
}

interface ModerationResult {
  flagged: boolean;
  rules: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action: 'WARNING' | 'HIDE_CONTENT' | 'SUSPEND_USER' | 'BAN_USER' | 'REMOVE_FROM_CAMPAIGN';
  reason: string;
}

class ContentModerator {
  private prisma: PrismaClient;
  private rules: ModerationRule[] = [];
  private spamKeywords: Set<string>;
  private bannedDomains: Set<string>;

  constructor() {
    this.prisma = new PrismaClient();
    this.spamKeywords = new Set([
      'crypto scam', 'free money', 'guaranteed profit', 'pump and dump',
      'rug pull', 'ponzi', 'pyramid scheme', 'get rich quick',
      'investment opportunity', 'double your money', 'risk free',
    ]);
    this.bannedDomains = new Set([
      'scam-site.com', 'fake-crypto.net', 'phishing-site.org'
    ]);
    this.initializeRules();
  }

  private initializeRules(): void {
    this.rules = [
      {
        id: 'spam_detection',
        name: 'Spam Detection',
        description: 'Detects spam content and repetitive messages',
        enabled: true,
        severity: 'MEDIUM',
        action: 'HIDE_CONTENT',
        check: this.checkSpamContent.bind(this),
      },
      {
        id: 'scam_detection',
        name: 'Scam Detection',
        description: 'Detects potential scam content',
        enabled: true,
        severity: 'HIGH',
        action: 'HIDE_CONTENT',
        check: this.checkScamContent.bind(this),
      },
      {
        id: 'profile_verification',
        name: 'Profile Verification',
        description: 'Checks user profile authenticity',
        enabled: true,
        severity: 'LOW',
        action: 'WARNING',
        check: this.checkProfileVerification.bind(this),
      },
      {
        id: 'engagement_manipulation',
        name: 'Engagement Manipulation',
        description: 'Detects artificial engagement patterns',
        enabled: true,
        severity: 'HIGH',
        action: 'SUSPEND_USER',
        check: this.checkEngagementManipulation.bind(this),
      },
      {
        id: 'malicious_links',
        name: 'Malicious Links',
        description: 'Detects potentially harmful links',
        enabled: true,
        severity: 'CRITICAL',
        action: 'HIDE_CONTENT',
        check: this.checkMaliciousLinks.bind(this),
      },
      {
        id: 'rate_limiting',
        name: 'Rate Limiting',
        description: 'Prevents excessive posting',
        enabled: true,
        severity: 'MEDIUM',
        action: 'WARNING',
        check: this.checkRateLimit.bind(this),
      },
    ];
  }

  /**
   * Moderate cast content
   */
  async moderateCast(cast: any, userId: string): Promise<ModerationResult> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          castEngagements: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const flaggedRules: string[] = [];
      let maxSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      let recommendedAction: 'WARNING' | 'HIDE_CONTENT' | 'SUSPEND_USER' | 'BAN_USER' | 'REMOVE_FROM_CAMPAIGN' = 'WARNING';

      // Run all enabled moderation rules
      for (const rule of this.rules) {
        if (!rule.enabled) continue;

        try {
          const violated = await rule.check(cast, user);
          if (violated) {
            flaggedRules.push(rule.id);
            
            // Update severity and action based on highest severity rule
            if (this.getSeverityLevel(rule.severity) > this.getSeverityLevel(maxSeverity)) {
              maxSeverity = rule.severity;
              recommendedAction = rule.action;
            }
          }
        } catch (error) {
          console.error(`Error running moderation rule ${rule.id}:`, error);
        }
      }

      const result: ModerationResult = {
        flagged: flaggedRules.length > 0,
        rules: flaggedRules,
        severity: maxSeverity,
        action: recommendedAction,
        reason: this.generateModerationReason(flaggedRules),
      };

      // Log moderation action if content is flagged
      if (result.flagged) {
        await this.logModerationAction({
          targetType: 'CAST',
          targetId: cast.hash,
          action: result.action,
          reason: result.reason,
          severity: result.severity,
        });
      }

      return result;
    } catch (error) {
      console.error('Error moderating cast:', error);
      return {
        flagged: false,
        rules: [],
        severity: 'LOW',
        action: 'WARNING',
        reason: 'Moderation error',
      };
    }
  }

  /**
   * Moderate user profile
   */
  async moderateUser(userId: string): Promise<ModerationResult> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          castEngagements: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
          moderationActions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const flaggedRules: string[] = [];
      let maxSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      let recommendedAction: 'WARNING' | 'HIDE_CONTENT' | 'SUSPEND_USER' | 'BAN_USER' | 'REMOVE_FROM_CAMPAIGN' = 'WARNING';

      // Check user-specific rules
      const userRules = this.rules.filter(rule => 
        ['profile_verification', 'engagement_manipulation', 'rate_limiting'].includes(rule.id)
      );

      for (const rule of userRules) {
        if (!rule.enabled) continue;

        try {
          const violated = await rule.check(null, user);
          if (violated) {
            flaggedRules.push(rule.id);
            
            if (this.getSeverityLevel(rule.severity) > this.getSeverityLevel(maxSeverity)) {
              maxSeverity = rule.severity;
              recommendedAction = rule.action;
            }
          }
        } catch (error) {
          console.error(`Error running user moderation rule ${rule.id}:`, error);
        }
      }

      const result: ModerationResult = {
        flagged: flaggedRules.length > 0,
        rules: flaggedRules,
        severity: maxSeverity,
        action: recommendedAction,
        reason: this.generateModerationReason(flaggedRules),
      };

      if (result.flagged) {
        await this.logModerationAction({
          targetType: 'USER',
          targetId: userId,
          action: result.action,
          reason: result.reason,
          severity: result.severity,
        });
      }

      return result;
    } catch (error) {
      console.error('Error moderating user:', error);
      return {
        flagged: false,
        rules: [],
        severity: 'LOW',
        action: 'WARNING',
        reason: 'Moderation error',
      };
    }
  }

  /**
   * Check for spam content
   */
  private async checkSpamContent(cast: any, user: any): Promise<boolean> {
    if (!cast) return false;

    const text = cast.text?.toLowerCase() || '';
    
    // Check for spam keywords
    const spamKeywordsArray = Array.from(this.spamKeywords);
    for (let i = 0; i < spamKeywordsArray.length; i++) {
      if (text.includes(spamKeywordsArray[i])) {
        return true;
      }
    }

    // Check for excessive repetition
    const words = text.split(' ');
    const wordCount = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 3) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    }

    // Flag if any word appears more than 5 times
    const wordCounts = Array.from(wordCount.values());
    for (let i = 0; i < wordCounts.length; i++) {
      if (wordCounts[i] > 5) {
        return true;
      }
    }

    // Check for excessive emoji usage (simplified pattern for ES5 compatibility)
    const emojiPattern = /[\u1F600-\u1F64F\u1F300-\u1F5FF\u1F680-\u1F6FF\u1F1E0-\u1F1FF]/g;
    const emojiCount = (text.match(emojiPattern) || []).length;
    if (emojiCount > text.length * 0.3) {
      return true;
    }

    return false;
  }

  /**
   * Check for scam content
   */
  private async checkScamContent(cast: any, user: any): Promise<boolean> {
    if (!cast) return false;

    const text = cast.text?.toLowerCase() || '';
    
    // Check for scam patterns
    const scamPatterns = [
      /guaranteed.*profit/i,
      /risk.*free.*investment/i,
      /double.*your.*money/i,
      /get.*rich.*quick/i,
      /pump.*and.*dump/i,
      /rug.*pull/i,
    ];

    for (const pattern of scamPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check profile verification status
   */
  private async checkProfileVerification(cast: any, user: any): Promise<boolean> {
    if (!user.farcasterFid) return true;

    // Check if user has verified addresses
    if (!user.verifications || user.verifications.length === 0) {
      return true;
    }

    // Check if profile is too new (less than 7 days)
    const accountAge = Date.now() - new Date(user.createdAt).getTime();
    if (accountAge < 7 * 24 * 60 * 60 * 1000) {
      return true;
    }

    return false;
  }

  /**
   * Check for engagement manipulation
   */
  private async checkEngagementManipulation(cast: any, user: any): Promise<boolean> {
    // Check for suspicious engagement patterns
    const recentCasts = user.castEngagements || [];
    
    if (recentCasts.length < 5) return false;

    // Calculate average engagement score
    const avgScore = recentCasts.reduce((sum: number, cast: any) => sum + cast.engagementScore, 0) / recentCasts.length;
    
    // Flag if recent cast has unusually high engagement
    if (cast && cast.engagementScore > avgScore * 5) {
      return true;
    }

    // Check for rapid posting (more than 10 casts in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCastsCount = recentCasts.filter((c: any) => new Date(c.createdAt) > oneHourAgo).length;
    
    if (recentCastsCount > 10) {
      return true;
    }

    return false;
  }

  /**
   * Check for malicious links
   */
  private async checkMaliciousLinks(cast: any, user: any): Promise<boolean> {
    if (!cast) return false;

    const text = cast.text || '';
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const urls = text.match(urlRegex) || [];

    for (const url of urls) {
      try {
        const domain = new URL(url).hostname;
        if (this.bannedDomains.has(domain)) {
          return true;
        }

        // Check for suspicious URL patterns
        if (domain.includes('bit.ly') || domain.includes('tinyurl') || domain.includes('t.co')) {
          // Could implement URL expansion and further checking here
          return false; // For now, allow shortened URLs
        }
      } catch (error) {
        // Invalid URL format
        return true;
      }
    }

    return false;
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(cast: any, user: any): Promise<boolean> {
    const recentCasts = user.castEngagements || [];
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentCastsCount = recentCasts.filter((c: any) => new Date(c.createdAt) > fiveMinutesAgo).length;
    
    // Flag if more than 5 casts in 5 minutes
    return recentCastsCount > 5;
  }

  /**
   * Get severity level as number for comparison
   */
  private getSeverityLevel(severity: string): number {
    const levels = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
    return levels[severity as keyof typeof levels] || 1;
  }

  /**
   * Generate human-readable moderation reason
   */
  private generateModerationReason(flaggedRules: string[]): string {
    const ruleDescriptions = {
      'spam_detection': 'Spam or repetitive content detected',
      'scam_detection': 'Potential scam content detected',
      'profile_verification': 'Unverified or suspicious profile',
      'engagement_manipulation': 'Suspicious engagement patterns',
      'malicious_links': 'Potentially harmful links detected',
      'rate_limiting': 'Excessive posting rate',
    };

    const reasons = flaggedRules.map(rule => 
      ruleDescriptions[rule as keyof typeof ruleDescriptions] || rule
    );

    return reasons.join('; ');
  }

  /**
   * Log moderation action to database
   */
  private async logModerationAction(action: {
    targetType: 'CAST' | 'USER' | 'CAMPAIGN';
    targetId: string;
    action: string;
    reason: string;
    severity: string;
  }): Promise<void> {
    try {
      await this.prisma.moderationAction.create({
        data: {
          targetType: action.targetType,
          targetId: action.targetId,
          action: action.action as any,
          reason: action.reason,
          severity: action.severity as any,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error logging moderation action:', error);
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(timeframe: 'day' | 'week' | 'month' = 'day') {
    const timeframeDays = { day: 1, week: 7, month: 30 };
    const since = new Date(Date.now() - timeframeDays[timeframe] * 24 * 60 * 60 * 1000);

    const stats = await this.prisma.moderationAction.groupBy({
      by: ['action', 'severity'],
      where: {
        createdAt: {
          gte: since,
        },
      },
      _count: {
        id: true,
      },
    });

    return stats;
  }

  /**
   * Update moderation rules
   */
  updateRule(ruleId: string, updates: Partial<ModerationRule>): void {
    const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex !== -1) {
      this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
    }
  }

  /**
   * Get all moderation rules
   */
  getRules(): ModerationRule[] {
    return this.rules;
  }
}

// Export singleton instance
export const contentModerator = new ContentModerator();

// Export class for custom instances
export { ContentModerator, type ModerationResult, type ModerationRule };