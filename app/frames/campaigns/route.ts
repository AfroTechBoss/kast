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

  // Fetch active campaigns
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: 'ACTIVE',
    },
    take: 3,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      description: true,
      totalRewardPool: true,
    },
  });

  const currentCampaign = campaigns[0] || null;

  if (buttonIndex === 2 && currentCampaign) {
    // View campaign details
    return new Response(
      getFrameHtmlResponse({
        buttons: [
          {
            label: 'Join Campaign',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns/${currentCampaign.id}/join`,
          },
          {
            label: 'Back to Campaigns',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
          },
          {
            label: 'View Leaderboard',
            action: 'post',
            target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/leaderboard`,
          },
        ],
        image: {
          src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaign-${currentCampaign.id}.png`,
          aspectRatio: '1.91:1',
        },
        postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns/${currentCampaign.id}`,
      }),
    );
  }

  // Default campaigns list view
  const html = getFrameHtmlResponse({
    buttons: [
      {
        label: 'Previous',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns?page=prev`,
      },
      {
        label: currentCampaign ? 'View Details' : 'No Campaigns',
        action: 'post',
        target: currentCampaign 
          ? `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns/${currentCampaign.id}`
          : `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
      },
      {
        label: 'Next',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns?page=next`,
      },
      {
        label: 'Back to Home',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames`,
      },
    ],
    image: {
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns-list.png`,
      aspectRatio: '1.91:1',
    },
    postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

export async function GET(): Promise<Response> {
  // Fetch active campaigns for initial load
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: 'ACTIVE',
    },
    take: 3,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      description: true,
      totalRewardPool: true,
    },
  });

  const currentCampaign = campaigns[0] || null;

  const html = getFrameHtmlResponse({
    buttons: [
      {
        label: 'Previous',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns?page=prev`,
      },
      {
        label: currentCampaign ? 'View Details' : 'No Campaigns',
        action: 'post',
        target: currentCampaign 
          ? `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns/${currentCampaign.id}`
          : `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
      },
      {
        label: 'Next',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns?page=next`,
      },
      {
        label: 'Back to Home',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames`,
      },
    ],
    image: {
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns-list.png`,
      aspectRatio: '1.91:1',
    },
    postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}