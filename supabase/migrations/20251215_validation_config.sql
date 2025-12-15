-- Create validation_config table for background validation control
CREATE TABLE IF NOT EXISTS validation_config (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    is_enabled BOOLEAN DEFAULT false,
    last_run_at TIMESTAMPTZ,
    total_validated INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default row
INSERT INTO validation_config (id, is_enabled, total_validated, errors_count)
VALUES (1, false, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS but allow service role to bypass
ALTER TABLE validation_config ENABLE ROW LEVEL SECURITY;

-- Policy for service role (full access)
CREATE POLICY "Service role has full access" ON validation_config
    FOR ALL USING (true) WITH CHECK (true);
