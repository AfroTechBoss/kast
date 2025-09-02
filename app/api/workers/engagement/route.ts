import { NextRequest, NextResponse } from 'next/server';
import { engagementWorker } from '@/lib/workers/engagement-worker';
import { farcasterSigner } from '@/lib/farcaster/signer';
import { AuthenticatedUser } from '@/lib/auth/middleware';

// Helper function to authenticate user
async function authenticateUser(req: NextRequest, required: boolean = true): Promise<AuthenticatedUser | null> {
  try {
    const sessionToken = 
      req.cookies.get('session_token')?.value ||
      req.headers.get('Authorization')?.replace('Bearer ', '');

    if (!sessionToken) {
      if (required) {
        throw new Error('Authentication required');
      }
      return null;
    }

    const user = await farcasterSigner.verifySession(sessionToken);
    
    if (!user && required) {
      throw new Error('Invalid or expired session');
    }

    return user;
  } catch (error) {
    if (required) {
      throw error;
    }
    return null;
  }
}

// Get worker status
export async function GET(req: NextRequest) {
  try {
    const status = engagementWorker.getStatus();
    
    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Error getting worker status:', error);
    return NextResponse.json(
      { error: 'Failed to get worker status' },
      { status: 500 }
    );
  }
}

// Control worker (start/stop/trigger)
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateUser(req, true);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { action } = await req.json();
    
    if (!action || !['start', 'stop', 'trigger'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: start, stop, or trigger' },
        { status: 400 }
      );
    }

    let result;
    
    switch (action) {
      case 'start':
        engagementWorker.start();
        result = { message: 'Engagement worker started' };
        break;
        
      case 'stop':
        engagementWorker.stop();
        result = { message: 'Engagement worker stopped' };
        break;
        
      case 'trigger':
        await engagementWorker.triggerManualProcess();
        result = { message: 'Manual engagement processing triggered' };
        break;
    }

    return NextResponse.json({
      success: true,
      ...result,
      status: engagementWorker.getStatus(),
    });
  } catch (error: any) {
    console.error('Error controlling worker:', error);
    return NextResponse.json(
      { error: `Failed to control worker: ${error.message}` },
      { status: 500 }
    );
  }
}