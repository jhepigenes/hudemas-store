-- Create table for extended customer details (CRM)
create table if not exists customer_details (
  email text primary key,
  name text,
  phone text,
  company_name text,
  notes text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table customer_details enable row level security;

-- Policies
do $$ begin
  create policy "Admins can view all customer details." on customer_details for select using ( 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can insert customer details." on customer_details for insert with check ( 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can update customer details." on customer_details for update using ( 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
exception when duplicate_object then null; end $$;
