
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://msepwdbzrzqotapgesnd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZXB3ZGJ6cnpxb3RhcGdlc25kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzMjUyNywiZXhwIjoyMDc5OTA4NTI3fQ.hUpmhh7IkuiSHTlaf2zYUxT6F9mQyOnT-8QiQNbItD8";
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    console.log('Fetching distinct product_types and categories...');

    const { data: listings, error } = await supabase
        .from('marketplace_listings')
        .select('id, title, product_type, category');

    if (error) {
        console.error('Error fetching listings:', error);
        return;
    }

    const productTypes = new Set(listings.map(l => l.product_type));
    const categories = new Set(listings.map(l => l.category));

    console.log('Distinct Product Types:', Array.from(productTypes));
    console.log('Distinct Categories:', Array.from(categories));

    console.log('\nSample items by type:');
    const types = Array.from(productTypes);
    for (const type of types) {
        const sample = listings.find(l => l.product_type === type);
        console.log(`Type: ${type}, Sample: ${sample?.title} (Category: ${sample?.category})`);
    }

    console.log('\nChecking for "Frames" or "Rame":');
    const frames = listings.filter(l =>
        l.title.toLowerCase().includes('rama') ||
        l.title.toLowerCase().includes('frame') ||
        l.category?.toLowerCase().includes('rama') ||
        l.category?.toLowerCase().includes('frame')
    );

    console.log(`Found ${frames.length} potential frame items.`);
    frames.slice(0, 5).forEach(f => {
        console.log(`- ${f.title} (Type: ${f.product_type}, Category: ${f.category})`);
    });
}

inspectData();
