import { createClient } from '@/lib/supabase-admin';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { recipient, subject, body, orderId } = await request.json();

        if (!recipient || !subject || !body) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Send via Resend
        const { data, error } = await resend.emails.send({
            from: 'Hudemas <orders@hudemas.ro>',
            to: [recipient],
            subject: subject,
            html: body.replace(/\n/g, '<br>') // Simple text to HTML
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        // Log to DB
        const { error: dbError } = await createClient()
            .from('sent_emails')
            .insert({
                recipient_email: recipient,
                subject,
                body,
                status: 'sent',
                metadata: orderId ? { order_id: orderId } : null
            });

        if (dbError) {
            console.error('DB log error:', dbError);
            // We don't fail the request if logging fails, but we log it
        }

        return NextResponse.json({ success: true, id: data?.id });
    } catch (e) {
        console.error('Email send handler error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
