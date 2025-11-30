import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Using Service Role Key (which I have) to attempt to run RAW SQL if an RPC exists, 
// or just standard table creation via API if possible (it's not).
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Plan C: Check if 'products' table already exists.
// Maybe the user ran it? 
async function checkTable() {
    const { data, error } = await supabase.from('products').select('id').limit(1);
    if (error && error.code === '42P01') {
        console.log('Table "products" does NOT exist.');
    } else if (error) {
        console.log('Error checking table:', error.message);
    } else {
        console.log('Table "products" EXISTS! (Data count: ' + (data ? data.length : 0) + ')');
        process.exit(0); // Success
    }
    process.exit(1); // Fail
}

checkTable();
