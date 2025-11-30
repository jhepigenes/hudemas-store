import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function debugMarketplace() {
    console.log('🔍 Debugging Marketplace Listings...');

    // 1. Count Listings
    const { count, error: countError } = await supabase
        .from('marketplace_listings')
        .select('*', { count: 'exact', head: true });
    
    if (countError) {
        console.error('❌ Error counting listings:', countError.message);
        return;
    }
    console.log(`📊 Total Listings in DB: ${count}`);

    // 2. Fetch Latest Listings
    const { data: listings, error: fetchError } = await supabase
        .from('marketplace_listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (fetchError) {
        console.error('❌ Error fetching listings:', fetchError.message);
        return;
    }

    if (listings.length === 0) {
        console.warn('⚠️ No listings found. The table is empty.');
    } else {
        console.log('📝 Latest 5 Listings:');
        listings.forEach(l => {
            console.log(` - [${l.status}] ${l.title} (ID: ${l.id})`);
        });
    }
}

debugMarketplace();
