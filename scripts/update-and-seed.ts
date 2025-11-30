
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://msepwdbzrzqotapgesnd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZXB3ZGJ6cnpxb3RhcGdlc25kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzMjUyNywiZXhwIjoyMDc5OTA4NTI3fQ.hUpmhh7IkuiSHTlaf2zYUxT6F9mQyOnT-8QiQNbItD8";
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAndSeed() {
    console.log('Starting database updates...');

    // 1. Update Frames to be 'accessory'
    console.log('Updating Frames to product_type = "accessory"...');
    const { error: updateError } = await supabase
        .from('marketplace_listings')
        .update({ product_type: 'accessory' })
        .ilike('title', '%rame%'); // Matching "Gherghef ... Tip Rama"

    if (updateError) {
        console.error('Error updating frames:', updateError);
    } else {
        console.log('Frames updated successfully.');
    }

    // Also update items with category 'Accesorii' just in case
    const { error: updateError2 } = await supabase
        .from('marketplace_listings')
        .update({ product_type: 'accessory' })
        .eq('category', 'Accesorii');

    if (updateError2) {
        console.error('Error updating accessories:', updateError2);
    } else {
        console.log('Accessories updated successfully.');
    }


    // 2. Seed Finished Works
    console.log('Seeding Finished Works...');
    const finishedWorks = [
        {
            title: 'Sunset over the Danube',
            description: 'A beautiful hand-stitched Gobelin depicting a serene sunset.',
            price: 1200,
            currency: 'RON',
            category: 'Landscape',
            product_type: 'finished',
            status: 'active',
            image_url: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800&q=80',
            artist_id: null // Assuming no specific artist for now, or we can fetch one
        },
        {
            title: 'Vintage Floral Bouquet',
            description: 'Intricate floral design with vibrant colors.',
            price: 850,
            currency: 'RON',
            category: 'Still Life',
            product_type: 'finished',
            status: 'active',
            image_url: 'https://images.unsplash.com/photo-1462275646964-a0e338679c1e?w=800&q=80',
            artist_id: null
        },
        {
            title: 'Portrait of a Lady',
            description: 'Classic portrait style Gobelin, framed.',
            price: 2500,
            currency: 'RON',
            category: 'Portrait',
            product_type: 'finished',
            status: 'active',
            image_url: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=800&q=80',
            artist_id: null
        }
    ];

    // Get a valid artist ID if possible, otherwise insert without
    const { data: artists } = await supabase.from('artists').select('id').limit(1);
    const artistId = artists && artists.length > 0 ? artists[0].id : null;

    // Get a valid user ID from profiles
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    const userId = profiles && profiles.length > 0 ? profiles[0].id : null;

    if (!userId) {
        console.error('No user found in profiles table. Cannot seed listings without a user_id.');
        return;
    }

    const worksWithArtist = finishedWorks.map(w => ({ ...w, artist_id: artistId, user_id: userId }));

    const { error: insertError } = await supabase
        .from('marketplace_listings')
        .insert(worksWithArtist);

    if (insertError) {
        console.error('Error seeding finished works:', insertError);
    } else {
        console.log('Finished works seeded successfully.');
    }
}

updateAndSeed();
