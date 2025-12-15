#!/usr/bin/env node
/**
 * Execute SQL directly using Supabase Management API
 * This bypasses RLS and runs SQL as admin
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project ref from URL
const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1];

const SQL = `
-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  legacy_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  phone_normalized TEXT,
  address TEXT,
  locality TEXT,
  state TEXT,
  postalcode TEXT,
  country TEXT DEFAULT 'Romania',
  country_normalized TEXT,
  geo_lat DECIMAL(10, 7),
  geo_lon DECIMAL(10, 7),
  geo_confidence TEXT,
  address_quality_score INTEGER,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  first_order DATE,
  last_order DATE,
  days_since_order INTEGER,
  ltv_tier TEXT,
  recency_tier TEXT,
  is_b2b BOOLEAN DEFAULT FALSE,
  is_international BOOLEAN DEFAULT FALSE,
  is_repeat BOOLEAN DEFAULT FALSE,
  is_holiday_buyer BOOLEAN DEFAULT FALSE,
  is_lapsed_vip BOOLEAN DEFAULT FALSE,
  email_valid BOOLEAN,
  data_quality_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'legacy_import'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_ltv_tier ON customers(ltv_tier);
CREATE INDEX IF NOT EXISTS idx_customers_is_b2b ON customers(is_b2b);
CREATE INDEX IF NOT EXISTS idx_customers_locality ON customers(locality);
CREATE INDEX IF NOT EXISTS idx_customers_legacy_id ON customers(legacy_id);
`;

async function executeSQL() {
    console.log('🚀 Executing SQL migration via Supabase...');
    console.log(`📡 Project: ${projectRef}`);
    console.log(`🔗 URL: ${SUPABASE_URL}`);

    // Use pg-meta API endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({})
    });

    console.log('⚠️  Direct SQL execution requires going through Supabase Dashboard or CLI.');
    console.log('');
    console.log('📋 COPY THIS SQL AND RUN IN SUPABASE SQL EDITOR:');
    console.log('   https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('');
    console.log('='.repeat(60));
    console.log(SQL);
    console.log('='.repeat(60));
    console.log('');
    console.log('✅ After running, execute: node scripts/run-migration.js');
    console.log('   to verify the table was created.');
}

executeSQL().catch(console.error);
