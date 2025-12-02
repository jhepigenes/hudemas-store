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

        // 2. Fetch Automation Config
        const { data: automation } = await supabaseAdmin
            .from('automations')
            .select('*')
            .eq('trigger_event', 'order_shipped')
            .single();

        if (automation && !automation.enabled) {
            console.log('Order shipped automation is disabled.');
            return NextResponse.json({ success: true, results: [], message: 'Status updated, emails disabled by automation settings' });
        }

        const subjectTemplate = automation?.config?.subject || "Your Order #{order_id} has Shipped!";
        const bodyTemplate = automation?.config?.body || "Good news! Your order #{order_id} has been shipped via {shipping_method}.";

        // 3. Send Emails
        const results = await Promise.allSettled(updatedOrders.map(async (order) => {
            const email = order.customer_details?.email;
            if (!email) return { id: order.id, status: 'skipped_no_email' };

            try {
                // Replace variables
                const subject = subjectTemplate.replace('{order_id}', order.id.slice(0, 8));
                let body = bodyTemplate
                    .replace('{order_id}', order.id.slice(0, 8))
                    .replace('{shipping_method}', order.shipping_method === 'easybox' ? 'Sameday Easybox' : 'FanCourier')
                    .replace('{tracking_number}', order.awb || 'N/A');

                // Wrap body in HTML template if it's plain text (simple check)
                if (!body.includes('<div')) {
                    body = `
                        <div style="font-family: sans-serif; color: #333;">
                            <h1>Good news!</h1>
                            <p>${body}</p>
                            <br/>
                            <p>Thank you for choosing Hudemas!</p>
                        </div>
                    `;
                }

                await resend.emails.send({
                    from: 'Hudemas Orders <orders@hudemas.ro>',
                    to: [email],
                    subject: subject,
                    html: body
                });

                // Log to DB
                await supabaseAdmin.from('sent_emails').insert({
                    recipient_email: email,
                    subject: subject,
                    body: 'Shipping Update (Automation)',
                    status: 'sent',
                    metadata: { order_id: order.id, type: 'shipping', automation_id: automation?.id }
                });

                return { id: order.id, status: 'sent' };
            } catch (emailError) {
                console.error(`Failed to send shipping email to ${email}:`, emailError);
                return { id: order.id, status: 'failed' };
            }
        }));

        return NextResponse.json({ success: true, results });

    } catch (error: unknown) {
        console.error('Ship API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
