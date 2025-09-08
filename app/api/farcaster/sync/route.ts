import { NextRequest, NextResponse } from 'next/server';
import { hubClient } from '@/lib/farcaster/hub-client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { fid, campaignId } = await req.json();

    if (!fid) {
      return NextResponse.json(
        { error: 'FID is required' },
        { status: 400 }
      );
    }

    // Sync user data from Farcaster
    const user = await hubClient.syncUserData(fid);

    // Get recent casts for engagement processing
    const casts = await hubClient.getUserCasts();
    
    let processedCasts = 0;
    const engagementPromises = [];

    for (const cast of casts) {
      if (cast.castHash) {
        const castHash = cast.castHash;
        
        // Process cast for engagement (async)
        const promise = hubClient.processCastForEngagement(
          castHash,
          fid,
          campaignId
        ).catch(error => {
          console.error(`Error processing cast ${castHash}:`, error);
          return null;
        });
        
        engagementPromises.push(promise);
        processedCasts++;
      }
    }

    // Wait for all cast processing to complete
    const results = await Promise.allSettled(engagementPromises);
    const successfulProcessing = results.filter(r => r.status === 'fulfilled').length;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        farcasterFid: user.farcasterFid,
        engagementScore: user.engagementScore,
      },
      processing: {
        totalCasts: processedCasts,
        successfullyProcessed: successfulProcessing,
      },
    });
  } catch (error) {
    console.error('Error syncing Farcaster data:', error);
    return NextResponse.json(
      { error: 'Failed to sync Farcaster data' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json(
        { error: 'FID parameter is required' },
        { status: 400 }
      );
    }

    // Get user profile from Farcaster
    const profile = await hubClient.getUserProfile(parseInt(fid));
    
    // Check if user exists in our database
    const user = await prisma.user.findFirst({
      where: {
        farcasterFid: fid,
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

    return NextResponse.json({
      profile,
      user,
      synced: !!user,
    });
  } catch (error) {
    console.error('Error fetching Farcaster profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}