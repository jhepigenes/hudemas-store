// API route to fetch customers securely via service role key
// This bypasses RLS so the Operations Center HTML can access customer data

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '1000');
        const offset = parseInt(searchParams.get('offset') || '0');
        const filter = searchParams.get('filter') || 'all';

        // Build query
        let query = supabase
            .from('customers')
            .select('*', { count: 'exact' })
            .order('total_spent', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (filter === 'b2b') query = query.eq('is_b2b', true);
        if (filter === 'international') query = query.eq('is_international', true);
        if (filter === 'vip_platinum') query = query.eq('ltv_tier', 'VIP_PLATINUM');
        if (filter === 'vip_gold') query = query.eq('ltv_tier', 'VIP_GOLD');
        if (filter === 'lapsed') query = query.eq('is_lapsed_vip', true);

        const { data, count, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            customers: data,
            total: count,
            limit,
            offset
        });

    } catch (error) {
        console.error('Customer fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customers', details: String(error) },
            { status: 500 }
        );
    }
}
