-- Enable RLS
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Artists Table Policies
DROP POLICY IF EXISTS "Users can insert their own artist profile" ON artists;
CREATE POLICY "Users can insert their own artist profile"
ON artists FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own artist profile" ON artists;
CREATE POLICY "Users can update their own artist profile"
ON artists FOR UPDATE
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public can view artists" ON artists;
CREATE POLICY "Public can view artists"
ON artists FOR SELECT
TO public
USING (true);

-- Marketplace Listings Table Policies
DROP POLICY IF EXISTS "Artists can insert their own listings" ON marketplace_listings;
CREATE POLICY "Artists can insert their own listings"
ON marketplace_listings FOR INSERT
TO authenticated
WITH CHECK (artist_id = auth.uid());

DROP POLICY IF EXISTS "Artists can update their own listings" ON marketplace_listings;
CREATE POLICY "Artists can update their own listings"
ON marketplace_listings FOR UPDATE
TO authenticated
USING (artist_id = auth.uid());

DROP POLICY IF EXISTS "Public can view approved listings" ON marketplace_listings;
CREATE POLICY "Public can view approved listings"
ON marketplace_listings FOR SELECT
TO public
USING (status = 'approved' OR artist_id = auth.uid());
