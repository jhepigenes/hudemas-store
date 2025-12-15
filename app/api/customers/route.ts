import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/customers - Search and filter customers
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q') || searchParams.get('search'); // Support both
    const ltv_tier = searchParams.get('ltv_tier');
    const is_b2b = searchParams.get('is_b2b');
    const is_lapsed_vip = searchParams.get('is_lapsed_vip');
    const is_international = searchParams.get('is_international');
    const recency_tier = searchParams.get('recency_tier');
    const locality = searchParams.get('locality');
    const state = searchParams.get('state');
    const has_email = searchParams.get('has_email');
    const has_phone = searchParams.get('has_phone');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let dbQuery = supabase
        .from('customers')
        .select('*', { count: 'exact' });

    // Text search across name, email, phone, locality
    if (query) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,locality.ilike.%${query}%`);
    }

    // Filter by LTV tier
    if (ltv_tier) {
        dbQuery = dbQuery.eq('ltv_tier', ltv_tier);
    }

    // Filter by B2B
    if (is_b2b === 'true') {
        dbQuery = dbQuery.eq('is_b2b', true);
    }

    // Filter by lapsed VIP
    if (is_lapsed_vip === 'true') {
        dbQuery = dbQuery.eq('is_lapsed_vip', true);
    }

    // Filter by international
    if (is_international === 'true') {
        dbQuery = dbQuery.eq('is_international', true);
    }

    // Filter by recency tier
    if (recency_tier) {
        dbQuery = dbQuery.eq('recency_tier', recency_tier);
    }

    // Filter by locality
    if (locality) {
        dbQuery = dbQuery.ilike('locality', `%${locality}%`);
    }

    // Filter by state/county
    if (state) {
        dbQuery = dbQuery.ilike('state', `%${state}%`);
    }

    // Filter by having email
    if (has_email === 'true') {
        dbQuery = dbQuery.not('email', 'is', null).neq('email', '');
    }

    // Filter by having phone
    if (has_phone === 'true') {
        dbQuery = dbQuery.not('phone', 'is', null).neq('phone', '');
    }

    // Pagination
    dbQuery = dbQuery
        .order('total_spent', { ascending: false })
        .range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        customers: data,
        total: count,
        limit,
        offset
    });
}

// POST /api/customers - Upsert single customer
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Check for B2B indicators in name
        const b2bPatterns = /\b(srl|s\.r\.l|sa|s\.a|pfa|p\.f\.a|ltd|gmbh|inc|llc|company|firma)\b/i;
        const is_b2b = b2bPatterns.test(body.name || '');

        const customerData = {
            ...body,
            is_b2b,
            updated_at: new Date().toISOString()
        };

        // Upsert based on legacy_id or email
        const { data, error } = await supabase
            .from('customers')
            .upsert(customerData, {
                onConflict: 'legacy_id',
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ customer: data, message: 'Customer saved' });
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
