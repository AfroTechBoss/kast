import { NextRequest, NextResponse } from 'next/server';
import { farcasterSigner } from '@/lib/farcaster/signer';
import { cookies } from 'next/headers';

// Verify current session
export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session token found' },
        { status: 401 }
      );
    }

    const user = await farcasterSigner.verifySession(sessionToken);
    
    if (!user) {
      // Clear invalid session cookie
      cookieStore.delete('session_token');
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { error: 'Session verification failed' },
      { status: 500 }
    );
  }
}

// Refresh session (extend expiry)
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session token found' },
        { status: 401 }
      );
    }

    const user = await farcasterSigner.verifySession(sessionToken);
    
    if (!user) {
      cookieStore.delete('session_token');
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Session is valid, it was already updated with new activity time
    return NextResponse.json({
      success: true,
      user,
      message: 'Session refreshed',
    });
  } catch (error) {
    console.error('Error refreshing session:', error);
    return NextResponse.json(
      { error: 'Session refresh failed' },
      { status: 500 }
    );
  }
}