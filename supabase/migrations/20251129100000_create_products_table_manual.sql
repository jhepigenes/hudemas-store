create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  slug text unique,
  description text,
  price decimal(10, 2) not null,
  currency text default 'RON',
  image_url text,
  category text,
  product_type text default 'kit',
  stock_quantity integer default 100,
  sku text unique,
  original_url text
);

-- Enable RLS
alter table products enable row level security;

-- Policies
do $$ begin
  create policy "Products are viewable by everyone" on products for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Only admins can insert products" on products for insert with check (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Only admins can update products" on products for update using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
exception when duplicate_object then null; end $$;
