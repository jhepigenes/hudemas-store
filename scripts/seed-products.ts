import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function seedProducts() {
    console.log('🚀 Starting product seed...');

    const productsPath = path.join(__dirname, '../scraped_data/full_products.json');
    if (!fs.existsSync(productsPath)) {
        console.error(`❌ Products file not found at: ${productsPath}`);
        process.exit(1);
    }

    const rawProducts = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    console.log(`📦 Found ${rawProducts.length} products in JSON.`);

    // Transform products
    const products = rawProducts.map((p: any) => {
        // Extract SKU from image URL
        // e.g. goblen-hudemas-001-lebede-255.jpg
        const skuMatch = p.image?.match(/goblen-hudemas-(\d+)/);
        const skuNumber = skuMatch ? skuMatch[1] : null;
        const sku = skuNumber ? `HUD-${skuNumber}` : null;

        // Parse Price
        // "91,08 Lei" -> 91.08
        const priceString = p.price?.replace(' Lei', '').replace('.', '').replace(',', '.').trim();
        const price = parseFloat(priceString) || 0;

        // Generate Slug
        const slug = p.title.toLowerCase()
            .replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i').replace(/ș/g, 's').replace(/ț/g, 't')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') + (skuNumber ? `-${skuNumber}` : '');

        return {
            title: p.title,
            slug: slug,
            description: `Gobelin kit: ${p.title}`, // Placeholder description
            price: price,
            currency: 'RON',
            image_url: p.image,
            category: p.category || 'Goblenuri',
            product_type: p.product_type || 'kit',
            sku: sku,
            original_url: p.url,
            stock_quantity: 50 // Default stock
        };
    });

    // Batch Insert
    const BATCH_SIZE = 100;
    let insertedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        
        // Use upsert to update existing products based on SKU or Slug if possible.
        // Since we don't have a unique constraint on all fields, let's assume we want to skip duplicates or upsert on SKU.
        // We added unique constraint on SKU in migration.
        
        const { error } = await supabase
            .from('products')
            .upsert(batch, { onConflict: 'sku', ignoreDuplicates: true }); 

        if (error) {
            console.error(`❌ Error inserting batch ${i}-${i + BATCH_SIZE}:`, error.message);
            errorCount += batch.length;
        } else {
            insertedCount += batch.length;
            process.stdout.write(`\r✅ Inserted ${insertedCount}/${products.length} products...`);
        }
    }

    console.log('\n\n🎉 Seeding complete!');
    console.log(`Total Inserted: ${insertedCount}`);
    console.log(`Total Errors: ${errorCount}`);
}

seedProducts();
