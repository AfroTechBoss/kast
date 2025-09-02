import { NextRequest, NextResponse } from 'next/server';
import { farcasterSigner } from '@/lib/farcaster/signer';
import { cookies } from 'next/headers';

// Generate authentication URL
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const redirectUri = searchParams.get('redirectUri') || `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`;

    const { url, channelToken } = await farcasterSigner.generateAuthUrl(redirectUri);

    // Store channel token in cookie for verification
    const cookieStore = cookies();
    cookieStore.set('fc_channel_token', channelToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
    });

    return NextResponse.json({
      authUrl: url,
      channelToken,
    });
  } catch (error) {
    console.error('Error generating Farcaster auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication URL' },
      { status: 500 }
    );
  }
}

// Verify authentication and create session
export async function POST(req: NextRequest) {
  try {
    const { channelToken, walletAddress } = await req.json();
    const cookieStore = cookies();
    const storedChannelToken = cookieStore.get('fc_channel_token')?.value;

    // Verify channel token matches
    if (!channelToken || channelToken !== storedChannelToken) {
      return NextResponse.json(
        { error: 'Invalid or expired channel token' },
        { status: 400 }
      );
    }

    // Verify authentication with Farcaster
    const farcasterUser = await farcasterSigner.verifyAuth(channelToken);
    
    if (!farcasterUser) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Create or update user and session
    const authResult = await farcasterSigner.authenticateUser(farcasterUser, walletAddress);

    // Set session cookie
    cookieStore.set('session_token', authResult.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: authResult.session.expiresAt,
    });

    // Clear channel token
    cookieStore.delete('fc_channel_token');

    return NextResponse.json({
      success: true,
      user: authResult.user,
      session: {
        expiresAt: authResult.session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error verifying Farcaster auth:', error);
    return NextResponse.json(
      { error: 'Authentication verification failed' },
      { status: 500 }
    );
  }
}

// Logout and revoke session
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (sessionToken) {
      await farcasterSigner.revokeSession(sessionToken);
    }

    // Clear session cookie
    cookieStore.delete('session_token');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}