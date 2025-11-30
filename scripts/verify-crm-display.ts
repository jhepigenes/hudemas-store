
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://msepwdbzrzqotapgesnd.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZXB3ZGJ6cnpxb3RhcGdlc25kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzMjUyNywiZXhwIjoyMDc5OTA4NTI3fQ.hUpmhh7IkuiSHTlaf2zYUxT6F9mQyOnT-8QiQNbItD8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCRMDisplay() {
    console.log('Simulating CRM Page Logic...');

    // 1. Fetch Orders
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    console.log(`Fetched ${orders.length} orders.`);

    // 2. Process Orders into Customers (Logic from page.tsx)
    const customerMap = new Map();

    orders.forEach((order: any) => {
        // Extract email from customer_details (JSONB) or fallback to user_email
        const email = order.customer_details?.email || order.user_email;
        if (!email) return;

        const existing = customerMap.get(email);
        const orderDetails = order.customer_details || {};

        // Logic from page.tsx
        const firstName = orderDetails.firstName || orderDetails.first_name || '';
        const lastName = orderDetails.lastName || orderDetails.last_name || '';
        const fullName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || 'Guest');

        const name = fullName;
        const phone = orderDetails.phone;
        const companyName = orderDetails.companyName || orderDetails.company_name;
        const type = orderDetails.customerType || 'individual';

        if (existing) {
            existing.totalSpent += order.total;
            existing.orderCount += 1;
        } else {
            customerMap.set(email, {
                email,
                name,
                type: type === 'company' ? 'company' : 'individual',
                companyName,
                totalSpent: order.total,
                orderCount: 1,
                phone
            });
        }
    });

    // 3. Display Result
    console.log('\n--- CRM Customer List ---');
    const customers = Array.from(customerMap.values());

    if (customers.length === 0) {
        console.log("No customers found.");
    } else {
        customers.forEach(c => {
            console.log(`Customer: ${c.name} (${c.email})`);
            console.log(`  Type: ${c.type}`);
            if (c.companyName) console.log(`  Company: ${c.companyName}`);
            console.log(`  Total Spent: ${c.totalSpent} RON`);
            console.log(`  Orders: ${c.orderCount}`);
            console.log('---');
        });
    }
}

verifyCRMDisplay();
