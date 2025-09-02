import { FrameRequest, getFrameMessage, getFrameHtmlResponse } from '@/lib/frames/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<Response> {
  let accountAddress: string | undefined = '';
  let text: string | undefined = '';

  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, { neynarApiKey: 'NEYNAR_ONCHAIN_KIT' });

  if (isValid) {
    accountAddress = message.interactor?.verified_accounts[0] || '';
    text = message.input || '';
  }

  const html = getFrameHtmlResponse({
    buttons: [
      {
        label: 'View Campaigns',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
      },
      {
        label: 'Leaderboard',
        action: 'post', 
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/leaderboard`,
      },
    ],
    image: {
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/welcome.png`,
      aspectRatio: '1.91:1',
    },
    input: {
      text: 'Enter your message...',
    },
    postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames`,
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

export async function GET(): Promise<Response> {
  const html = getFrameHtmlResponse({
    buttons: [
      {
        label: 'View Campaigns',
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/campaigns`,
      },
      {
        label: 'Leaderboard', 
        action: 'post',
        target: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/leaderboard`,
      },
    ],
    image: {
      src: `${process.env.NEXT_PUBLIC_BASE_URL}/frames/welcome.png`,
      aspectRatio: '1.91:1',
    },
    postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/frames`,
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}