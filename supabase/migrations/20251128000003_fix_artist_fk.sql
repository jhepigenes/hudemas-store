ALTER TABLE marketplace_listings 
DROP CONSTRAINT IF EXISTS marketplace_listings_artist_id_fkey;

ALTER TABLE marketplace_listings
ADD CONSTRAINT marketplace_listings_artist_id_fkey
FOREIGN KEY (artist_id)
REFERENCES artists(id);
