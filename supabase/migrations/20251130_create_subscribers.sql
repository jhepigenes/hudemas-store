-- Create table for subscribers
create table if not exists subscribers (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  status text default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table subscribers enable row level security;

-- Allow anyone to insert (subscribe)
drop policy if exists "Anyone can subscribe" on subscribers;
create policy "Anyone can subscribe" on subscribers
  for insert with check (true);
