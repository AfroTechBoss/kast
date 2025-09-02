-- Migration: 003_functions_and_views
-- Description: Create database functions, triggers, and views
-- Created: 2024-01-20

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
    like_count INTEGER,
    recast_count INTEGER,
    reply_count INTEGER,
    quote_count INTEGER
) RETURNS DECIMAL(10, 2) AS $$
BEGIN
    RETURN (
        (like_count * 1.0) +
        (recast_count * 2.0) +
        (reply_count * 1.5) +
        (quote_count * 2.5)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update campaign stats
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update participant count
        IF TG_TABLE_NAME = 'campaign_participants' THEN
            UPDATE campaigns 
            SET participant_count = participant_count + 1,
                updated_at = NOW()
            WHERE id = NEW.campaign_id;
        END IF;
        
        -- Update submission count
        IF TG_TABLE_NAME = 'submissions' THEN
            UPDATE campaigns 
            SET submission_count = submission_count + 1,
                updated_at = NOW()
            WHERE id = NEW.campaign_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- Update participant count
        IF TG_TABLE_NAME = 'campaign_participants' THEN
            UPDATE campaigns 
            SET participant_count = participant_count - 1,
                updated_at = NOW()
            WHERE id = OLD.campaign_id;
        END IF;
        
        -- Update submission count
        IF TG_TABLE_NAME = 'submissions' THEN
            UPDATE campaigns 
            SET submission_count = submission_count - 1,
                updated_at = NOW()
            WHERE id = OLD.campaign_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_badges_updated_at BEFORE UPDATE ON badges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for campaign stats
CREATE TRIGGER update_campaign_participant_stats
    AFTER INSERT OR DELETE ON campaign_participants
    FOR EACH ROW EXECUTE FUNCTION update_campaign_stats();

CREATE TRIGGER update_campaign_submission_stats
    AFTER INSERT OR DELETE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_campaign_stats();

-- Campaign leaderboard view
CREATE OR REPLACE VIEW campaign_leaderboard AS
SELECT 
    cp.campaign_id,
    cp.user_id,
    u.username,
    u.display_name,
    u.avatar_url,
    cp.total_score,
    cp.submission_count,
    cp.joined_at,
    ROW_NUMBER() OVER (PARTITION BY cp.campaign_id ORDER BY cp.total_score DESC, cp.joined_at ASC) as rank
FROM campaign_participants cp
JOIN users u ON cp.user_id = u.id
WHERE cp.is_eligible = true
ORDER BY cp.campaign_id, rank;

-- User statistics view
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id as user_id,
    u.username,
    u.display_name,
    u.total_score,
    COUNT(DISTINCT cp.campaign_id) as campaigns_joined,
    COUNT(DISTINCT s.id) as total_submissions,
    COALESCE(SUM(s.engagement_score), 0) as total_engagement,
    COUNT(DISTINCT ub.badge_id) as badges_earned,
    COUNT(DISTINCT CASE WHEN r.status = 'claimed' THEN r.id END) as rewards_claimed,
    COALESCE(SUM(CASE WHEN r.status = 'claimed' THEN r.token_amount END), 0) as total_rewards_value
FROM users u
LEFT JOIN campaign_participants cp ON u.id = cp.user_id
LEFT JOIN submissions s ON u.id = s.user_id
LEFT JOIN user_badges ub ON u.id = ub.user_id
LEFT JOIN rewards r ON u.id = r.user_id
GROUP BY u.id, u.username, u.display_name, u.total_score;

-- Campaign analytics view
CREATE OR REPLACE VIEW campaign_analytics AS
SELECT 
    c.id as campaign_id,
    c.title,
    c.status,
    c.participant_count,
    c.submission_count,
    c.reward_pool,
    c.start_time,
    c.end_time,
    COALESCE(AVG(s.engagement_score), 0) as avg_engagement_score,
    COALESCE(SUM(s.like_count), 0) as total_likes,
    COALESCE(SUM(s.recast_count), 0) as total_recasts,
    COALESCE(SUM(s.reply_count), 0) as total_replies,
    COUNT(DISTINCT s.user_id) as active_participants,
    COUNT(DISTINCT CASE WHEN s.status = 'approved' THEN s.id END) as approved_submissions,
    COUNT(DISTINCT r.id) as rewards_distributed,
    COALESCE(SUM(CASE WHEN r.status = 'claimed' THEN r.token_amount END), 0) as rewards_claimed_value
FROM campaigns c
LEFT JOIN submissions s ON c.id = s.campaign_id
LEFT JOIN rewards r ON c.id = r.campaign_id
GROUP BY c.id, c.title, c.status, c.participant_count, c.submission_count, 
         c.reward_pool, c.start_time, c.end_time;

-- Insert initial badge data
INSERT INTO badges (name, description, image_uri, rarity, badge_type, criteria) VALUES
('First Cast', 'Awarded for your first cast submission', '/badges/first-cast.svg', 'common', 'achievement', '{"requirement": "first_submission"}'),
('Engagement Master', 'Earned 100+ total engagement points', '/badges/engagement-master.svg', 'rare', 'achievement', '{"requirement": "engagement_points", "threshold": 100}'),
('Top Performer', 'Finished in top 3 of a campaign', '/badges/top-performer.svg', 'epic', 'ranking', '{"requirement": "top_rank", "threshold": 3}'),
('Campaign Winner', 'Won first place in a campaign', '/badges/campaign-winner.svg', 'legendary', 'ranking', '{"requirement": "first_place"}'),
('Meme Lord', 'Created 10+ meme submissions', '/badges/meme-lord.svg', 'rare', 'achievement', '{"requirement": "meme_count", "threshold": 10}'),
('Community Builder', 'Participated in 5+ campaigns', '/badges/community-builder.svg', 'epic', 'participation', '{"requirement": "campaign_count", "threshold": 5}'),
('Early Adopter', 'Joined KAST in the first month', '/badges/early-adopter.svg', 'legendary', 'special', '{"requirement": "early_user"}'),
('Consistent Creator', 'Made submissions for 7 consecutive days', '/badges/consistent-creator.svg', 'rare', 'achievement', '{"requirement": "consecutive_days", "threshold": 7}');

-- Insert migration record
INSERT INTO schema_migrations (version, applied_at, description) 
VALUES ('003', NOW(), 'Create database functions, triggers, and views')
ON CONFLICT (version) DO NOTHING;