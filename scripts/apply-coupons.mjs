import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRef = 'msepwdbzrzqotapgesnd';
// Use the token from the file I read, or potentially a new one if that one is expired.
// The user provided a token earlier in context: sbp_e339f48660b596179ede643983be60364ffcd151
const accessToken = 'sbp_e339f48660b596179ede643983be60364ffcd151'; 

const migrationFile = path.join(__dirname, '../supabase/migrations/20251130_create_coupons.sql');
const sql = fs.readFileSync(migrationFile, 'utf8');

const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/sql`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
};

console.log('Executing SQL against Supabase Management API...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(JSON.stringify({ query: sql }));
req.end();
