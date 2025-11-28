ALTER TABLE marketplace_listings 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Goblenuri';

-- Update existing rows if needed, or let sync script handle it
