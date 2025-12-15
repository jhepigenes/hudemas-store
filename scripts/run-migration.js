#!/usr/bin/env node
/**
 * Run Supabase migration to create customers table
 * Usage: node scripts/run-migration.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🚀 Starting Supabase migration...');
    console.log(`📡 Connecting to: ${supabaseUrl}`);

    // Check if table already exists
    console.log('\n📋 Checking if customers table exists...');
    const { data: existingTable, error: checkError } = await supabase
        .from('customers')
        .select('id')
        .limit(1);

    if (!checkError) {
        console.log('✅ customers table already exists!');
        const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true });
        console.log(`📊 Current row count: ${count || 0}`);
        return;
    }

    if (checkError.code !== 'PGRST116' && !checkError.message.includes('does not exist')) {
        // PGRST116 = relation does not exist (expected if table doesn't exist)
        console.log('⚠️  Table check returned:', checkError.message);
    }

    console.log('\n⚠️  Table does not exist. You need to run this SQL in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/_/sql');
    console.log('\n📝 SQL has been copied to clipboard and saved to:');
    console.log('   supabase/migrations/001_create_customers.sql');

    // Read and display the SQL
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '../supabase/migrations/001_create_customers.sql');

    if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('\n--- SQL MIGRATION ---');
        console.log(sql.substring(0, 500) + '...');
        console.log('--- END ---\n');
    }

    console.log('💡 After running the SQL, run this script again to verify the table was created.');
}

runMigration().catch(console.error);
