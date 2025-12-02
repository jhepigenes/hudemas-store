import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

        console.log(`Processing refund for order: ${orderId}`);

        // 1. Get Order to find Payment Intent
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (!order.payment_intent_id) {
            return NextResponse.json({ error: 'No Payment Intent linked to this order (COD or legacy).' }, { status: 400 });
        }

        // 2. Process Refund with Stripe
        try {
            const refund = await stripe.refunds.create({
                payment_intent: order.payment_intent_id,
            });

            console.log('Stripe Refund Success:', refund.id);

            // 3. Update Supabase
            const { error: updateError } = await supabaseAdmin
                .from('orders')
                .update({ status: 'refunded' }) // Or 'cancelled'
                .eq('id', orderId);

            if (updateError) throw updateError;

            return NextResponse.json({ success: true, refundId: refund.id });

        } catch (stripeError: any) {
            console.error('Stripe Refund Error:', stripeError);
            return NextResponse.json({ error: stripeError.message }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Refund API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
