import { NextRequest, NextResponse } from 'next/server';

// Basic Frame API route for Farcaster Frame integration
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId') || '1';

  // Generate Frame HTML with proper meta tags
  const frameHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>KAST - Campaign ${campaignId}</title>
        
        <!-- Farcaster Frame meta tags -->
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_APP_URL}/api/frames/image?campaignId=${campaignId}" />
        <meta property="fc:frame:button:1" content="View Campaign" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="${process.env.NEXT_PUBLIC_APP_URL}/campaign/${campaignId}" />
        <meta property="fc:frame:button:2" content="Join Now" />
        <meta property="fc:frame:button:2:action" content="post" />
        <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_APP_URL}/api/frames/action" />
        
        <!-- Open Graph meta tags -->
        <meta property="og:title" content="KAST - Farcaster Reward Campaign" />
        <meta property="og:description" content="Join reward campaigns and earn by creating amazing content on Farcaster" />
        <meta property="og:image" content="${process.env.NEXT_PUBLIC_APP_URL}/api/frames/image?campaignId=${campaignId}" />
        <meta property="og:url" content="${process.env.NEXT_PUBLIC_APP_URL}/campaign/${campaignId}" />
      </head>
      <body>
        <h1>KAST Campaign ${campaignId}</h1>
        <p>Join this reward campaign on Farcaster!</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/campaign/${campaignId}">View Campaign</a>
      </body>
    </html>
  `;

  return new NextResponse(frameHtml, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// Handle Frame actions (button clicks)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buttonIndex, fid } = body;

    // Handle different button actions
    if (buttonIndex === 2) {
      // "Join Now" button clicked
      return NextResponse.json({
        type: 'frame',
        frameUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/joined?fid=${fid}`,
      });
    }

    // Default response
    return NextResponse.json({
      type: 'frame',
      frameUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames`,
    });
  } catch (error) {
    console.error('Frame action error:', error);
    return NextResponse.json(
      { error: 'Invalid frame action' },
      { status: 400 }
    );
  }
}