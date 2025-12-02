
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

async function verifyFormats() {
    // Check a known kit with formats
    const { data: kits, error: kitError } = await supabase
        .from('products')
        .select('id, title, product_type, formats')
        .ilike('title', '%Africana%')
        .limit(1);

    if (kitError) console.error('Error fetching kit:', kitError);
    else console.log('Kit Product:', kits);

    // Check Gherghef (Accessory)
    const { data: accessories, error: accError } = await supabase
        .from('products')
        .select('id, title, product_type, formats')
        .ilike('title', '%Gherghef%')
        .limit(1);

    if (accError) console.error('Error fetching accessory:', accError);
    else console.log('Accessory Product:', accessories);
}

verifyFormats();
