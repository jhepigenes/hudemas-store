
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'products';
const FILE_PATH = 'beta-feedback.json';

const IDS_TO_UPDATE = [
    '1764661214416', '1764655644083', '1764657069577', '1764663263198', 
    '1764616343888', '1764663652660', '1764661779616', '1764619879928', 
    '1764619640484', '1764619787749', '1764618869343', '1764616800541', 
    '1764616165547', '1764655850654'
];

async function updateFeedback() {
    try {
        console.log('Downloading feedback...');
        const { data, error } = await supabase.storage.from(BUCKET).download(FILE_PATH);
        
        if (error) throw error;

        const text = await data.text();
        let feedback = JSON.parse(text);
        
        console.log(`Found ${feedback.length} items.`);
        
        let updatedCount = 0;
        feedback = feedback.map(item => {
            if (IDS_TO_UPDATE.includes(item.id)) {
                if (item.status !== 'ready_for_review' && item.status !== 'done') {
                    console.log(`Updating ${item.id} (${item.section}) to ready_for_review`);
                    updatedCount++;
                    return { ...item, status: 'ready_for_review' };
                }
            }
            return item;
        });

        console.log(`Updated ${updatedCount} items.`);

        if (updatedCount > 0) {
            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(FILE_PATH, JSON.stringify(feedback, null, 2), {
                    contentType: 'application/json',
                    upsert: true
                });

            if (uploadError) throw uploadError;
            console.log('Successfully saved updated feedback.');
        } else {
            console.log('No changes needed.');
        }

    } catch (error) {
        console.error('Error updating feedback:', error);
    }
}

updateFeedback();
