ALTER TABLE marketplace_listings 
ADD COLUMN IF NOT EXISTS source_url TEXT;

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_source_url ON marketplace_listings(source_url);
