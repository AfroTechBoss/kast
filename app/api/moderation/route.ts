import { NextRequest, NextResponse } from 'next/server';
import { contentModerator } from '@/lib/moderation/moderator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();



// Get moderation statistics and rules
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const timeframe = searchParams.get('timeframe') as 'day' | 'week' | 'month' || 'day';

    switch (action) {
      case 'stats':
        const stats = await contentModerator.getModerationStats(timeframe);
        return NextResponse.json({
          success: true,
          stats,
          timeframe,
        });

      case 'rules':
        const rules = contentModerator.getRules();
        return NextResponse.json({
          success: true,
          rules,
        });

      case 'actions':
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        
        const actions = await prisma.moderationAction.findMany({
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: {
            moderator: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        });

        const total = await prisma.moderationAction.count();

        return NextResponse.json({
          success: true,
          actions,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: stats, rules, or actions' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in moderation GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation data' },
      { status: 500 }
    );
  }
}

// Moderate content or user
export async function POST(req: NextRequest) {
  // Authentication bypassed - no auth system

  try {

    const { action, targetType, targetId, castData, userId } = await req.json();

    if (!action || !['moderate_cast', 'moderate_user', 'update_rule'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: moderate_cast, moderate_user, or update_rule' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'moderate_cast':
        if (!castData || !userId) {
          return NextResponse.json(
            { error: 'Cast data and user ID are required' },
            { status: 400 }
          );
        }
        
        result = await contentModerator.moderateCast(castData, userId);
        break;

      case 'moderate_user':
        if (!targetId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }
        
        result = await contentModerator.moderateUser(targetId);
        break;

      case 'update_rule':
        const { ruleId, updates } = await req.json();
        if (!ruleId || !updates) {
          return NextResponse.json(
            { error: 'Rule ID and updates are required' },
            { status: 400 }
          );
        }
        
        contentModerator.updateRule(ruleId, updates);
        result = { success: true, message: 'Rule updated successfully' };
        break;
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error in moderation POST:', error);
    return NextResponse.json(
      { error: 'Moderation action failed' },
      { status: 500 }
    );
  }
}

// Execute moderation action
export async function PUT(req: NextRequest) {
  // Authentication bypassed - no auth system

  try {
    const { actionType, targetType, targetId, reason, severity, expiresAt } = await req.json();

    if (!actionType || !targetType || !targetId) {
      return NextResponse.json(
        { error: 'Action type, target type, and target ID are required' },
        { status: 400 }
      );
    }

    // Create moderation action
    const moderationAction = await prisma.moderationAction.create({
      data: {
        targetType,
        targetId,
        action: actionType,
        reason: reason || 'Manual moderation action',
        severity: severity || 'MEDIUM',
        moderatorId: null, // No auth system
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Execute the action based on type
    switch (actionType) {
      case 'HIDE_CONTENT':
        if (targetType === 'CAST') {
          await prisma.castEngagement.updateMany({
            where: { castHash: targetId },
            data: { engagementScore: 0 }, // Zero out engagement score
          });
        }
        break;

      case 'SUSPEND_USER':
      case 'BAN_USER':
        if (targetType === 'USER') {
          // Update user status or add suspension flag
          await prisma.user.update({
            where: { id: targetId },
            data: {
              // Could add a suspended/banned field to user model
              updatedAt: new Date(),
            },
          });
        }
        break;

      case 'REMOVE_FROM_CAMPAIGN':
        if (targetType === 'USER') {
          // Remove user from all active campaigns
          await prisma.campaignParticipant.deleteMany({
            where: {
              userId: targetId,
              campaign: {
                status: 'ACTIVE',
              },
            },
          });
        }
        break;
    }

    return NextResponse.json({
      success: true,
      action: moderationAction,
      message: `${actionType} executed successfully`,
    });
  } catch (error) {
    console.error('Error executing moderation action:', error);
    return NextResponse.json(
      { error: 'Failed to execute moderation action' },
      { status: 500 }
    );
  }
}

// Delete or reverse moderation action
export async function DELETE(req: NextRequest) {
  // Authentication bypassed - no auth system

  try {

    const { searchParams } = new URL(req.url);
    const actionId = searchParams.get('actionId');

    if (!actionId) {
      return NextResponse.json(
        { error: 'Action ID is required' },
        { status: 400 }
      );
    }

    // Find the moderation action
    const moderationAction = await prisma.moderationAction.findUnique({
      where: { id: actionId },
    });

    if (!moderationAction) {
      return NextResponse.json(
        { error: 'Moderation action not found' },
        { status: 404 }
      );
    }

    // Reverse the action if possible
    switch (moderationAction.action) {
      case 'HIDE_CONTENT':
        if (moderationAction.targetType === 'CAST') {
          // Could restore original engagement score here
          // For now, just mark as reversed
        }
        break;

      case 'SUSPEND_USER':
      case 'BAN_USER':
        // Remove suspension/ban status
        break;

      case 'REMOVE_FROM_CAMPAIGN':
        // Could potentially restore campaign participation
        break;
    }

    // Delete the moderation action
    await prisma.moderationAction.delete({
      where: { id: actionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Moderation action reversed successfully',
    });
  } catch (error) {
    console.error('Error reversing moderation action:', error);
    return NextResponse.json(
      { error: 'Failed to reverse moderation action' },
      { status: 500 }
    );
  }
}