
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
    const { data, error } = await supabase
        .from('marketplace_listings')
        .select('category')
        .in('product_type', ['kit', 'accessory']);

    if (error) {
        console.error('Error:', error);
        return;
    }

    const categories = new Set(data.map(item => item.category).filter(Boolean));
    console.log('Categories:', Array.from(categories).sort());
}

checkCategories();
