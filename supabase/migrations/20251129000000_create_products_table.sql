-- Create products table for official store items
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  slug text unique, -- For SEO friendly URLs
  description text,
  price decimal(10, 2) not null,
  currency text default 'RON',
  image_url text,
  category text,
  product_type text default 'kit', -- 'kit', 'accessory', etc.
  stock_quantity integer default 100, -- Placeholder until Odoo sync
  sku text unique, -- To map to Odoo
  original_url text -- For reference
);

-- Enable RLS
alter table products enable row level security;

-- Policies
create policy "Products are viewable by everyone" on products
  for select using (true);

create policy "Only admins can insert products" on products
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Only admins can update products" on products
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
