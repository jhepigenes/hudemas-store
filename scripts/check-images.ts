
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImages() {
    const { data, error } = await supabase
        .from('marketplace_listings')
        .select('id, title, image_url')
        .in('product_type', ['kit', 'accessory'])
        .is('image_url', null); // Check for null images

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} items with NULL image_url.`);
    if (data.length > 0) {
        console.log('Sample:', data[0]);
    }
}

checkImages();
