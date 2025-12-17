import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        // Get latest analytics run
        const { data, error } = await supabase
            .from('analytics_runs')
            .select('recommendations, run_at')
            .order('run_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ recommendations: [], run_at: null });
        }

        return NextResponse.json({
            recommendations: data.recommendations || [],
            run_at: data.run_at,
        });
    } catch (err) {
        console.error('Recommendations error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
