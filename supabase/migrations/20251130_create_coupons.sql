-- Create a table for coupons
create table if not exists coupons (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  discount_type text check (discount_type in ('percentage', 'fixed')) not null,
  discount_value decimal(10, 2) not null,
  min_order_amount decimal(10, 2) default 0,
  max_uses integer,
  used_count integer default 0,
  expires_at timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table coupons enable row level security;

-- Policies
-- Anyone can read active coupons (to verify them)
create policy "Anyone can read active coupons" on coupons
  for select using (is_active = true);

-- Only admins can insert/update/delete (Assuming admin has a specific role or check, for now open to auth users or service role)
-- For simplicity in this project structure where admin is just a path, we'll rely on app logic or service role for creation
-- But let's allow authenticated users to read.
