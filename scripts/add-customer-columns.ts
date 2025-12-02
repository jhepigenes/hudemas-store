import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
    const sql = `
    ALTER TABLE customer_details 
    ADD COLUMN IF NOT EXISTS address text,
    ADD COLUMN IF NOT EXISTS city text,
    ADD COLUMN IF NOT EXISTS county text,
    ADD COLUMN IF NOT EXISTS country text,
    ADD COLUMN IF NOT EXISTS type text DEFAULT 'individual';
    `;

    // Try standard query if RPC fails or not exists? 
    // Supabase JS client doesn't support raw SQL without an RPC function like 'exec_sql' or 'query'.
    // Let's try to use the 'postgres' package directly if available, or just hope the RPC exists.
    
    // Actually, let's check if 'pg' is installed.
    try {
        const { error } = await supabase.rpc('exec_sql', { query: sql });
        if (error) {
            console.error('RPC Error:', error);
            // If RPC fails, we can't easily run DDL from here without a direct DB connection.
        } else {
            console.log('Migration successful via RPC.');
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}

runMigration();