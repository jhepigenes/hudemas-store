import { NextResponse } from 'next/server';
import { runAnalytics, sendEmailDigest } from '@/lib/analytics/engine';

// Verify cron secret for Vercel cron jobs
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
    try {
        // Verify this is from Vercel cron or has correct secret
        const authHeader = request.headers.get('authorization');
        if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🔄 Starting scheduled analytics run...');

        // Run TypeScript analytics engine
        const result = await runAnalytics(7); // Last 7 days

        // Send email digest
        const emailSent = await sendEmailDigest(result);

        // Count delivery issues for monitoring
        const criticalIssues = result.delivery_issues?.filter(i => i.severity === 'CRITICAL').length || 0;
        const warningIssues = result.delivery_issues?.filter(i => i.severity === 'WARNING').length || 0;

        return NextResponse.json({
            success: true,
            message: 'Analytics run completed',
            timestamp: new Date().toISOString(),
            summary: result.summary,
            delivery_issues: {
                critical: criticalIssues,
                warning: warningIssues,
                total: result.delivery_issues?.length || 0,
            },
            emailSent,
        });
    } catch (err) {
        console.error('Cron error:', err);
        return NextResponse.json(
            { error: 'Cron job failed', details: String(err) },
            { status: 500 }
        );
    }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
    return GET(request);
}
