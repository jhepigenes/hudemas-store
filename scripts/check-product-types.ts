
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductTypes() {
    console.log('Checking product types and categories...');

    const { data, error } = await supabase
        .from('marketplace_listings')
        .select('product_type, category, title');

    if (error) {
        console.error('Error fetching listings:', error);
        return;
    }

    const summary = data.reduce((acc: any, item: any) => {
        const key = `${item.product_type} - ${item.category}`;
        if (!acc[key]) {
            acc[key] = { count: 0, examples: [] };
        }
        acc[key].count++;
        if (acc[key].examples.length < 3) {
            acc[key].examples.push(item.title);
        }
        return acc;
    }, {});

    console.log('Summary of Product Types and Categories:');
    console.table(summary);
}

checkProductTypes();
