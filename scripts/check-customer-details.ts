
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTable() {
    const { error } = await supabase
        .from('customer_details')
        .select('*')
        .limit(1);

    if (error) {
        console.log('Error accessing customer_details:', error);
    } else {
        console.log('customer_details table exists and is accessible.');
    }
}

checkTable();
