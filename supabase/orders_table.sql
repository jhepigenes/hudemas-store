-- Supabase Orders Table Schema
-- Run this in Supabase SQL Editor
-- Execute this FIRST, then run the indexes separately if needed

-- Drop table if exists (uncomment if you want to reset)
-- DROP TABLE IF EXISTS orders;

-- Create the orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id INTEGER UNIQUE NOT NULL,
  customer_id UUID,
  legacy_customer_id INTEGER,
  
  -- Order details
  status VARCHAR(50) DEFAULT 'pending',
  total DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  items JSONB, -- [{product_id, name, qty, price}]
  
  -- Shipping address (snapshot at order time)
  ship_name VARCHAR(255),
  ship_address TEXT,
  ship_locality VARCHAR(100),
  ship_state VARCHAR(100),
  ship_postalcode VARCHAR(20),
  ship_country VARCHAR(100) DEFAULT 'Romania',
  ship_phone VARCHAR(50),
  
  -- Geo validation
  geo_lat DECIMAL(10,8),
  geo_lon DECIMAL(11,8),
  geo_validated BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  order_date TIMESTAMPTZ,
  shipped_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
