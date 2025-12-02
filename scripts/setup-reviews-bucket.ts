
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupBucket() {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.find(b => b.name === 'reviews');

    if (!exists) {
        const { error } = await supabase.storage.createBucket('reviews', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
        });
        if (error) console.error('Error creating bucket:', error);
        else console.log('✅ Reviews bucket created.');
    } else {
        console.log('✅ Reviews bucket already exists.');
    }
}

setupBucket();
