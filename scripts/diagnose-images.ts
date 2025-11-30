
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseImages() {
    console.log('Diagnosing "Latest Arrivals" (Finished Works) images...');

    const { data: products, error } = await supabase
        .from('marketplace_listings')
        .select('id, title, image_url, product_type, status')
        .eq('product_type', 'finished')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Found ${products.length} products.`);
    products.forEach((p, i) => {
        console.log(`[${i}] ${p.title} (${p.id})`);
        console.log(`    Image: ${p.image_url}`);
    });
}

diagnoseImages();
