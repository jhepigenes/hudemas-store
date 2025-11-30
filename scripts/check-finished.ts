
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://msepwdbzrzqotapgesnd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZXB3ZGJ6cnpxb3RhcGdlc25kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzMjUyNywiZXhwIjoyMDc5OTA4NTI3fQ.hUpmhh7IkuiSHTlaf2zYUxT6F9mQyOnT-8QiQNbItD8";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFinished() {
    console.log('Checking for finished items...');
    const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('product_type', 'finished');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${data.length} finished items.`);
        data.forEach(item => console.log(`- ${item.title} (${item.status})`));
    }
}

checkFinished();
