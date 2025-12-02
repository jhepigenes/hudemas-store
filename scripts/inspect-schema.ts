
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectSchema() {
    const { data: products } = await supabase.from('products').select('*').limit(1);
    console.log('Product keys:', Object.keys(products?.[0] || {}));
    console.log('Sample Product:', products?.[0]);
}

inspectSchema();
