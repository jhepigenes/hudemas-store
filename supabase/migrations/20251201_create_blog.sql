-- Create table for blog articles
create table if not exists articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  content text not null,
  excerpt text,
  image_url text,
  published_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table articles enable row level security;

-- Allow public read access
drop policy if exists "Public can read articles" on articles;
create policy "Public can read articles" on articles
  for select using (true);

-- Allow admin insert/update (We will use service role in API, but good to have policy if we use client)
-- For simplicity in this CLI environment, we rely on Service Role for admin actions.
