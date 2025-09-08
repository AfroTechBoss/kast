import { FrameRequest, getFrameMessage, getFrameHtmlResponse } from '@/lib/frames/utils';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  let accountAddress: string | undefined = '';
  let buttonIndex = 1;

  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body);

  if (isValid) {
    accountAddress = message.interactor?.verified_accounts[0] || '';
    buttonIndex = message.button || 1;
  }

  const campaignId = params.id;

  // Fetch campaign details
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: campaignId,
    },
    include: {
      participants: {
        take: 10,
        orderBy: {
          engagementScore: 'desc',
        },
        include: {
          user: {
            select: {
              username: true,
              engagementScore: true,
            },
          },
        },
      },
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });

  if (!campaign) {
    return new Response(
      getFrameHtmlResponse({
        buttons: [
          {
            label: 'Back to Campaigns',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
          },
          {
            label: 'Back to Home',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames`,
          },
        ],
        image: {
          src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaign-not-found.png`,
          aspectRatio: '1.91:1',
        },
        postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
      }),
    );
  }

  // Check if user is already participating
  let userParticipation = null;
  if (accountAddress) {
    const user = await prisma.user.findFirst({
      where: {
        walletAddress: accountAddress,
      },
    });

    if (user) {
      userParticipation = await prisma.campaignParticipant.findFirst({
        where: {
          campaignId: campaign.id,
          userId: user.id,
        },
      });
    }
  }

  if (buttonIndex === 1 && !userParticipation && accountAddress) {
    // Join campaign
    try {
      let user = await prisma.user.findFirst({
        where: {
          walletAddress: accountAddress,
        },
      });

      if (!user) {
        // Create user if doesn't exist
        user = await prisma.user.create({
          data: {
            walletAddress: accountAddress,
            username: `user_${accountAddress.slice(-6)}`,
            engagementScore: 0,
            totalRewards: 0,
          },
        });
      }

      // Add user to campaign
      await prisma.campaignParticipant.create({
        data: {
          campaignId: campaign.id,
          userId: user.id,
          engagementScore: 0,
        },
      });

      return new Response(
        getFrameHtmlResponse({
          buttons: [
            {
              label: 'View My Progress',
              action: 'post',
              target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns/${campaign.id}/progress`,
            },
            {
              label: 'View Leaderboard',
              action: 'post',
              target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/leaderboard`,
            },
            {
              label: 'Back to Campaigns',
              action: 'post',
              target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
            },
          ],
          image: {
            src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaign-joined.png`,
            aspectRatio: '1.91:1',
          },
          postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns/${campaign.id}`,
        }),
      );
    } catch (error) {
      console.error('Error joining campaign:', error);
      
      return new Response(
        getFrameHtmlResponse({
          buttons: [
            {
              label: 'Try Again',
              action: 'post',
              target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns/${campaign.id}`,
            },
            {
              label: 'Back to Campaigns',
              action: 'post',
              target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
            },
          ],
          image: {
            src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/error.png`,
            aspectRatio: '1.91:1',
          },
          postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns/${campaign.id}`,
        }),
      );
    }
  }

  // Default campaign details view
  const html = getFrameHtmlResponse({
    buttons: [
      {
        label: userParticipation ? 'View Progress' : 'Join Campaign',
        action: 'post',
        target: userParticipation 
          ? `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns/${campaign.id}/progress`
          : `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns/${campaign.id}`,
      },
      {
        label: 'Campaign Leaderboard',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns/${campaign.id}/leaderboard`,
      },
      {
        label: 'Back to Campaigns',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
      },
      {
        label: 'Back to Home',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames`,
      },
    ],
    image: {
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaign-${campaign.id}-details.png`,
      aspectRatio: '1.91:1',
    },
    postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns/${campaign.id}`,
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  const campaignId = params.id;

  // Fetch campaign details for initial load
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: campaignId,
    },
    include: {
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });

  if (!campaign) {
    return new Response(
      getFrameHtmlResponse({
        buttons: [
          {
            label: 'Back to Campaigns',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
          },
          {
            label: 'Back to Home',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames`,
          },
        ],
        image: {
          src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaign-not-found.png`,
          aspectRatio: '1.91:1',
        },
        postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
      }),
    );
  }

  const html = getFrameHtmlResponse({
    buttons: [
      {
        label: '← Back to Campaigns',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
      },
      {
        label: '🎯 Join Campaign',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns/${campaign.id}/join`,
      },
      {
        label: '📊 View Stats',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns/${campaign.id}/stats`,
      },
    ],
    image: {
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?title=${encodeURIComponent(campaign.title)}&subtitle=${encodeURIComponent(campaign.description)}`,
      aspectRatio: '1.91:1',
    },
    postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns/${campaign.id}`,
    splashImageUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/splash-image?type=campaign&campaignId=${campaign.id}`,
    splashBackgroundColor: '#f0f9ff',
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}