-- Create table for product reviews
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text, -- Snapshot of name at time of review
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  image_url text,
  is_verified boolean default false,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table reviews enable row level security;

-- Public can read APPROVED reviews
create policy "Public can read approved reviews" on reviews
  for select using (status = 'approved');

-- Authenticated users can insert reviews
create policy "Authenticated users can insert reviews" on reviews
  for insert with check (auth.role() = 'authenticated');

-- Users can view their own reviews (even pending)
create policy "Users can view own reviews" on reviews
  for select using (auth.uid() = user_id);
