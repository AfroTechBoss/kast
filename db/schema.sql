-- KAST Database Schema
-- PostgreSQL database schema for KAST Farcaster mini-app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farcaster_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    wallet_address VARCHAR(42),
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    account_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    total_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    rules TEXT NOT NULL,
    reward_pool DECIMAL(20, 8) NOT NULL,
    reward_token_symbol VARCHAR(10) NOT NULL DEFAULT 'USDC',
    reward_token_address VARCHAR(42) NOT NULL,
    contract_campaign_id INTEGER,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended', 'cancelled')),
    participant_count INTEGER DEFAULT 0,
    submission_count INTEGER DEFAULT 0,
    total_engagement INTEGER DEFAULT 0,
    metadata_uri TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign tasks table
CREATE TABLE IF NOT EXISTS campaign_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('cast', 'meme', 'explainer', 'reply', 'recast', 'like')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    max_submissions INTEGER DEFAULT 0, -- 0 means unlimited
    is_required BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign participants table
CREATE TABLE IF NOT EXISTS campaign_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_score INTEGER DEFAULT 0,
    current_rank INTEGER DEFAULT 0,
    submission_count INTEGER DEFAULT 0,
    last_submission_at TIMESTAMP WITH TIME ZONE,
    is_eligible BOOLEAN DEFAULT TRUE,
    reward_amount DECIMAL(20, 8) DEFAULT 0,
    has_claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(campaign_id, user_id)
);

-- Submissions table (casts, memes, etc.)
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES campaign_participants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES campaign_tasks(id) ON DELETE SET NULL,
    cast_hash VARCHAR(66), -- Farcaster cast hash
    cast_url TEXT,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('cast', 'meme', 'explainer', 'reply', 'recast')),
    content TEXT NOT NULL,
    media_urls TEXT[], -- Array of media URLs
    parent_cast_hash VARCHAR(66), -- For replies
    like_count INTEGER DEFAULT 0,
    recast_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    quote_count INTEGER DEFAULT 0,
    engagement_score DECIMAL(10, 2) DEFAULT 0,
    base_points INTEGER DEFAULT 0,
    bonus_points INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    moderation_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Engagement tracking table
CREATE TABLE IF NOT EXISTS engagement_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('like', 'recast', 'reply', 'quote')),
    farcaster_event_id VARCHAR(66),
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(submission_id, user_id, event_type, farcaster_event_id)
);

-- Scoring history table
CREATE TABLE IF NOT EXISTS scoring_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
    score_type VARCHAR(50) NOT NULL,
    points_awarded INTEGER NOT NULL,
    multiplier DECIMAL(5, 2) DEFAULT 1.0,
    reason TEXT,
    scoring_version VARCHAR(10) DEFAULT '1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES campaign_participants(id) ON DELETE CASCADE,
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('token', 'badge', 'nft')),
    amount DECIMAL(20, 8),
    token_symbol VARCHAR(10),
    token_address VARCHAR(42),
    badge_id INTEGER,
    nft_token_id INTEGER,
    rank_achieved INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'claimable', 'claimed', 'expired')),
    transaction_hash VARCHAR(66),
    claimed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges table (for tracking NFT badges)
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    contract_badge_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    image_url TEXT,
    metadata_uri TEXT,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    max_supply INTEGER DEFAULT 0, -- 0 means unlimited
    current_supply INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contract_badge_id)
);

-- User badges (earned badges)
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_hash VARCHAR(66),
    UNIQUE(user_id, badge_id)
);

-- Moderation table
CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('approve', 'reject', 'flag', 'unflag')),
    reason TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appeals table
CREATE TABLE IF NOT EXISTS appeals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_farcaster_id ON users(farcaster_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_campaigns_creator_id ON campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_time ON campaigns(start_time);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_time ON campaigns(end_time);

CREATE INDEX IF NOT EXISTS idx_campaign_participants_campaign_id ON campaign_participants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_user_id ON campaign_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_total_score ON campaign_participants(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_current_rank ON campaign_participants(current_rank);

CREATE INDEX IF NOT EXISTS idx_submissions_campaign_id ON submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_cast_hash ON submissions(cast_hash);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_submissions_total_points ON submissions(total_points DESC);

CREATE INDEX IF NOT EXISTS idx_engagement_events_submission_id ON engagement_events(submission_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_user_id ON engagement_events(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_event_type ON engagement_events(event_type);
CREATE INDEX IF NOT EXISTS idx_engagement_events_created_at ON engagement_events(created_at);

CREATE INDEX IF NOT EXISTS idx_scoring_history_user_id ON scoring_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scoring_history_campaign_id ON scoring_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_scoring_history_created_at ON scoring_history(created_at);

CREATE INDEX IF NOT EXISTS idx_rewards_campaign_id ON rewards(campaign_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_appeals_updated_at BEFORE UPDATE ON appeals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
    like_count INTEGER,
    recast_count INTEGER,
    reply_count INTEGER,
    quote_count INTEGER
) RETURNS DECIMAL(10, 2) AS $$
BEGIN
    -- Based on KAST scoring: Likes=0.4, Recasts=1.0, Replies=0.3, Quotes=0.8
    RETURN (
        (like_count * 0.4) +
        (recast_count * 1.0) +
        (reply_count * 0.3) +
        (quote_count * 0.8)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update campaign participant counts
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update participant count
        IF TG_TABLE_NAME = 'campaign_participants' THEN
            UPDATE campaigns 
            SET participant_count = participant_count + 1
            WHERE id = NEW.campaign_id;
        END IF;
        
        -- Update submission count
        IF TG_TABLE_NAME = 'submissions' THEN
            UPDATE campaigns 
            SET submission_count = submission_count + 1
            WHERE id = NEW.campaign_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for campaign stats
CREATE OR REPLACE TRIGGER update_campaign_participant_count 
    AFTER INSERT ON campaign_participants
    FOR EACH ROW EXECUTE FUNCTION update_campaign_stats();

CREATE OR REPLACE TRIGGER update_campaign_submission_count 
    AFTER INSERT ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_campaign_stats();

-- Views for common queries

-- Campaign leaderboard view
CREATE OR REPLACE VIEW campaign_leaderboard AS
SELECT 
    cp.campaign_id,
    cp.user_id,
    u.username,
    u.display_name,
    u.avatar_url,
    cp.total_score,
    cp.current_rank,
    cp.submission_count,
    cp.joined_at
FROM campaign_participants cp
JOIN users u ON cp.user_id = u.id
WHERE cp.is_eligible = true
ORDER BY cp.campaign_id, cp.current_rank;

-- User statistics view
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id,
    u.username,
    u.display_name,
    COUNT(DISTINCT cp.campaign_id) as campaigns_participated,
    COALESCE(SUM(cp.total_score), 0) as total_score,
    COUNT(DISTINCT s.id) as total_submissions,
    COUNT(DISTINCT ub.badge_id) as badges_earned,
    COALESCE(SUM(r.amount), 0) as total_rewards_earned
FROM users u
LEFT JOIN campaign_participants cp ON u.id = cp.user_id
LEFT JOIN submissions s ON u.id = s.user_id AND s.status = 'approved'
LEFT JOIN user_badges ub ON u.id = ub.user_id
LEFT JOIN rewards r ON u.id = r.user_id AND r.status = 'claimed'
GROUP BY u.id, u.username, u.display_name;

-- Campaign analytics view
CREATE OR REPLACE VIEW campaign_analytics AS
SELECT 
    c.id,
    c.title,
    c.status,
    c.participant_count,
    c.submission_count,
    COALESCE(AVG(s.engagement_score), 0) as avg_engagement_score,
    COALESCE(SUM(s.like_count), 0) as total_likes,
    COALESCE(SUM(s.recast_count), 0) as total_recasts,
    COALESCE(SUM(s.reply_count), 0) as total_replies,
    c.start_time,
    c.end_time,
    c.created_at
FROM campaigns c
LEFT JOIN submissions s ON c.id = s.campaign_id AND s.status = 'approved'
GROUP BY c.id, c.title, c.status, c.participant_count, c.submission_count, c.start_time, c.end_time, c.created_at;