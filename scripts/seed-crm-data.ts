
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://msepwdbzrzqotapgesnd.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZXB3ZGJ6cnpxb3RhcGdlc25kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzMjUyNywiZXhwIjoyMDc5OTA4NTI3fQ.hUpmhh7IkuiSHTlaf2zYUxT6F9mQyOnT-8QiQNbItD8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SAMPLE_CUSTOMERS = [
    {
        email: 'ana.popescu@example.com',
        firstName: 'Ana',
        lastName: 'Popescu',
        phone: '0744123456',
        customerType: 'individual',
        total: 450.00,
        items: [{ name: 'Goblen Peisaj Iarna', price: 450.00, quantity: 1 }]
    },
    {
        email: 'contact@artgallery.ro',
        firstName: 'Ion',
        lastName: 'Ionescu',
        companyName: 'Art Gallery SRL',
        phone: '0722987654',
        customerType: 'company',
        total: 1200.00,
        items: [{ name: 'Set Fire', price: 200.00, quantity: 6 }]
    },
    {
        email: 'maria.dumitru@example.com',
        firstName: 'Maria',
        lastName: 'Dumitru',
        phone: '0755112233',
        customerType: 'individual',
        total: 150.00,
        items: [{ name: 'Kit Incepator', price: 150.00, quantity: 1 }]
    }
];

async function seedCRM() {
    console.log('Seeding CRM data...');

    for (const customer of SAMPLE_CUSTOMERS) {
        console.log(`Creating order for ${customer.email}...`);

        const orderData = {
            total: customer.total,
            currency: 'RON',
            payment_method: 'card',
            shipping_method: 'courier',
            status: 'completed',
            customer_details: {
                email: customer.email,
                firstName: customer.firstName,
                lastName: customer.lastName,
                phone: customer.phone,
                companyName: customer.companyName,
                customerType: customer.customerType,
                address: 'Str. Principala nr. 1, Bucuresti'
            }
        };

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (orderError) {
            console.error(`Error creating order for ${customer.email}:`, orderError.message);
            continue;
        }

        console.log(`Order created: ${order.id}`);

        // Create order items
        const orderItems = customer.items.map(item => ({
            order_id: order.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            currency: 'RON'
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error(`Error creating items for order ${order.id}:`, itemsError.message);
        } else {
            console.log(`Items created for order ${order.id}`);
        }
    }

    console.log('Seeding complete.');
}

seedCRM();
