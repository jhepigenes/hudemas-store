import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateFeedback() {
    try {
        // Path to the feedback file in the releases directory (sibling to hudemas-store)
        const jsonPath = path.join(__dirname, '../../releases/gemini_feedback_tasks (5).json');

        if (!fs.existsSync(jsonPath)) {
            console.error(`Feedback file not found at: ${jsonPath}`);
            process.exit(1);
        }

        const content = fs.readFileSync(jsonPath, 'utf8');
        const feedback = JSON.parse(content);

        console.log(`Read ${feedback.length} feedback items from ${jsonPath}`);

        const { data, error } = await supabase.storage
            .from('products')
            .upload('beta-feedback.json', JSON.stringify(feedback, null, 2), {
                contentType: 'application/json',
                upsert: true
            });

        if (error) {
            console.error('Upload failed:', error);
            process.exit(1);
        }

        console.log('Successfully updated beta-feedback.json in Supabase Storage.');
    } catch (error) {
        console.error('Script error:', error);
        process.exit(1);
    }
}

updateFeedback();
