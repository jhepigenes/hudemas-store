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

async function debugProduct() {
    console.log('🔍 Debugging Product "Christ" / "Hrist"...');

    // 1. Try fetching by specific slugs
    const slugsToCheck = ['christ', 'hrist', 'hrist-012'];
    const { data: bySlug, error: slugError } = await supabase
        .from('products')
        .select('*')
        .in('slug', slugsToCheck);

    if (slugError) console.error('Error fetching by slug:', slugError);
    console.log(`Found ${bySlug?.length || 0} products by slug.`);
    if (bySlug?.length) console.log('By Slug:', bySlug);

    // 2. Try fetching by title (ilike)
    const { data: byTitle, error: titleError } = await supabase
        .from('products')
        .select('*')
        .ilike('title', '%hrist%');

    if (titleError) console.error('Error fetching by title:', titleError);
    console.log(`Found ${byTitle?.length || 0} products by title "%hrist%".`);
    if (byTitle?.length) {
        byTitle.forEach(p => {
            console.log(`- ID: ${p.id}`);
            console.log(`  Title: ${p.title}`);
            console.log(`  Slug: ${p.slug}`);
            console.log(`  Image: ${p.image_url}`);
            console.log(`  Variants: Dims=${p.dimensions}, Colors=${p.colors}, Formats=${p.formats}`);
        });
    }
}

debugProduct();
