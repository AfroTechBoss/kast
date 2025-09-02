import { FrameRequest, getFrameMessage, getFrameHtmlResponse } from '@/lib/frames/utils';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest): Promise<Response> {
  let accountAddress: string | undefined = '';
  let text: string | undefined = '';
  let buttonIndex = 1;

  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, { neynarApiKey: 'NEYNAR_ONCHAIN_KIT' });

  if (isValid) {
    accountAddress = message.interactor?.verified_accounts[0] || '';
    text = message.input || '';
    buttonIndex = message.button || 1;
  }

  // Fetch top users by engagement score
  const topUsers = await prisma.user.findMany({
    take: 10,
    orderBy: {
      engagementScore: 'desc',
    },
    select: {
      id: true,
      username: true,
      engagementScore: true,
      totalRewards: true,
      farcasterFid: true,
    },
  });

  // Get current user's rank if they have an account
  let currentUserRank = null;
  if (accountAddress) {
    const currentUser = await prisma.user.findFirst({
      where: {
        walletAddress: accountAddress,
      },
      select: {
        id: true,
        username: true,
        engagementScore: true,
        totalRewards: true,
      },
    });

    if (currentUser) {
      const usersAbove = await prisma.user.count({
        where: {
          engagementScore: {
            gt: currentUser.engagementScore,
          },
        },
      });
      currentUserRank = usersAbove + 1;
    }
  }

  if (buttonIndex === 2) {
    // View rewards
    return new Response(
      getFrameHtmlResponse({
        buttons: [
          {
            label: 'Claim Rewards',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards/claim`,
          },
          {
            label: 'Back to Leaderboard',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/leaderboard`,
          },
          {
            label: 'View Campaigns',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
          },
        ],
        image: {
          src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards.png`,
          aspectRatio: '1.91:1',
        },
        postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards`,
      }),
    );
  }

  // Default leaderboard view
  const html = getFrameHtmlResponse({
    buttons: [
      {
        label: '← Back',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames`,
      },
      {
        label: 'View Rewards',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards`,
      },
    ],
    image: {
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?title=Leaderboard&subtitle=Top%20performers%20this%20week`,
      aspectRatio: '1.91:1',
    },
    postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/leaderboard`,
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

export async function GET(): Promise<Response> {
  // Fetch top users for initial load
  const topUsers = await prisma.user.findMany({
    take: 10,
    orderBy: {
      engagementScore: 'desc',
    },
    select: {
      id: true,
      username: true,
      engagementScore: true,
      totalRewards: true,
      farcasterFid: true,
    },
  });

  const html = getFrameHtmlResponse({
    buttons: [
      {
        label: 'Refresh',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/leaderboard`,
      },
      {
        label: 'View Rewards',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards`,
      },
      {
        label: 'Join Campaign',
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
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/leaderboard.png`,
      aspectRatio: '1.91:1',
    },
    postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/leaderboard`,
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}