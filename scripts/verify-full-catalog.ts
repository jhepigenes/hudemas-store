
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verify() {
    console.log('Verifying Full Catalog...');

    // 1. Count Total Products
    const { count, error: countError } = await supabase
        .from('marketplace_listings')
        .select('*', { count: 'exact', head: true })
        .in('product_type', ['kit', 'accessory']);

    if (countError) {
        console.error('Error counting products:', countError);
        return;
    }
    console.log(`Total Products (Kit + Accessory): ${count}`);

    // 2. Check Categories (via description)
    const { data: products, error: fetchError } = await supabase
        .from('marketplace_listings')
        .select('title, description, product_type')
        .in('product_type', ['kit', 'accessory'])
        .limit(20);

    if (fetchError) {
        console.error('Error fetching products:', fetchError);
        return;
    }

    console.log('\nSample Products:');
    products.forEach(p => {
        console.log(`- [${p.product_type}] ${p.title} (${p.description})`);
    });

    // 3. Check specific categories
    const categories = ['Fructe', 'Peisaje', 'Accesorii'];
    for (const cat of categories) {
        const { count: catCount, error: catError } = await supabase
            .from('marketplace_listings')
            .select('*', { count: 'exact', head: true })
            .ilike('description', `%Category: ${cat}%`);

        if (catError) console.error(`Error checking category ${cat}:`, catError);
        else console.log(`Category '${cat}': ${catCount} products`);
    }
}

verify();
