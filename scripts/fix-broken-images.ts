
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBrokenImages() {
    console.log('Fixing broken images...');

    // 1. Delete the listing with the known broken image
    const brokenImageUrl = 'https://www.hudemas.ro/assets/images/products/large/goblen-hudemas-005-fata-in-alb-256.jpg';

    const { error: deleteError } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('image_url', brokenImageUrl);

    if (deleteError) {
        console.error('Error deleting broken listing:', deleteError);
    } else {
        console.log(`Successfully deleted listing with image: ${brokenImageUrl}`);
    }
}

fixBrokenImages();
