#!/usr/bin/env node
/**
 * Execute DDL to add missing columns using postgres.js
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Build connection string from Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PROJECT_REF = SUPABASE_URL?.split('//')[1]?.split('.')[0];
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Connecting to Supabase database...');
console.log('Project ref:', PROJECT_REF);
console.log('URL:', SUPABASE_URL);

// Use the direct connection format for Supabase
// Format: postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
const connectionString = `postgres://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`;

console.log('Connection target:', `db.${PROJECT_REF}.supabase.co`);

const sql = postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
});

async function run() {
    try {
        // Add missing columns
        console.log('Adding campaigns column...');
        await sql`ALTER TABLE analytics_runs ADD COLUMN IF NOT EXISTS campaigns JSONB DEFAULT '[]'`;

        console.log('Adding trends column...');
        await sql`ALTER TABLE analytics_runs ADD COLUMN IF NOT EXISTS trends JSONB DEFAULT '[]'`;

        console.log('Adding delivery_issues column...');
        await sql`ALTER TABLE analytics_runs ADD COLUMN IF NOT EXISTS delivery_issues JSONB DEFAULT '[]'`;

        console.log('✅ All columns added successfully!');

        // Verify
        const result = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'analytics_runs'`;
        console.log('Current columns:', result.map(r => r.column_name).join(', '));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await sql.end();
    }
}

run();
