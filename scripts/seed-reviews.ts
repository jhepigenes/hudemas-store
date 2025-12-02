
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedReviews() {
    console.log('Seeding reviews...');

    // 1. Get a few products
    const { data: products } = await supabase.from('products').select('id, title, image_url').limit(5);
    if (!products || products.length === 0) {
        console.error('No products found.');
        return;
    }

    // 2. Get Admin User ID (to own the reviews)
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const userId = users?.[0]?.id;

    if (!userId) {
        console.error('No users found.');
        return;
    }

    const reviews = [
        {
            product_id: products[0].id,
            user_id: userId,
            author_name: 'Elena Popa',
            rating: 5,
            comment: 'Absolut superb! Culorile sunt mult mai vibrante în realitate. A durat 3 săptămâni să îl termin, dar rezultatul merită fiecare secundă.',
            image_url: products[0].image_url, // Mocking "finished work" with product image
            status: 'approved',
            is_verified: true,
            created_at: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
        },
        {
            product_id: products[1].id,
            user_id: userId,
            author_name: 'Maria Ionescu',
            rating: 5,
            comment: 'Am comandat acest kit pentru mama mea. Diagrama este foarte clară și ața este de calitate superioară. Recomand cu drag!',
            status: 'approved',
            is_verified: true,
            created_at: new Date(Date.now() - 86400000 * 5).toISOString() // 5 days ago
        },
        {
            product_id: products[2].id,
            user_id: userId,
            author_name: 'Carmen D.',
            rating: 4,
            comment: 'Foarte frumos modelul. Livrarea a fost rapidă prin Easybox. Singura sugestie ar fi să includeți mai multă ață albă, am fost la limită.',
            status: 'approved',
            is_verified: true,
            created_at: new Date(Date.now() - 86400000 * 10).toISOString() // 10 days ago
        }
    ];

    const { error } = await supabase.from('reviews').insert(reviews);

    if (error) {
        console.error('Error seeding reviews:', error);
    } else {
        console.log('✅ Successfully seeded 3 approved reviews.');
    }
}

seedReviews();
