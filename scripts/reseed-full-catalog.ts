
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function reseed() {
    console.log('Reseeding Full Catalog...');

    // 1. Load Data
    const productsPath = path.join(__dirname, '../products_full.json');
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    console.log(`Loaded ${products.length} products.`);

    // 2. Login as Admin
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@hudemas.ro',
        password: 'admin123'
    });

    if (loginError) {
        console.error('Login failed:', loginError.message);
        return;
    }

    const userId = session?.user.id;
    console.log(`Logged in as Admin: ${userId}`);

    // 3. Delete existing kits and accessories
    const { error: deleteError } = await supabase
        .from('marketplace_listings')
        .delete()
        .in('product_type', ['kit', 'accessory']);

    if (deleteError) console.error('Delete error:', deleteError.message);
    else console.log('Deleted old kits and accessories.');

    // 4. Insert New
    // Process in batches to avoid payload limits
    const BATCH_SIZE = 100;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        const items = batch.map((p: any) => ({
            user_id: userId,
            artist_id: userId,
            title: p.title,
            description: `Category: ${p.category}`, // Store category in description for filtering
            price: p.price,
            currency: p.currency,
            status: 'active',
            product_type: p.product_type,
            image_url: p.image
        }));

        const { error: insertError } = await supabase.from('marketplace_listings').insert(items);

        if (insertError) console.error(`Batch ${i} insert error:`, insertError);
        else console.log(`Inserted batch ${i} - ${i + items.length}`);
    }

    console.log('✅ Reseed complete.');
}

reseed();
