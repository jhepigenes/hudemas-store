
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

const finishedWorks = [
    {
        title: 'Sunset over the Danube',
        description: 'A beautiful hand-stitched gobelin depicting a sunset. Framed in oak.',
        price: 450.00,
        currency: 'EUR',
        status: 'active',
        product_type: 'finished',
        category: 'Landscape',
        image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb39279c23?q=80&w=1000&auto=format&fit=crop', // Painting/Art style sunset
        stock: 1
    },
    {
        title: 'Vintage Floral Arrangement',
        description: 'Intricate floral pattern, completed in 1998. Excellent condition.',
        price: 320.00,
        currency: 'EUR',
        status: 'active',
        product_type: 'finished',
        category: 'Still Life',
        image_url: 'https://images.unsplash.com/photo-1507643179173-61b049ed9430?q=80&w=1000&auto=format&fit=crop', // Floral art
        stock: 1
    },
    {
        title: 'Winter Cottage',
        description: 'Cozy winter scene. Perfect for holiday decoration.',
        price: 280.00,
        currency: 'EUR',
        status: 'active',
        product_type: 'finished',
        category: 'Landscape',
        image_url: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=1000&auto=format&fit=crop', // Winter painting
        stock: 1
    },
    {
        title: 'Portrait of a Lady',
        description: 'Classic portrait style gobelin. High stitch count.',
        price: 800.00,
        currency: 'EUR',
        status: 'active',
        product_type: 'finished',
        category: 'Portrait',
        image_url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=1000&auto=format&fit=crop', // Classic portrait
        stock: 1
    }
];

async function seedFinishedWorks() {
    console.log('Seeding finished works...');

    // Get a user ID to associate with these listings (using the first user found)
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError || !users.users.length) {
        console.error('Error fetching users or no users found:', userError);
        return;
    }

    const userId = users.users[0].id;
    console.log(`Assigning listings to user ID: ${userId}`);

    // Ensure user is in artists table
    const { error: artistError } = await supabase
        .from('artists')
        .upsert({ id: userId, full_name: 'Mock Artist', status: 'approved' }, { onConflict: 'id' });

    if (artistError) {
        console.error('Error ensuring artist exists:', artistError);
        return;
    }

    const listingsWithUser = finishedWorks.map(item => ({
        ...item,
        user_id: userId,
        artist_id: userId // Assuming the seller is the artist for these mock items
    }));

    const { data, error } = await supabase
        .from('marketplace_listings')
        .insert(listingsWithUser)
        .select();

    if (error) {
        console.error('Error inserting listings:', error);
    } else {
        console.log(`Successfully inserted ${data.length} finished works.`);
    }
}

seedFinishedWorks();
