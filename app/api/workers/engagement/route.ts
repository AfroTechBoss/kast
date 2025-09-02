import { NextRequest, NextResponse } from 'next/server';
import { engagementWorker } from '@/lib/workers/engagement-worker';
import { withAuth } from '@/lib/auth/middleware';

// Get worker status
export const GET = withAuth(async (req) => {
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
}, { required: false });

// Control worker (start/stop/trigger)
export const POST = withAuth(async (req) => {
  try {
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
});