
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteBrokenListing() {
    const idToDelete = '88b143f5-33ef-4483-a344-799e9076aef7';
    console.log(`Deleting listing with ID: ${idToDelete}...`);

    const { error } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('id', idToDelete);

    if (error) {
        console.error('Error deleting listing:', error);
    } else {
        console.log('Successfully deleted broken listing.');
    }
}

deleteBrokenListing();
