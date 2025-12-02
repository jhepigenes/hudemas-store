import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixChrist() {
    console.log('🛠️ Fixing "Christ" product...');

    // 1. Get correct data from hrist-141
    const { data: source } = await supabase
        .from('products')
        .select('formats')
        .eq('slug', 'hrist-141')
        .single();

    const formats = source?.formats || ['Printed', 'Diagram'];

    // 2. Update christ-141
    const { data, error } = await supabase
        .from('products')
        .update({
            slug: 'christ', // Fix URL
            dimensions: '23 x 30 cm',
            colors: '21',
            formats: formats,
            original_url: 'https://www.hudemas.ro/goblen/hrist-238',
            description: 'Gobelin kit: Christ (Hrist) - A masterpiece of religious art.'
        })
        .eq('slug', 'christ-141')
        .select();

    if (error) {
        console.error('❌ Error updating:', error);
    } else {
        console.log('✅ Successfully updated "Christ":', data);
    }
}

fixChrist();
