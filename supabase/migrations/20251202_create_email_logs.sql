-- Create sent_emails table for logging admin communications
create table if not exists sent_emails (
  id uuid default gen_random_uuid() primary key,
  recipient_email text not null,
  subject text not null,
  body text not null,
  status text default 'sent', -- 'sent', 'failed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb -- Store extra info like order_id if applicable
);

-- Enable RLS
alter table sent_emails enable row level security;

-- Policies
create policy "Admins can view all email logs"
  on sent_emails for select
  using (auth.role() = 'authenticated' and exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert email logs"
  on sent_emails for insert
  with check (auth.role() = 'authenticated' and exists (select 1 from profiles where id = auth.uid() and role = 'admin'));