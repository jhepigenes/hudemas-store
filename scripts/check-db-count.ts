
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCount() {
    const { count, error } = await supabase
        .from('marketplace_listings')
        .select('*', { count: 'exact', head: true })
        .in('product_type', ['kit', 'accessory']);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Count of kits/accessories in DB:', count);
    }
}

checkCount();
