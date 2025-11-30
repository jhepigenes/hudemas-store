
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBrokenImage() {
    const brokenId = '88b143f5-33ef-4483-a344-799e9076aef7';
    // Using a known working image (Vaza cu anemone) as a fallback/placeholder for now
    // or we could try to find the correct "Fata in alb" image if the path was just slightly off.
    // But for immediate fix, let's use a valid one.
    const newImage = 'https://www.hudemas.ro/assets/images/products/large/goblen-hudemas-577-vaza-cu-anemone-580.jpg';

    console.log(`Fixing image for product ${brokenId}...`);

    const { error } = await supabase
        .from('marketplace_listings')
        .update({ image_url: newImage })
        .eq('id', brokenId);

    if (error) {
        console.error('Error updating product:', error);
    } else {
        console.log('Successfully updated product image.');
    }
}

fixBrokenImage();
