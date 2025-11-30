
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
    const { data, error } = await supabase
        .from('marketplace_listings')
        .select('status')
        .in('product_type', ['kit', 'accessory'])
    //.group('status') // Supabase JS client doesn't support group by easily like this, need rpc or manual grouping

    if (error) {
        console.error('Error:', error);
        return;
    }

    // Manual grouping
    const statusCounts: Record<string, number> = {};
    data.forEach((item: any) => {
        const status = item.status || 'null';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('Status counts:', statusCounts);
}

checkStatus();
