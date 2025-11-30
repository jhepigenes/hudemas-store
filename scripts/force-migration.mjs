import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRef = 'msepwdbzrzqotapgesnd';
const accessToken = 'sbp_e339f48660b596179ede643983be60364ffcd151'; // User provided PAT

// We will combine the SQL needed
const sql = `
-- Create products table
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
`;

console.log(`Applying SQL Migration via Management API...`);

const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/query`, // Use /query or /sql depending on version, /query is usually for Management API
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
};

// Try /v1/projects/{ref}/query first (standard for Supabase Management API SQL execution)
const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('Success! Table created.');
    } else {
        console.log('Response:', data);
        // Fallback: try /v1/projects/{ref}/sql (sometimes used)
        console.log('Trying alternate endpoint...');
        // ... (Logic to retry if needed, but let's see output first)
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(JSON.stringify({ query: sql }));
req.end();
