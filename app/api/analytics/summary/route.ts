import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase admin client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        // Get latest analytics run from Supabase
        const { data, error } = await supabase
            .from('analytics_runs')
            .select('*')
            .order('run_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching analytics:', error);
            return NextResponse.json(
                { error: 'Failed to fetch analytics' },
                { status: 500 }
            );
        }

        // If no data, return empty summary
        if (!data) {
            return NextResponse.json({
                summary: {
                    total_orders: 0,
                    total_revenue: 0,
                    total_customers: 0,
                    meta_spend: 0,
                    meta_purchases: 0,
                    meta_cpa: 0,
                    meta_roas: 0,
                    meta_impressions: 0,
                    meta_clicks: 0,
                    critical_alerts: 0,
                    high_priority_actions: 0,
                },
                attribution: null,
                campaigns: [],
                trends: [],
                recommendations: [],
                run_at: null,
                status: 'no_data',
            });
        }

        return NextResponse.json({
            summary: data.summary,
            attribution: data.attribution,
            campaigns: data.campaigns || [],
            trends: data.trends || [],
            recommendations: data.recommendations || [],
            run_at: data.run_at,
            status: 'ok',
        });
    } catch (err) {
        console.error('Analytics summary error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
