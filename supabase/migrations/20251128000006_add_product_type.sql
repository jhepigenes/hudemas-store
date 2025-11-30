-- Create product_type enum
create type product_type as enum ('kit', 'accessory', 'finished');

-- Add columns to marketplace_listings
alter table marketplace_listings 
add column if not exists product_type product_type default 'kit',
add column if not exists stock integer default 1;

-- Update existing rows based on some logic if needed, or default to 'kit' (already set by default)
-- For now, we assume everything currently in DB is a 'kit' (scraped) or 'finished' (if manually added, but we don't have manual ones yet really)
-- We can refine this later or let the sync script handle it.
