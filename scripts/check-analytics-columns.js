#!/usr/bin/env node
/**
 * Execute SQL to add missing columns to analytics_runs table
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { db: { schema: 'public' } }
);

async function run() {
    console.log('Adding missing columns to analytics_runs...');

    // Try to insert a dummy row with all columns to verify they exist
    // If columns don't exist, we need to add them via SQL editor

    // Unfortunately Supabase client can't run raw DDL (ALTER TABLE)
    // Let's test if columns exist by trying to select them

    const { data, error } = await supabase
        .from('analytics_runs')
        .select('id, campaigns, trends, delivery_issues')
        .limit(1);

    if (error) {
        if (error.message.includes('column')) {
            console.log('❌ Columns missing! Error:', error.message);
            console.log('\nPlease run this SQL in Supabase Dashboard:');
            console.log(`
ALTER TABLE analytics_runs ADD COLUMN IF NOT EXISTS campaigns JSONB DEFAULT '[]';
ALTER TABLE analytics_runs ADD COLUMN IF NOT EXISTS trends JSONB DEFAULT '[]';
ALTER TABLE analytics_runs ADD COLUMN IF NOT EXISTS delivery_issues JSONB DEFAULT '[]';
            `);
        } else {
            console.log('Error:', error.message);
        }
    } else {
        console.log('✅ All columns exist!');
        console.log('Sample data:', data);
    }
}

run().catch(console.error);
