-- Migration: 000_schema_migrations
-- Description: Create schema migrations tracking table
-- Created: 2024-01-20

-- Schema migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- Insert this migration record
INSERT INTO schema_migrations (version, applied_at, description) 
VALUES ('000', NOW(), 'Create schema migrations tracking table')
ON CONFLICT (version) DO NOTHING;