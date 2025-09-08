import { NextRequest, NextResponse } from 'next/server';
import { engagementWorker } from '@/lib/workers/engagement-worker';

// Get worker status
export async function GET() {
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
    // Authentication bypassed - no user authentication required
    
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
  } catch (error: unknown) {
    console.error('Error controlling worker:', error);
    return NextResponse.json(
      { error: `Failed to control worker: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}