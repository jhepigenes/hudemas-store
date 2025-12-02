import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkImages() {
    const { data: products } = await supabase.from('products').select('id, title, image_url').limit(5);
    console.log(JSON.stringify(products, null, 2));
}

checkImages();