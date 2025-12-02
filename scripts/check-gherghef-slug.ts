
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

async function checkGherghefSlug() {
    const { data, error } = await supabase
        .from('products')
        .select('id, title, slug')
        .ilike('title', '%Gherghef%')
        .limit(5);

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log('Gherghef Products:', data);
}

checkGherghefSlug();
