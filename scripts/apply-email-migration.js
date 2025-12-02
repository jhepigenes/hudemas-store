const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const password = process.env.SUPABASE_DB_PASSWORD;
    
    if (supabaseUrl && password) {
        // Extract project ref: https://<ref>.supabase.co
        const ref = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
        if (ref) {
            connectionString = `postgres://postgres:${password}@db.${ref}.supabase.co:5432/postgres`;
            console.log('Constructed connection string from Supabase URL');
        }
    }
}

if (!connectionString) {
    console.error('Could not determine database connection string.');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase usually
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database');

        const sqlPath = path.join(process.cwd(), 'supabase/migrations/20251202_create_email_logs.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);
        console.log('Migration applied successfully');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await client.end();
    }
}

run();
