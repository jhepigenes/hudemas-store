
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestFinished() {
    console.log('Fetching latest 3 finished products...');
    const { data, error } = await supabase
        .from('marketplace_listings')
        .select('id, title, image_url, product_type, status')
        .eq('status', 'active')
        .eq('product_type', 'finished')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found products:', data?.length);
    data?.forEach((item, index) => {
        console.log(`\nProduct #${index + 1}:`);
        console.log(`ID: ${item.id}`);
        console.log(`Title: ${item.title}`);
        console.log(`Image URL: ${item.image_url}`);
    });
}

checkLatestFinished();
