-- Analytics runs table for storing analysis results
-- Created: 2025-12-17

CREATE TABLE IF NOT EXISTS analytics_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    summary JSONB NOT NULL DEFAULT '{}',
    attribution JSONB DEFAULT '{}',
    recommendations JSONB[] DEFAULT '{}',
    alerts JSONB[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries on run_at
CREATE INDEX IF NOT EXISTS idx_analytics_runs_run_at ON analytics_runs(run_at DESC);

-- Clean up old runs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_runs()
RETURNS void AS $$
BEGIN
    DELETE FROM analytics_runs WHERE run_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON TABLE analytics_runs IS 'Stores automated analytics engine results for dashboard display';
