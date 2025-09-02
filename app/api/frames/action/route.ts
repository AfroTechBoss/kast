import { NextRequest, NextResponse } from 'next/server';

// Handle Frame button actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buttonIndex, fid, castId, inputText } = body;

    console.log('Frame action received:', { buttonIndex, fid, castId, inputText });

    // Handle different button actions
    switch (buttonIndex) {
      case 1:
        // "View Campaign" button - redirect to campaign page
        return NextResponse.json({
          type: 'frame',
          frameUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/campaign-details`,
        });

      case 2:
        // "Join Now" button - show success frame
        return NextResponse.json({
          type: 'frame',
          frameUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/joined?fid=${fid}`,
        });

      default:
        // Default action - return to main frame
        return NextResponse.json({
          type: 'frame',
          frameUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames`,
        });
    }
  } catch (error) {
    console.error('Frame action error:', error);
    
    // Return error frame
    return NextResponse.json({
      type: 'frame',
      frameUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frames/error`,
    });
  }
}

// Handle GET requests (fallback)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint only accepts POST requests' },
    { status: 405 }
  );
}