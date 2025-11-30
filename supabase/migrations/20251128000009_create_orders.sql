-- Add role to profiles if it doesn't exist
alter table profiles add column if not exists role text default 'user';

-- Create orders table
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users, -- Nullable for guest checkout
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'cancelled')),
  total decimal(10, 2) not null,
  currency text default 'RON',
  payment_method text not null,
  shipping_method text not null,
  customer_details jsonb not null, -- Stores name, email, phone, address, company info
  awb_number text,
  invoice_number text
);

-- Create order_items table
create table if not exists order_items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  order_id uuid references orders not null,
  product_id text, -- Can be a UUID from marketplace_listings or a string ID from products.json
  name text not null,
  quantity integer not null,
  price decimal(10, 2) not null,
  currency text default 'RON',
  image_url text
);

-- Enable RLS
alter table orders enable row level security;
alter table order_items enable row level security;

-- Policies for orders
create policy "Users can view their own orders" on orders
  for select using (auth.uid() = user_id);

create policy "Admins can view all orders" on orders
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin' -- Assuming we have a role column, or we just allow service role to bypass
    )
  );

-- Allow public insert for guest checkout (or handle via API with service role)
-- For now, we'll rely on the API route using Service Role to insert, so no public insert policy needed for security.

-- Policies for order_items
create policy "Users can view their own order items" on order_items
  for select using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );
