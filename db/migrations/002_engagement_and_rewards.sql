-- Migration: 002_engagement_and_rewards
-- Description: Create engagement events, scoring, rewards, and analytics tables
-- Created: 2024-01-20

-- Engagement events table
CREATE TABLE IF NOT EXISTS engagement_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('like', 'recast', 'reply', 'quote')),
    engager_fid BIGINT NOT NULL,
    engager_username VARCHAR(255),
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    weight DECIMAL(3, 2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scoring history table
CREATE TABLE IF NOT EXISTS scoring_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    scoring_version VARCHAR(10) NOT NULL DEFAULT '1.0',
    base_points INTEGER NOT NULL DEFAULT 0,
    engagement_multiplier DECIMAL(5, 2) DEFAULT 1.0,
    bonus_points INTEGER DEFAULT 0,
    penalty_points INTEGER DEFAULT 0,
    final_score INTEGER NOT NULL DEFAULT 0,
    calculation_details JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES campaign_participants(id) ON DELETE CASCADE,
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('token', 'badge', 'nft')),
    token_address VARCHAR(42),
    token_amount DECIMAL(20, 8),
    token_symbol VARCHAR(10),
    badge_id INTEGER,
    nft_token_id INTEGER,
    rank_position INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'claimable', 'claimed', 'expired')),
    transaction_hash VARCHAR(66),
    claimed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_uri TEXT NOT NULL,
    rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    badge_type VARCHAR(50) NOT NULL CHECK (badge_type IN ('achievement', 'participation', 'ranking', 'special')),
    criteria JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    total_supply INTEGER DEFAULT 0,
    max_supply INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    token_id INTEGER,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    UNIQUE(user_id, badge_id, campaign_id)
);

-- Moderation actions table
CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('approve', 'reject', 'flag', 'unflag')),
    reason TEXT,
    automated BOOLEAN DEFAULT FALSE,
    confidence_score DECIMAL(3, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appeals table
CREATE TABLE IF NOT EXISTS appeals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    moderation_action_id UUID NOT NULL REFERENCES moderation_actions(id) ON DELETE CASCADE,
    appeal_reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    review_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    properties JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_engagement_events_submission_id ON engagement_events(submission_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_user_id ON engagement_events(user_id);
CREATE INDEX IF NOT EXISTS idx_scoring_history_submission_id ON scoring_history(submission_id);
CREATE INDEX IF NOT EXISTS idx_scoring_history_campaign_id ON scoring_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_rewards_campaign_id ON rewards(campaign_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_submission_id ON moderation_actions(submission_id);
CREATE INDEX IF NOT EXISTS idx_appeals_submission_id ON appeals(submission_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);

-- Insert migration record
INSERT INTO schema_migrations (version, applied_at, description) 
VALUES ('002', NOW(), 'Create engagement events, scoring, rewards, and analytics tables')
ON CONFLICT (version) DO NOTHING;