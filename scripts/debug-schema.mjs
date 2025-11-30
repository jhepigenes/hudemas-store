import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkAndRefresh() {
    console.log('Checking if column "payment_intent_id" exists in "orders"...');
    
    // We can't easily inspect schema via JS client without rpc, but we can try to select it.
    // If it fails, it doesn't exist.
    const { data, error } = await supabase
        .from('orders')
        .select('payment_intent_id')
        .limit(1);

    if (error) {
        console.log('❌ Error selecting column:', error.message);
        console.log('Attempting to force schema cache reload...');
    } else {
        console.log('✅ Column exists! (Select worked)');
    }

    // Force reload regardless, to be safe.
    // We can use the RPC 'notify' if enabled, or just run raw SQL via our CLI tool if possible.
    // Since we have the CLI setup, we will use that in the next step.
}

checkAndRefresh();
