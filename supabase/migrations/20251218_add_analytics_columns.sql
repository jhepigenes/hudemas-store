-- Add missing columns to analytics_runs table
-- Created: 2025-12-18

-- Add campaigns column for Meta campaign data
ALTER TABLE analytics_runs 
ADD COLUMN IF NOT EXISTS campaigns JSONB DEFAULT '[]';

-- Add trends column for daily trend data
ALTER TABLE analytics_runs 
ADD COLUMN IF NOT EXISTS trends JSONB DEFAULT '[]';

-- Add delivery_issues column for ad health monitoring
ALTER TABLE analytics_runs 
ADD COLUMN IF NOT EXISTS delivery_issues JSONB DEFAULT '[]';

-- Update column comment
COMMENT ON COLUMN analytics_runs.delivery_issues IS 'Ad delivery issues detected by checkAdDeliveryIssues()';
