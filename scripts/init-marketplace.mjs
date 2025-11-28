import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function initMarketplace() {
  console.log('Initializing Marketplace...');

  // Create Storage Bucket
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Error listing buckets:', listError);
  } else {
    const bucketName = 'marketplace';
    const existingBucket = buckets.find(b => b.name === bucketName);

    if (!existingBucket) {
      console.log(`Creating bucket: ${bucketName}`);
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
      });
      if (error) console.error('Error creating bucket:', error);
      else console.log('Bucket created successfully.');
    } else {
      console.log(`Bucket '${bucketName}' already exists.`);
    }
  }

  console.log('Setup complete. Ensure SQL schema is applied for tables.');
}

initMarketplace();
