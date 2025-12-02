import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin, getGuestUserId } from '@/lib/supabase-admin';
import { resend } from '@/lib/resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    // apiVersion: '2025-02-24.acacia', // Use default
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customer, items, total, paymentMethod, shippingMethod, customerType, userId, couponCode } = body;
        console.log('Received order request:', { customer, itemsCount: items?.length, total, paymentMethod, userId, couponCode });

        let finalUserId = userId;

        // 1. Handle Guest User for Marketplace Logic
        const hasMarketplaceItems = items.some((item: any) => item.type === 'marketplace' || item.artist_id);

        if (!finalUserId && hasMarketplaceItems) {
            try {
                finalUserId = await getGuestUserId();
            } catch (e) {
                console.error('Failed to get guest user ID', e);
            }
        }

        // 2. Calculate Totals
        // Assuming total is in RON
        const shippingCost = shippingMethod === 'easybox' ? 12 : 19;
        const orderTotal = total + shippingCost;
        const amountInCents = Math.round(orderTotal * 100);

        // 3. Create Order in Supabase (FIRST)
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: finalUserId || null,
                total: orderTotal,
                currency: items[0]?.currency || 'RON',
                payment_method: paymentMethod,
                payment_intent_id: null, // Will update later
                shipping_method: shippingMethod,
                customer_details: { ...customer, customerType },
                status: paymentMethod === 'card' ? 'pending_payment' : 'pending'
            })
            .select()
            .single();

        if (orderError) {
            console.error('Error creating order:', orderError);
            return NextResponse.json({ error: orderError.message }, { status: 500 });
        }

        // 4. Create Order Items
        const orderItems = items.map((item: any) => ({
            order_id: order.id,
            product_id: item.id || 'N/A',
            name: item.name,
            quantity: item.quantity,
            price: typeof item.price === 'string' ? parseFloat(item.price.replace(',', '.')) : Number(item.price),
            currency: item.currency,
            image_url: item.image
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Error creating order items:', itemsError);
            // Should probably rollback order here in real prod, but skipping for now
            return NextResponse.json({ error: itemsError.message }, { status: 500 });
        }

        // 5. Create Marketplace Transactions (Commission Logic)
        const marketplaceItems = items.filter((item: any) => item.type === 'marketplace' || item.artist_id);

        if (marketplaceItems.length > 0 && finalUserId) {
            const transactions = marketplaceItems.map((item: any) => ({
                listing_id: item.id,
                buyer_id: finalUserId,
                seller_id: item.artist_id,
                amount: typeof item.price === 'string' ? parseFloat(item.price.replace(',', '.')) : Number(item.price),
                status: 'pending'
            }));

            const validTransactions = transactions.filter((t: any) => t.listing_id && t.seller_id);

            if (validTransactions.length > 0) {
                const { error: transError } = await supabaseAdmin
                    .from('transactions')
                    .insert(validTransactions);

                if (transError) console.error('Error creating marketplace transactions:', transError);
            }
        }

        // 6. Track Purchase Event (Async)
        (async () => {
            try {
                await supabaseAdmin.from('analytics_events').insert({
                    event_name: 'purchase',
                    user_id: finalUserId || null,
                    data: {
                        order_id: order.id,
                        total: orderTotal,
                        items_count: items.length,
                        currency: items[0]?.currency || 'RON'
                    },
                    user_agent: request.headers.get('user-agent') || 'server',
                    url: request.headers.get('referer') || ''
                });
            } catch (e) {
                console.error('Failed to track purchase event:', e);
            }
        })();

        // 7. Send Confirmation Email (Async, don't block)
        (async () => {
            try {
                const subject = `Order Confirmation #${order.id.slice(0, 8)}`;
                const htmlBody = `
                        <div style="font-family: sans-serif; color: #333;">
                            <h1>Thank you for your order!</h1>
                            <p>We have received your order <strong>#${order.id.slice(0, 8)}</strong>.</p>
                            <p>Total: <strong>${orderTotal.toFixed(2)} RON</strong></p>
                            <p>Payment Method: ${paymentMethod === 'card' ? 'Card (Pending)' : 'Cash on Delivery'}</p>
                            <br/>
                            <h3>Items:</h3>
                            <ul>
                                ${orderItems.map((item: any) => `<li>${item.quantity}x ${item.name}</li>`).join('')}
                            </ul>
                            <br/>
                            <p>We will notify you when your order ships.</p>
                        </div>
                    `;

                await resend.emails.send({
                    from: 'Hudemas Orders <orders@hudemas.ro>',
                    to: [customer.email],
                    subject: subject,
                    html: htmlBody
                });

                // Log to DB
                await supabaseAdmin.from('sent_emails').insert({
                    recipient_email: customer.email,
                    subject: subject,
                    body: 'Order Confirmation (HTML)', // Storing full HTML might be heavy, maybe just summary
                    status: 'sent',
                    metadata: { order_id: order.id, type: 'confirmation' }
                });

            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
            }
        })();

        // 7. Stripe Payment Intent Creation (if Card)
        let clientSecret = null;

        if (paymentMethod === 'card') {
            if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
                console.warn('Stripe keys are missing or placeholders.');
                return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
            }

            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amountInCents,
                    currency: 'ron',
                    automatic_payment_methods: { enabled: true },
                    metadata: {
                        orderId: order.id, // Critical for Webhook
                        customer_email: customer.email,
                    }
                });

                clientSecret = paymentIntent.client_secret;

                // Update Order with PaymentIntent ID
                await supabaseAdmin
                    .from('orders')
                    .update({ payment_intent_id: paymentIntent.id })
                    .eq('id', order.id);

            } catch (stripeError: any) {
                console.error('Stripe Error:', stripeError);
                return NextResponse.json({ error: stripeError.message }, { status: 500 });
            }
        }

        // 8. Handle Coupon Usage
        if (couponCode) {
            const { error: couponError } = await supabaseAdmin.rpc('increment_coupon_usage', { coupon_code: couponCode });

            // Fallback if RPC doesn't exist (try direct update)
            if (couponError) {
                console.warn('RPC increment_coupon_usage failed, trying direct update', couponError);
                const { data: coupon } = await supabaseAdmin.from('coupons').select('id, used_count').eq('code', couponCode).single();
                if (coupon) {
                    await supabaseAdmin.from('coupons').update({ used_count: (coupon.used_count || 0) + 1 }).eq('id', coupon.id);
                }
            }
        }

        return NextResponse.json({
            success: true,
            orderId: order.id,
            clientSecret
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
