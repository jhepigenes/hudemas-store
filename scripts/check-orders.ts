
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrders() {
    console.log('Checking for recent orders...');

    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    if (orders && orders.length > 0) {
        console.log('Most recent order found:');
        console.log(JSON.stringify(orders[0], null, 2));

        const orderId = orders[0].id;
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);

        if (itemsError) {
            console.error('Error fetching items for order:', itemsError);
        } else {
            console.log('Order Items:');
            console.log(JSON.stringify(items, null, 2));
        }

    } else {
        console.log('No orders found.');
    }
}

checkOrders();
