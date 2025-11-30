import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
                const { error: updateError } = await supabaseAdmin
                    .from('orders')
                    .update({ status: 'processing' }) // Or 'paid'
                    .eq('id', orderId);

                if (updateError) {
                    console.error(`❌ Failed to update order ${orderId}:`, updateError);
                } else {
                    console.log(`✅ Order ${orderId} marked as processing.`);

                    // Also update transactions if necessary
                    // Logic: Find transactions for this order's items?
                    // Better: The Create Order API already linked them.
                    // We can try to update transactions related to this order via a join or simpler logic if we stored order_id in transactions (we didn't, we stored listing_id).
                    // But since 'pending' transactions are created at order time, we might need a way to confirm them.
                    // For MVP, we trust the admin/seller dashboard will see the confirmed order and act.
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
