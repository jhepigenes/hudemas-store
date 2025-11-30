-- Drop the existing check constraint
alter table marketplace_listings drop constraint if exists marketplace_listings_status_check;

-- Add the new check constraint with 'rejected' status
alter table marketplace_listings add constraint marketplace_listings_status_check 
  check (status in ('active', 'pending', 'sold', 'rejected'));
