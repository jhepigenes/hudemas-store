
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials (URL or SERVICE_ROLE_KEY)');
    console.log('Please ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedOrders() {
    console.log('Seeding Orders...');

    const orders = [
        {
            id: uuidv4(),
            user_id: null, // Guest
            total: 250.00,
            currency: 'RON',
            payment_method: 'cod',
            shipping_method: 'courier',
            status: 'pending',
            customer_details: {
                firstName: 'Ion',
                lastName: 'Popescu',
                email: 'ion.popescu@example.com',
                phone: '0722123456',
                city: 'Bucuresti',
                address: 'Str. Victoriei 1'
            },
            created_at: new Date().toISOString()
        },
        {
            id: uuidv4(),
            user_id: null,
            total: 120.50,
            currency: 'RON',
            payment_method: 'card',
            shipping_method: 'easybox',
            status: 'completed',
            customer_details: {
                firstName: 'Maria',
                lastName: 'Ionescu',
                email: 'maria.ionescu@example.com',
                phone: '0744111222',
                city: 'Cluj-Napoca',
                address: 'Str. Memorandumului 5'
            },
            created_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
        }
    ];

    for (const order of orders) {
        const { data, error } = await supabase
            .from('orders')
            .insert(order)
            .select()
            .single();

        if (error) {
            console.error('Error inserting order:', error.message);
        } else {
            console.log(`Inserted order: ${data.id}`);

            // Insert Order Items
            const items = [
                {
                    order_id: data.id,
                    product_id: 'prod_1',
                    name: 'Gobelin Kit - Peisaj de Toamna',
                    quantity: 1,
                    price: order.total,
                    currency: 'RON',
                    image_url: 'https://placehold.co/100'
                }
            ];

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(items);

            if (itemsError) {
                console.error('Error inserting items:', itemsError.message);
            } else {
                console.log('Inserted order items');
            }
        }
    }
}

async function main() {
    await seedOrders();
}

main();
