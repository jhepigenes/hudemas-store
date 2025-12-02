import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { resend } from '@/lib/resend';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('subscribers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Simple Campaign Sender (Batching is simple here, for large scale use queues)
export async function POST(request: Request) {
    try {
        const { subject, body, recipients } = await request.json(); // recipients = 'all' or array of emails

        if (!subject || !body) {
            return NextResponse.json({ error: 'Missing subject or body' }, { status: 400 });
        }

        let emailsToSend: string[] = [];

        if (recipients === 'all') {
            const { data } = await supabaseAdmin.from('subscribers').select('email').eq('status', 'subscribed');
            if (data) emailsToSend = data.map(s => s.email);
        } else if (Array.isArray(recipients)) {
            emailsToSend = recipients;
        }

        if (emailsToSend.length === 0) {
            return NextResponse.json({ message: 'No recipients found' });
        }

        // Send in batches of 50 (Resend limit is 100/batch usually, safe side)
        // Actually Resend 'batch' API is different. Simple loop for now or single call if Resend supports multiple 'to'?
        // Resend 'to' array sends ONE email to MANY people (visible to all if not BCC).
        // We want INDIVIDUAL emails.
        // We will use a loop with Promise.all for small batches.

        const batchSize = 20;
        const results = [];

        for (let i = 0; i < emailsToSend.length; i += batchSize) {
            const batch = emailsToSend.slice(i, i + batchSize);
            
            const promises = batch.map(email => 
                resend.emails.send({
                    from: 'Hudemas Newsletter <newsletter@hudemas.ro>',
                    to: email,
                    subject: subject,
                    html: `<div style="font-family: sans-serif; color: #333;">${body}</div>
                           <br/>
                           <p style="font-size: 12px; color: #999;">
                             <a href="https://hudemas.ro/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a>
                           </p>`
                })
            );

            const batchResults = await Promise.allSettled(promises);
            results.push(...batchResults);
        }

        const successCount = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;

        return NextResponse.json({ success: true, sent: successCount, total: emailsToSend.length });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
