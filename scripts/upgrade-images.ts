
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Adjust path to point to the root extracted_images
const IMAGES_DIR = path.join(process.cwd(), '../extracted_images/images/products/large');

async function upgradeImages() {
    if (!fs.existsSync(IMAGES_DIR)) {
        console.error('Images directory not found:', IMAGES_DIR);
        return;
    }

    const files = fs.readdirSync(IMAGES_DIR).filter(f => f.toLowerCase().endsWith('.jpg'));
    console.log(`Found ${files.length} high-res images.`);

    let updatedCount = 0;
    let errorCount = 0;

    // Process all files (or a limit)
    for (const file of files) {
        try {
            const filePath = path.join(IMAGES_DIR, file);
            const fileBuffer = fs.readFileSync(filePath);

            // 1. Upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(file, fileBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) {
                console.error(`❌ Upload failed ${file}:`, uploadError.message);
                errorCount++;
                continue;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(file);

            // 3. Update Database
            // Match ANY product that has this filename at the end of its image_url
            // Old URL format: .../goblen-hudemas-023-vaza-cu-flori-526.jpg
            const { error: updateError, count } = await supabase
                .from('products')
                .update({ image_url: publicUrl })
                .ilike('image_url', `%/${file}`); // Robust matching

            if (updateError) {
                console.error(`❌ DB Update failed ${file}:`, updateError.message);
                errorCount++;
            } else if (count === 0) {
                // console.log(`⚠️ No matching product found for ${file}`);
            } else {
                updatedCount++;
                if (updatedCount % 10 === 0) console.log(`✅ Upgraded ${updatedCount} images...`);
            }

        } catch (e) {
            console.error(`🔥 Exception ${file}:`, e);
            errorCount++;
        }
    }

    console.log(`\nJob Complete.`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
}

upgradeImages();
