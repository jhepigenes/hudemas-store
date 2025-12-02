import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanupTest() {
    console.log('🔍 Deleting test products...');

    // Delete where title contains 'test' (case insensitive)
    const { count: count1, error: error1 } = await supabase
        .from('products')
        .delete({ count: 'exact' })
        .ilike('title', '%test%');

    if (error1) console.error('Error deleting %test%:', error1);
    else console.log(`✅ Deleted ${count1} products matching '%test%'.`);

    // Delete where title is 'PRODUS'
    const { count: count2, error: error2 } = await supabase
        .from('products')
        .delete({ count: 'exact' })
        .eq('title', 'PRODUS');

    if (error2) console.error('Error deleting PRODUS:', error2);
    else console.log(`✅ Deleted ${count2} products named 'PRODUS'.`);
}

cleanupTest();