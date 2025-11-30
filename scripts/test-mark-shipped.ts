
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMarkShipped() {
    console.log('Fetching most recent pending order...');

    // 1. Get a pending order
    const { data: orders, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

    if (fetchError) {
        console.error('Error fetching orders:', fetchError);
        return;
    }

    if (!orders || orders.length === 0) {
        console.log('No pending orders found to test.');
        return;
    }

    const order = orders[0];
    console.log(`Found pending order: ${order.id}`);

    // 2. Mark as shipped (completed)
    console.log('Marking as shipped...');
    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id);

    if (updateError) {
        console.error('Error updating order:', updateError);
        return;
    }

    console.log('Update command sent.');

    // 3. Verify status
    const { data: updatedOrder, error: verifyError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', order.id)
        .single();

    if (verifyError) {
        console.error('Error verifying update:', verifyError);
        return;
    }

    if (updatedOrder.status === 'completed') {
        console.log('SUCCESS: Order status is now "completed".');
    } else {
        console.error(`FAILURE: Order status is "${updatedOrder.status}".`);
    }
}

testMarkShipped();
