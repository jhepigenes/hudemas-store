
import https from 'https';

const projectRef = 'msepwdbzrzqotapgesnd';
const accessToken = 'sbp_e339f48660b596179ede643983be60364ffcd151';

const sql = `
-- Allow users to update their own profile
do $$ begin
create policy "Users can update own profile"
on profiles for update
using ( auth.uid() = id );
exception when duplicate_object then null; end $$;

do $$ begin
create policy "Users can insert own profile"
on profiles for insert
with check ( auth.uid() = id );
exception when duplicate_object then null; end $$;

-- Ensure columns exist
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists address text;
alter table profiles add column if not exists city text;
alter table profiles add column if not exists county text;
alter table profiles add column if not exists country text;
alter table profiles add column if not exists zip_code text;
`;

console.log(`Applying Profile Policies...`);

const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/query`,
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

req.on('error', (error) => { console.error('Error:', error); });
req.write(JSON.stringify({ query: sql }));
req.end();
