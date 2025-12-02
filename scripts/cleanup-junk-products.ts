import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanupJunk() {
    console.log('🔍 Scanning for junk products (SKU ending in .1 with missing data)...');

    // Fetch all products
    const { data: products, error } = await supabase
        .from('products')
        .select('id, title, slug, sku, dimensions, colors, formats');

    if (error) {
        console.error(error);
        return;
    }

    const junkCandidates = products.filter(p => 
        p.sku && 
        p.sku.endsWith('.1') && 
        !p.dimensions && 
        !p.colors && 
        (!p.formats || p.formats.length === 0)
    );

    console.log(`Found ${junkCandidates.length} potential junk candidates.`);

    const toDelete = [];

    for (const junk of junkCandidates) {
        // Check if base product exists
        const baseSku = junk.sku.replace('.1', '');
        const baseProduct = products.find(p => p.sku === baseSku);

        if (baseProduct) {
            console.log(`🗑️  Junk: ${junk.slug} (SKU: ${junk.sku}) -> Base found: ${baseProduct.slug} (SKU: ${baseSku})`);
            toDelete.push(junk.id);
        } else {
            // Try HUD- prefix
            const hudSku = `HUD-${baseSku}`;
            const hudProduct = products.find(p => p.sku === hudSku);
            
            if (hudProduct) {
                 console.log(`🗑️  Junk: ${junk.slug} (SKU: ${junk.sku}) -> Base found: ${hudProduct.slug} (SKU: ${hudSku})`);
                 toDelete.push(junk.id);
            } else {
                console.warn(`⚠️  Junk candidate ${junk.slug} (SKU: ${junk.sku}) has NO base product! skipping.`);
            }
        }
    }

    console.log(`
Ready to delete ${toDelete.length} records.`);
    
    if (toDelete.length > 0) {
        const { error: delError } = await supabase
            .from('products')
            .delete()
            .in('id', toDelete);
        if (delError) console.error('Delete failed:', delError);
        else console.log('✅ Deleted successfully.');
    }
}

cleanupJunk();
