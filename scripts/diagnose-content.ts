
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function diagnose() {
    console.log('--- DIAGNOSTICS ---');

    // 1. Check Accessories
    const { data: accessories } = await supabase
        .from('marketplace_listings')
        .select('id, title, image_url')
        .eq('product_type', 'accessory')
        .limit(5);
    
    console.log('Top 5 Accessories:', accessories);

    // 2. Check Latest Arrivals (Finished)
    const { data: latest } = await supabase
        .from('marketplace_listings')
        .select('id, title, image_url, created_at')
        .eq('product_type', 'finished')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('Top 5 Latest Arrivals:', latest);
}

diagnose();
