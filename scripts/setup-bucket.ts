import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupBucket() {
    console.log('Creating "marketplace" bucket...');
    const { data, error } = await supabase.storage.createBucket('marketplace', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
    });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log('✅ Bucket "marketplace" already exists.');
        } else {
            console.error('❌ Failed to create bucket:', error.message);
        }
    } else {
        console.log('✅ Bucket "marketplace" created successfully.');
    }
}

setupBucket();
