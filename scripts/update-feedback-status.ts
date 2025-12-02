
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = 'products';
const FILE_PATH = 'beta-feedback.json';

const TARGET_IDS = [
    '1764619879928', // error saving customer (General)
    '1764619787749', // broken link
    '1764619640484', // error saving customer (Admin)
    '1764618869343', // pending payment / AWB
    '1764616800541', // account not editable / invoices
    '1764616343888', // cursor / rubberband
    '1764616165547'  // onboarding
];

async function updateFeedback() {
    console.log('Fetching feedback...');
    const { data, error } = await supabase.storage.from(BUCKET).download(FILE_PATH);
    
    if (error) {
        console.error('Error fetching feedback:', error);
        return;
    }

    const text = await data.text();
    let feedbackList = JSON.parse(text);
    let updatedCount = 0;

    feedbackList = feedbackList.map(item => {
        if (TARGET_IDS.includes(item.id)) {
            updatedCount++;
            return { ...item, status: 'ready_for_review' };
        }
        return item;
    });

    if (updatedCount > 0) {
        console.log(`Updating ${updatedCount} items to 'ready_for_review'...`);
        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(FILE_PATH, JSON.stringify(feedbackList, null, 2), {
                contentType: 'application/json',
                upsert: true
            });

        if (uploadError) {
            console.error('Error uploading feedback:', uploadError);
        } else {
            console.log('Successfully updated feedback statuses.');
        }
    } else {
        console.log('No matching feedback items found to update.');
    }
}

updateFeedback();
