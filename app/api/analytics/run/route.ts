import { NextRequest, NextResponse } from 'next/server';
import { runAnalytics, sendEmailDigest } from '@/lib/analytics/engine';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const days = body.days || 7;
        const sendEmail = body.sendEmail || false;

        console.log(`🔄 Manual analytics run triggered (days: ${days}, email: ${sendEmail})`);

        // Run TypeScript analytics engine
        const result = await runAnalytics(days);

        // Optionally send email
        let emailSent = false;
        if (sendEmail) {
            emailSent = await sendEmailDigest(result);
        }

        return NextResponse.json({
            success: true,
            message: 'Analytics run completed',
            timestamp: new Date().toISOString(),
            summary: result.summary,
            recommendations: result.recommendations.length,
            emailSent,
        });
    } catch (err) {
        console.error('Run error:', err);
        return NextResponse.json(
            { error: 'Failed to run analytics', details: String(err) },
            { status: 500 }
        );
    }
}
