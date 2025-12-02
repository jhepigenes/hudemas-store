import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!dbPassword || !supabaseUrl) {
    console.error('Credentials missing in .env.local');
    process.exit(1);
}

// Extract project ref
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
const connectionString = `postgres://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

console.log(`Connecting to ${projectRef}...`);

async function runMigration() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const sql = `
        ALTER TABLE customer_details 
        ADD COLUMN IF NOT EXISTS address text,
        ADD COLUMN IF NOT EXISTS city text,
        ADD COLUMN IF NOT EXISTS county text,
        ADD COLUMN IF NOT EXISTS country text,
        ADD COLUMN IF NOT EXISTS type text DEFAULT 'individual';
        `;
        
        await client.query(sql);
        console.log('Migration successful via pg client.');
    } catch (e) {
        console.error('Error running migration:', e);
    } finally {
        await client.end();
    }
}

runMigration();