
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName: string) {
    console.log(`Checking table: ${tableName}...`);
    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    if (error) {
        console.error(`Error accessing ${tableName}:`, error.message);
        return false;
    }

    console.log(`Table ${tableName} exists. Rows found: ${data.length}`);
    return true;
}

async function main() {
    console.log('Checking Supabase Tables...');

    await checkTable('artists');
    await checkTable('marketplace_listings');
    await checkTable('orders');
    await checkTable('order_items'); // Assuming we might need this

}

main();
