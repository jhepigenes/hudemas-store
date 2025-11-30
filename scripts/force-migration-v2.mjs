import https from 'https';
import fs from 'fs';

const projectRef = 'msepwdbzrzqotapgesnd';
const accessToken = 'sbp_e339f48660b596179ede643983be60364ffcd151';

const sql = `
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
alter table products enable row level security;
do $$ begin create policy "Products are viewable by everyone" on products for select using (true); exception when duplicate_object then null; end $$;
`;

console.log(`Applying SQL Migration via Pgsodium (if enabled) or Management API (Retrying /sql)...`);

// The correct endpoint for running SQL via Management API is likely:
// POST https://api.supabase.com/v1/projects/{ref}/type/sql  <-- Wait, documentation says /v1/projects/{ref}/sql or /query might be pg-meta specific.
// Let's try to use the 'pg-meta' endpoint if exposed, or the proper Management API 'POST /v1/projects/{ref}/query' which failed.
// Actually, Supabase Management API does NOT expose a direct "Run SQL" endpoint for security, usually. 
// But the CLI uses it. The CLI uses `/v1/projects/{ref}/api/pg-meta/query`.

const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/pg-meta/query`, // Trying pg-meta endpoint
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Response:', data);
  });
});

req.on('error', (e) => console.error(e));
req.write(JSON.stringify({ query: sql }));
req.end();
