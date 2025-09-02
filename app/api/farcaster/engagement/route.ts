import { NextRequest, NextResponse } from 'next/server';
import { hubClient } from '@/lib/farcaster/hub-client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { castHash, fid, campaignId } = await req.json();

    if (!castHash || !fid) {
      return NextResponse.json(
        { error: 'Cast hash and FID are required' },
        { status: 400 }
      );
    }

    // Process the cast for engagement scoring
    const castEngagement = await hubClient.processCastForEngagement(
      castHash,
      fid,
      campaignId
    );

    return NextResponse.json({
      success: true,
      castEngagement: {
        castHash: castEngagement.castHash,
        fid: castEngagement.fid,
        text: castEngagement.text,
        likes: castEngagement.likes,
        recasts: castEngagement.recasts,
        replies: castEngagement.replies,
        engagementScore: castEngagement.engagementScore,
        createdAt: castEngagement.createdAt,
      },
    });
  } catch (error) {
    console.error('Error processing cast engagement:', error);
    return NextResponse.json(
      { error: 'Failed to process cast engagement' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const limit = parseInt(searchParams.get('limit') || '50');
    const campaignId = searchParams.get('campaignId');

    let whereClause: any = {
      createdAt: {
        gte: new Date(Date.now() - hours * 60 * 60 * 1000),
      },
    };

    if (campaignId) {
      whereClause.campaignId = campaignId;
    }

    // Get trending casts
    const trendingCasts = await prisma.castEngagement.findMany({
      where: whereClause,
      orderBy: {
        engagementScore: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
            farcasterFid: true,
          },
        },
      },
    });

    // Calculate engagement statistics
    const stats = await prisma.castEngagement.aggregate({
      where: whereClause,
      _avg: {
        engagementScore: true,
        likes: true,
        recasts: true,
        replies: true,
      },
      _sum: {
        engagementScore: true,
        likes: true,
        recasts: true,
        replies: true,
      },
      _count: {
        castHash: true,
      },
    });

    return NextResponse.json({
      trendingCasts,
      statistics: {
        totalCasts: stats._count.castHash,
        totalEngagementScore: stats._sum.engagementScore || 0,
        averageEngagementScore: stats._avg.engagementScore || 0,
        totalLikes: stats._sum.likes || 0,
        totalRecasts: stats._sum.recasts || 0,
        totalReplies: stats._sum.replies || 0,
        averageLikes: stats._avg.likes || 0,
        averageRecasts: stats._avg.recasts || 0,
        averageReplies: stats._avg.replies || 0,
      },
      timeframe: `${hours} hours`,
    });
  } catch (error) {
    console.error('Error fetching engagement data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement data' },
      { status: 500 }
    );
  }
}