import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedCoupons() {
    console.log('🌱 Seeding Coupons...');

    const coupons = [
        {
            code: 'WELCOME10',
            discount_type: 'percentage',
            discount_value: 10,
            min_order_amount: 0,
            expires_at: '2030-01-01T00:00:00Z'
        },
        {
            code: 'SAVE50',
            discount_type: 'fixed',
            discount_value: 50,
            min_order_amount: 200,
            expires_at: '2030-01-01T00:00:00Z'
        }
    ];

    const { error } = await supabase.from('coupons').upsert(coupons, { onConflict: 'code' });

    if (error) {
        console.error('Error seeding coupons:', error);
    } else {
        console.log('✅ Coupons created: WELCOME10 (10%), SAVE50 (50 RON off > 200)');
    }
}

seedCoupons();
