
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    const { data, error } = await supabase
        .from('marketplace_listings')
        .select('title, status')
        .eq('product_type', 'accessory');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} accessories.`);
    console.log('Sample:', data.slice(0, 5));
}

verify();
