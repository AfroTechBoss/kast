-- Migration: Add missing created_at column to campaigns table
-- This fixes the error: 42703: column "created_at" does not exist

-- Add created_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE campaigns 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Update existing records to have a created_at timestamp
        -- Use the earliest available timestamp or current time
        UPDATE campaigns 
        SET created_at = COALESCE(updated_at, NOW()) 
        WHERE created_at IS NULL;
        
        RAISE NOTICE 'Added created_at column to campaigns table';
    ELSE
        RAISE NOTICE 'created_at column already exists in campaigns table';
    END IF;
END
$$;

-- Add updated_at column if it doesn't exist (for completeness)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE campaigns 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Update existing records
        UPDATE campaigns 
        SET updated_at = COALESCE(created_at, NOW()) 
        WHERE updated_at IS NULL;
        
        RAISE NOTICE 'Added updated_at column to campaigns table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in campaigns table';
    END IF;
END
$$;

-- Ensure the trigger for updating updated_at exists
CREATE OR REPLACE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add index for created_at if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);

RAISE NOTICE 'Migration completed: campaigns table now has created_at and updated_at columns';