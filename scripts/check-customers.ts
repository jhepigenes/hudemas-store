
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://msepwdbzrzqotapgesnd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZXB3ZGJ6cnpxb3RhcGdlc25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzI1MjcsImV4cCI6MjA3OTkwODUyN30.Ys09sv3Kkg9SksiV4W5ajhjoF65fQlFogGN8et0ePWA";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOrders() {
    console.log('Checking orders in Supabase (using Anon Key)...');

    // Check public.orders
    console.log('Fetching orders...');
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total, customer_details, created_at');

    if (ordersError) {
        console.error('Error fetching orders:', ordersError.message);
    } else {
        console.log(`Found ${orders?.length || 0} records in orders`);
        if (orders && orders.length > 0) {
            orders.forEach(o => {
                console.log(`Order ${o.id}:`);
                console.log(` - Total: ${o.total}`);
                console.log(` - Created: ${o.created_at}`);
                console.log(` - Customer Details:`, JSON.stringify(o.customer_details, null, 2));
            });
        }
    }
}

checkOrders();
