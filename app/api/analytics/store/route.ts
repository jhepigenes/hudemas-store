import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { run_at, summary, attribution, recommendations } = body;

        if (!run_at || !summary) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Store analytics run
        const { error } = await supabase
            .from('analytics_runs')
            .insert({
                run_at,
                summary,
                attribution,
                recommendations,
            });

        if (error) {
            console.error('Insert error:', error);
            return NextResponse.json(
                { error: 'Failed to store analytics' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, run_at });
    } catch (err) {
        console.error('Store error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
