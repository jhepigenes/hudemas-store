
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkBucket() {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    console.log('Buckets:', buckets?.map(b => b.name));
    
    // Try to upload a test file to 'content'
    const { error: uploadError } = await supabase.storage
        .from('content')
        .upload('test.txt', 'test', { upsert: true });
        
    if (uploadError) {
        console.error('Upload to "content" failed:', uploadError.message);
    } else {
        console.log('Upload to "content" successful.');
    }
}

checkBucket();
