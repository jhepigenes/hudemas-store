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

async function verifyIntegrity() {
    console.log('🔍 Verifying Catalog Integrity...');

    let allProducts: any[] = [];
    let from = 0;
    const step = 1000;
    let more = true;

    while (more) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .range(from, from + step - 1);

        if (error) {
            console.error('Error fetching products:', error);
            return;
        }

        if (data && data.length > 0) {
            allProducts = [...allProducts, ...data];
            from += step;
            if (data.length < step) {
                more = false;
            }
        } else {
            more = false;
        }
    }

    const products = allProducts;

    const total = products.length;
    console.log(`Total Products: ${total}`);

    let missingSlug = 0;
    let missingVariants = 0;
    let missingImage = 0;
    let missingPrice = 0;
    const slugs = new Set<string>();
    const duplicates = [];
    const missingVariantSamples = [];

    for (const p of products) {
        if (!p.slug) missingSlug++;
        else {
            if (slugs.has(p.slug)) duplicates.push(p.slug);
            slugs.add(p.slug);
        }

        // Check variants: we expect at least dimensions OR colors OR formats to be present for a "complete" record
        // strictly speaking, accessories might not have them, but kits should.
        if (p.product_type === 'kit') {
            if (!p.dimensions && !p.colors && (!p.formats || p.formats.length === 0)) {
                missingVariants++;
                if (missingVariantSamples.length < 5) {
                    missingVariantSamples.push(p.title);
                }
            }
        }

        if (!p.image_url) missingImage++;
        if (p.price === null || p.price === undefined) missingPrice++;
    }

    console.log('--- Report ---');
    console.log(`Missing Slug: ${missingSlug}`);
    console.log(`Missing Variants (Kits only): ${missingVariants}`);
    if (missingVariantSamples.length > 0) {
        console.log('Sample Missing Variants:', missingVariantSamples);
    }
    console.log(`Missing Image: ${missingImage}`);
    console.log(`Missing Price: ${missingPrice}`);
    console.log(`Duplicate Slugs: ${duplicates.length}`);
    if (duplicates.length > 0) {
        console.log('Sample Duplicates:', duplicates.slice(0, 5));
    }
    
    // Check specific problematic patterns
    const weirdSlugs = products.filter(p => p.slug && p.slug.includes('undefined'));
    if (weirdSlugs.length > 0) {
        console.log(`⚠️ Found ${weirdSlugs.length} slugs containing 'undefined'.`);
    }
}

verifyIntegrity();
