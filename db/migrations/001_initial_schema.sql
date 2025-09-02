-- Migration: 001_initial_schema
-- Description: Create initial database schema for KAST
-- Created: 2024-01-20

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
    max_submissions INTEGER DEFAULT 0,
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

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES campaign_participants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES campaign_tasks(id) ON DELETE SET NULL,
    cast_hash VARCHAR(66),
    cast_url TEXT,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('cast', 'meme', 'explainer', 'reply', 'recast')),
    content TEXT NOT NULL,
    media_urls TEXT[],
    parent_cast_hash VARCHAR(66),
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_farcaster_id ON users(farcaster_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_campaigns_creator_id ON campaigns(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_campaign_id ON campaign_participants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participants_user_id ON campaign_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_campaign_id ON submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_cast_hash ON submissions(cast_hash);

-- Insert migration record
INSERT INTO schema_migrations (version, applied_at) VALUES ('001', NOW())
ON CONFLICT (version) DO NOTHING;