-- Create a table for public profiles
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  constraint username_length check (char_length(username) >= 3)
);

alter table profiles enable row level security;

do $$ begin
  create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );
exception when duplicate_object then null; end $$;

-- Create a table for listings
create table if not exists marketplace_listings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  price decimal(10, 2) not null,
  currency text default 'EUR',
  status text default 'active' check (status in ('active', 'pending', 'sold')),
  image_url text,
  user_id uuid references auth.users not null,
  artist_id uuid references auth.users -- Added for compatibility with sell page
);

alter table marketplace_listings enable row level security;

do $$ begin
  create policy "Listings are viewable by everyone." on marketplace_listings for select using ( true );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can insert their own listings." on marketplace_listings for insert with check ( auth.uid() = user_id );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update own listings." on marketplace_listings for update using ( auth.uid() = user_id );
exception when duplicate_object then null; end $$;

-- Create a table for transactions
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  listing_id uuid references marketplace_listings not null,
  buyer_id uuid references auth.users not null,
  seller_id uuid references auth.users not null,
  amount decimal(10, 2) not null,
  status text default 'pending' check (status in ('pending', 'completed', 'cancelled'))
);

alter table transactions enable row level security;

do $$ begin
  create policy "Users can view their own transactions." on transactions for select using ( auth.uid() = buyer_id or auth.uid() = seller_id );
exception when duplicate_object then null; end $$;

-- Create artists table as referenced in sell page
create table if not exists artists (
  id uuid references auth.users not null primary key,
  full_name text,
  status text default 'pending'
);

alter table artists enable row level security;

do $$ begin
  create policy "Artists are viewable by everyone." on artists for select using ( true );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can insert their own artist profile." on artists for insert with check ( auth.uid() = id );
exception when duplicate_object then null; end $$;