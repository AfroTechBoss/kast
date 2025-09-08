import { FrameRequest, getFrameMessage, getFrameHtmlResponse } from '@/lib/frames/utils';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest): Promise<Response> {
  let accountAddress: string | undefined = '';
  let buttonIndex = 1;

  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body);

  if (isValid) {
    accountAddress = message.interactor?.verified_accounts[0] || '';
    buttonIndex = message.button || 1;
  }

  if (!accountAddress) {
    return new Response(
      getFrameHtmlResponse({
        buttons: [
          {
            label: 'Connect Wallet',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/connect`,
          },
          {
            label: 'Back to Home',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames`,
          },
        ],
        image: {
          src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/connect-wallet.png`,
          aspectRatio: '1.91:1',
        },
        postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards`,
      }),
    );
  }

  // Find user and their claimable rewards
  const user = await prisma.user.findFirst({
    where: {
      walletAddress: accountAddress,
    },
    include: {
      rewards: {
        where: {
          status: 'PENDING',
        },
        include: {
          campaign: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return new Response(
      getFrameHtmlResponse({
        buttons: [
          {
            label: 'Create Account',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/signup`,
          },
          {
            label: 'Back to Home',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames`,
          },
        ],
        image: {
          src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/signup.png`,
          aspectRatio: '1.91:1',
        },
        postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards`,
      }),
    );
  }

  const claimableRewards = user.rewards.filter((r) => r.status === 'PENDING');
  const totalClaimable = claimableRewards.reduce((sum: number, reward) => sum + reward.amount, 0);

  if (buttonIndex === 1 && claimableRewards.length > 0) {
    // Process reward claiming
    try {
      await prisma.$transaction(async (tx) => {
        // Update rewards to claimed
        await tx.reward.updateMany({
          where: {
            userId: user.id,
            status: 'PENDING',
          },
          data: {
            status: 'CLAIMED',
            claimedAt: new Date(),
          },
        });

        // Update user's total rewards
        await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            totalRewards: {
              increment: totalClaimable,
            },
          },
        });
      });

      return new Response(
        getFrameHtmlResponse({
          buttons: [
            {
              label: 'View Leaderboard',
              action: 'post',
              target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/leaderboard`,
            },
            {
              label: 'Join More Campaigns',
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
            src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards-claimed.png`,
            aspectRatio: '1.91:1',
          },
          postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards`,
        }),
      );
    } catch (error) {
      console.error('Error claiming rewards:', error);
      
      return new Response(
        getFrameHtmlResponse({
          buttons: [
            {
              label: 'Try Again',
              action: 'post',
              target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards`,
            },
            {
              label: 'Back to Home',
              action: 'post',
              target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames`,
            },
          ],
          image: {
            src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/error.png`,
            aspectRatio: '1.91:1',
          },
          postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards`,
        }),
      );
    }
  }

  // Default rewards view
  const html = getFrameHtmlResponse({
    buttons: [
      {
        label: claimableRewards.length > 0 ? `Claim ${totalClaimable} KAST` : 'No Rewards',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards`,
      },
      {
        label: 'View Leaderboard',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/leaderboard`,
      },
      {
        label: 'Join Campaigns',
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
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards-${claimableRewards.length > 0 ? 'available' : 'none'}.png`,
      aspectRatio: '1.91:1',
    },
    postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards`,
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

export async function GET(): Promise<Response> {
  return new Response(
    getFrameHtmlResponse({
      buttons: [
        {
          label: 'Check Rewards',
          action: 'post',
          target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards`,
        },
        {
          label: 'View Leaderboard',
          action: 'post',
          target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/leaderboard`,
        },
        {
          label: 'Join Campaigns',
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
        src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards-check.png`,
        aspectRatio: '1.91:1',
      },
      postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/rewards`,
    }),
  );
}