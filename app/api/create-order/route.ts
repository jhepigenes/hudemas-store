import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customer, items, total, paymentMethod } = body;

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: any) {
                        cookieStore.set({ name, value, ...options });
                    },
                    remove(name: string, options: any) {
                        cookieStore.set({ name, value: '', ...options, expires: new Date(0) });
                    },
                },
            }
        );

        // 1. Generate Order ID
        const orderId = `ORD-${Math.floor(Math.random() * 1000000)}`;

        // 2. Insert Order into Supabase
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                id: orderId,
                user_email: customer.email,
                total_amount: total,
                status: 'pending',
                payment_method: paymentMethod,
                shipping_address: customer, // Store customer address as JSONB
            })
            .select()
            .single();

        if (orderError) {
            console.error('Supabase Order Insert Error:', orderError);
            throw orderError;
        }

        // 3. Insert Order Items into Supabase
        const orderItemsToInsert = items.map((item: any) => ({
            order_id: orderId,
            product_id: 1, // Placeholder: In a real app, match to a products table ID
            quantity: item.quantity,
            price_at_purchase: parseFloat(item.price.replace(',', '.')),
        }));

        const { error: orderItemsError } = await supabase
            .from('order_items')
            .insert(orderItemsToInsert);

        if (orderItemsError) {
            console.error('Supabase Order Items Insert Error:', orderItemsError);
            throw orderItemsError;
        }

        // 4. Simulate AWB Generation (FanCourier/Sameday) and insert into shipments table
        const courier = Math.random() > 0.5 ? 'FanCourier' : 'Sameday';
        const awbCode = `${courier.toUpperCase()}-${Math.floor(Math.random() * 100000000)}`;

        const { error: shipmentError } = await supabase
            .from('shipments')
            .insert({
                order_id: orderId,
                carrier: courier,
                awb_code: awbCode,
                status: 'generated',
                cost: 25.00, // Mock cost
            });
        
        if (shipmentError) {
            console.error('Supabase Shipment Insert Error:', shipmentError);
            // Don't throw, as order is already placed. Just log.
        }

        // 5. Simulate CRM/Email Notification (Console Log)
        console.log(`[CRM] New Order Received: ${orderId}`);
        console.log(`[EMAIL] Sending confirmation to ${customer.email}`);
        console.log(`[LOGISTICS] Generated AWB: ${awbCode} via ${courier}`);

        return NextResponse.json({ success: true, orderId, awb: awbCode });

    } catch (error) {
        console.error('Order creation failed:', error);
        return NextResponse.json({ success: false, error: 'Failed to process order' }, { status: 500 });
    }
}
