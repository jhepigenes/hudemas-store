
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedPendingReview() {
    const { data: products } = await supabase.from('products').select('id').limit(1);
    const { data: { users } } = await supabase.auth.admin.listUsers();
    
    if (!products || !users) return;

    await supabase.from('reviews').insert({
        product_id: products[0].id,
        user_id: users[0].id,
        author_name: 'Test User (Pending)',
        rating: 5,
        comment: 'This is a test review waiting for your approval. Please click the Green Check in the Admin Panel!',
        status: 'pending',
        is_verified: true
    });

    console.log('✅ Pending review seeded.');
}

seedPendingReview();
