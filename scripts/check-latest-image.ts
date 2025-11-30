
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFirstProductImage() {
    console.log('Fetching first product from marketplace_listings...');

    // Fetch the same way as the homepage: active listings, ordered by created_at desc (implied by "Latest")
    // In app/page.tsx it fetches active listings.
    // In app/marketplace/page.tsx it fetches active listings ordered by created_at desc.
    // Let's assume homepage uses default order or similar.
    // app/page.tsx: .in('product_type', ['kit']).eq('status', 'active').limit(50)

    const { data, error } = await supabase
        .from('marketplace_listings')
        .select('id, title, image_url, product_type, status')
        .in('product_type', ['kit'])
        .eq('status', 'active')
        .limit(1);

    if (error) {
        console.error('Error fetching product:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No products found.');
        return;
    }

    const product = data[0];
    console.log('First Product:', product);
    console.log('Image URL:', product.image_url);

    if (product.image_url) {
        // Check if URL is accessible
        try {
            const response = await fetch(product.image_url, { method: 'HEAD' });
            console.log(`URL Check Status: ${response.status} ${response.statusText}`);
        } catch (err) {
            console.error('Error checking URL:', err);
        }
    } else {
        console.log('Product has no image URL.');
    }
}

checkFirstProductImage();
