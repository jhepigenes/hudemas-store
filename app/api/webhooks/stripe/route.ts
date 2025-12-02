import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { resend } from '@/lib/resend';
import OrderConfirmationEmail from '@/app/components/emails/OrderConfirmation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    // apiVersion: '2023-10-16', // Use env or default
});

// This secret comes from the Stripe dashboard where you configure your webhook
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
    if (!endpointSecret) {
        console.error('⚠️ Stripe Webhook Secret is missing!');
        return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 });
    }

    const body = await req.text();
    const sig = (await headers()).get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`⚠️  Webhook signature verification failed.`, err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const orderId = paymentIntent.metadata.orderId;

            console.log(`💰 PaymentIntent succeeded for Order ID: ${orderId}`);

            if (orderId) {
                // Update Order Status
                const { data: order, error: updateError } = await supabaseAdmin
                    .from('orders')
                    .update({ status: 'processing' }) // Or 'paid'
                    .eq('id', orderId)
                    .select(`
                        *,
                        order_items (
                            *,
                            products (*)
                        )
                    `)
                    .single();

                if (updateError) {
                    console.error(`❌ Failed to update order ${orderId}:`, updateError);
                } else {
                    console.log(`✅ Order ${orderId} marked as processing.`);

                    // Send Confirmation Email
                    try {
                        if (order && paymentIntent.metadata.customer_email) {
                            const items = order.order_items.map((item: any) => ({
                                name: item.products?.title || 'Product',
                                quantity: item.quantity,
                                price: `${item.price.toFixed(2)} ${order.currency}`
                            }));

                            const shippingAddress = order.shipping_address || {}; // Assuming this is stored as JSONB

                            await resend.emails.send({
                                from: 'Hudemas Orders <orders@hudemas.ro>', // Ensure you verify this domain in Resend
                                to: [paymentIntent.metadata.customer_email],
                                subject: `Order Confirmation #${order.id.slice(0, 8)}`,
                                react: OrderConfirmationEmail({
                                    customerName: `${shippingAddress.firstName || 'Customer'} ${shippingAddress.lastName || ''}`.trim(),
                                    orderId: order.id,
                                    orderDate: new Date(order.created_at).toLocaleDateString(),
                                    totalAmount: `${order.total_amount.toFixed(2)} ${order.currency}`,
                                    items: items,
                                    shippingAddress: {
                                        street: shippingAddress.address || '',
                                        city: shippingAddress.city || '',
                                        state: shippingAddress.state || '',
                                        zip: shippingAddress.zipCode || '',
                                        country: shippingAddress.country || ''
                                    }
                                }),
                            });
                            console.log(`📧 Email sent to ${paymentIntent.metadata.customer_email}`);
                        }
                    } catch (emailError) {
                        console.error('❌ Failed to send email:', emailError);
                    }
                }
            }
            break;

        case 'payment_intent.payment_failed':
            const failedIntent = event.data.object as Stripe.PaymentIntent;
            console.log(`❌ Payment failed: ${failedIntent.last_payment_error?.message}`);
            // Optionally update order to 'cancelled' or 'payment_failed'
            if (failedIntent.metadata.orderId) {
                await supabaseAdmin.from('orders').update({ status: 'cancelled' }).eq('id', failedIntent.metadata.orderId);
            }
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
