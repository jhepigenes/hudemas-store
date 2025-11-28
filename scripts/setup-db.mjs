import https from 'https';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRef = 'msepwdbzrzqotapgesnd';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_7eb244ab284cc64135de560a25281407cf622477';

const migrationFile = path.join(__dirname, '../supabase/migrations/20251128_fix_rls.sql');
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
