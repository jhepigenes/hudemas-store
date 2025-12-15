-- Supabase Migration: Create customers table
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Drop existing table if rerunning
-- DROP TABLE IF EXISTS customers;

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  legacy_id INTEGER UNIQUE,
  
  -- Contact Info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  phone_normalized TEXT,
  
  -- Address
  address TEXT,
  locality TEXT,
  state TEXT,
  postalcode TEXT,
  country TEXT DEFAULT 'Romania',
  country_normalized TEXT,
  
  -- Geocoding
  geo_lat DECIMAL(10, 7),
  geo_lon DECIMAL(10, 7),
  geo_confidence TEXT,
  address_quality_score INTEGER,
  
  -- Business Metrics
  total_spent DECIMAL(12, 2) DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  first_order DATE,
  last_order DATE,
  days_since_order INTEGER,
  
  -- Segments
  ltv_tier TEXT,
  recency_tier TEXT,
  is_b2b BOOLEAN DEFAULT FALSE,
  is_international BOOLEAN DEFAULT FALSE,
  is_repeat BOOLEAN DEFAULT FALSE,
  is_holiday_buyer BOOLEAN DEFAULT FALSE,
  is_lapsed_vip BOOLEAN DEFAULT FALSE,
  
  -- Data Quality
  email_valid BOOLEAN,
  data_quality_score INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'legacy_import'
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_ltv_tier ON customers(ltv_tier);
CREATE INDEX IF NOT EXISTS idx_customers_is_b2b ON customers(is_b2b);
CREATE INDEX IF NOT EXISTS idx_customers_locality ON customers(locality);
CREATE INDEX IF NOT EXISTS idx_customers_legacy_id ON customers(legacy_id);

-- Enable Row Level Security (optional for now)
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Computed column for B2B detection (as a view or trigger later)
-- B2B customers have SRL, SA, PFA, Ltd, etc. in their name
