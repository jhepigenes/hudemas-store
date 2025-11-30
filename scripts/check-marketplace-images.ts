
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImages() {
    const { data, error } = await supabase
        .from('marketplace_listings')
        .select('id, title, image_url, product_type')
        .eq('product_type', 'finished')
        .eq('status', 'active');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} finished works.`);
    data.forEach(item => {
        console.log(`[${item.id}] ${item.title}: ${item.image_url}`);
    });
}

checkImages();
