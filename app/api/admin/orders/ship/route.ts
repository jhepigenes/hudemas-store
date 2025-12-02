import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { resend } from '@/lib/resend';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderIds } = body;

        if (!orderIds || !Array.isArray(orderIds)) {
            return NextResponse.json({ error: 'Missing orderIds array' }, { status: 400 });
        }

        console.log(`Marking ${orderIds.length} orders as shipped...`);

        // 1. Update Status in Supabase
        const { data: updatedOrders, error: updateError } = await supabaseAdmin
            .from('orders')
            .update({ status: 'completed' })
            .in('id', orderIds)
            .select('*');

        if (updateError) {
            console.error('Database Update Error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // 2. Send Emails
        const results = await Promise.allSettled(updatedOrders.map(async (order) => {
            const email = order.customer_details?.email; // Assuming JSONB structure
            if (!email) return { id: order.id, status: 'skipped_no_email' };

            try {
                const subject = `Your Order #${order.id.slice(0, 8)} has Shipped!`;
                await resend.emails.send({
                    from: 'Hudemas Orders <orders@hudemas.ro>',
                    to: [email],
                    subject: subject,
                    html: `
                        <div style="font-family: sans-serif; color: #333;">
                            <h1>Good news!</h1>
                            <p>Your order <strong>#${order.id.slice(0, 8)}</strong> has been shipped.</p>
                            <p>You can expect it to arrive soon via ${order.shipping_method === 'easybox' ? 'Sameday Easybox' : 'FanCourier'}.</p>
                            <br/>
                            <p>Thank you for choosing Hudemas!</p>
                        </div>
                    `
                });

                // Log to DB
                await supabaseAdmin.from('sent_emails').insert({
                    recipient_email: email,
                    subject: subject,
                    body: 'Shipping Update (HTML)',
                    status: 'sent',
                    metadata: { order_id: order.id, type: 'shipping' }
                });

                return { id: order.id, status: 'sent' };
            } catch (emailError) {
                console.error(`Failed to send shipping email to ${email}:`, emailError);
                return { id: order.id, status: 'failed' };
            }
        }));

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error('Ship API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
