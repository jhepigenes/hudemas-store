-- Create a table for site settings (key-value store)
create table if not exists site_settings (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table site_settings enable row level security;

do $$ begin
  create policy "Settings are viewable by everyone." on site_settings for select using ( true );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Authenticated users can update settings." on site_settings for insert with check ( auth.role() = 'authenticated' );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Authenticated users can update settings." on site_settings for update using ( auth.role() = 'authenticated' );
exception when duplicate_object then null; end $$;
