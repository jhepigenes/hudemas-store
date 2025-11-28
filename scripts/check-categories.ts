import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCategories() {
    // Fetch all categories
    const { data: listings, error: listError } = await supabase
        .from('marketplace_listings')
        .select('category, title');

    if (listError) {
        console.error('Error fetching list:', listError);
        return;
    }

    console.log(`Total listings: ${listings.length}`);
    const counts = {};
    listings.forEach(l => {
        const cat = l.category || 'NULL';
        counts[cat] = (counts[cat] || 0) + 1;
    });

    console.log('Category counts:', counts);

    // Check a few Accesorii
    const accesorii = listings.filter(l => l.category === 'Accesorii').slice(0, 5);
    console.log('Sample Accesorii:', accesorii.map(a => a.title));
}

checkCategories();
