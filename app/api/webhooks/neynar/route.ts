import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { pool } from '@/db/connection';

// Verify webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Handle both 'sha256=' prefixed and non-prefixed signatures
  const cleanSignature = signature.startsWith('sha256=') 
    ? signature.slice(7) 
    : signature;

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(cleanSignature, 'hex')
  );
}

interface CastData {
  hash: string;
  author: {
    fid: number;
    username: string;
  };
  text: string;
  timestamp: string;
}

// Handle cast created events
async function handleCastCreated(data: CastData) {
  try {
    const { hash, author, text, timestamp } = data;
    
    console.log('Processing cast created:', {
      hash,
      author: author?.username,
      text: text?.substring(0, 100) + '...',
      timestamp
    });

    // Store cast data in database
    await pool.query(
      'INSERT INTO casts (hash, author_fid, text, timestamp) VALUES ($1, $2, $3, $4) ON CONFLICT (hash) DO NOTHING',
      [hash, author.fid, text, new Date(timestamp)]
    );
    
    return { success: true, message: 'Cast processed successfully' };
  } catch (error) {
    console.error('Error handling cast created:', error);
    throw error;
  }
}

interface ReactionData {
  hash: string;
  reaction_type: string;
  timestamp: string;
  cast: {
    hash: string;
  };
  reactor: {
    fid: number;
    username: string;
  };
}

// Handle reaction events
async function handleReactionCreated(data: ReactionData) {
  try {
    const { reaction_type, cast, reactor } = data;
    
    console.log('Processing reaction created:', {
      type: reaction_type,
      cast_hash: cast?.hash,
      reactor: reactor?.username
    });

    // Store reaction data in database
    await pool.query(
      'INSERT INTO reactions (hash, reactor_fid, target_hash, reaction_type, timestamp) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (hash) DO NOTHING',
      [data.hash, reactor.fid, cast.hash, reaction_type, data.timestamp]
    );
    
    return { success: true, message: 'Reaction processed successfully' };
  } catch (error) {
    console.error('Error handling reaction created:', error);
    throw error;
  }
}

interface FollowData {
  timestamp: string;
  follower: {
    fid: number;
    username: string;
  };
  following: {
    fid: number;
    username: string;
  };
}

// Handle follow events
async function handleFollowCreated(data: FollowData) {
  try {
    const { follower, following } = data;
    
    console.log('Processing follow created:', {
      follower: follower?.username,
      following: following?.username
    });

    // Store follow data in database
    await pool.query(
      'INSERT INTO follows (follower_fid, following_fid, timestamp) VALUES ($1, $2, $3) ON CONFLICT (follower_fid, following_fid) DO NOTHING',
      [follower.fid, following.fid, data.timestamp]
    );
    
    return { success: true, message: 'Follow processed successfully' };
  } catch (error) {
    console.error('Error handling follow created:', error);
    throw error;
  }
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.NEYNAR_WEBHOOK_SECRET;
    
    if (!webhookSecret || webhookSecret === 'your-webhook-secret') {
      console.error('NEYNAR_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get request body and signature
    const body = await request.text();
    const signature = request.headers.get('x-neynar-signature') || 
                     request.headers.get('x-hub-signature-256') || '';

    // Verify signature
    if (!verifySignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error('Invalid JSON payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const { type, data } = payload;
    
    console.log('Received webhook:', { type, timestamp: new Date().toISOString() });

    // Handle different event types
    let result;
    switch (type) {
      case 'cast.created':
        result = await handleCastCreated(data);
        break;
        
      case 'reaction.created':
        result = await handleReactionCreated(data);
        break;
        
      case 'follow.created':
        result = await handleFollowCreated(data);
        break;
        
      case 'user.updated':
        console.log('User updated event received:', data?.username);
        result = { success: true, message: 'User update acknowledged' };
        break;
        
      default:
        console.log('Unhandled webhook type:', type);
        result = { success: true, message: 'Event type not handled' };
    }

    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('hub.challenge');
  
  if (challenge) {
    // Return challenge for webhook verification
    return new Response(challenge, { status: 200 });
  }
  
  return NextResponse.json(
    { message: 'Neynar webhook endpoint is active' },
    { status: 200 }
  );
}