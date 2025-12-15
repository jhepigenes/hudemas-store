import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client (bypasses RLS)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/customers/update
// Updates customer geo data in Supabase
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, geo_lat, geo_lon, geo_confidence, address_quality_score } = body;

        if (!id) {
            return NextResponse.json({
                success: false,
                error: 'Customer ID required'
            }, { status: 400 });
        }

        // Build update object with only provided fields
        const updates: Record<string, unknown> = {};
        if (geo_lat !== undefined) updates.geo_lat = geo_lat;
        if (geo_lon !== undefined) updates.geo_lon = geo_lon;
        if (geo_confidence !== undefined) updates.geo_confidence = geo_confidence;
        if (address_quality_score !== undefined) updates.address_quality_score = address_quality_score;
        updates.updated_at = new Date().toISOString();

        // Update customer in Supabase
        const { data, error } = await supabase
            .from('customers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            customer: data
        });

    } catch (e) {
        console.error('Customer update error:', e);
        return NextResponse.json({
            success: false,
            error: 'Update failed'
        }, { status: 500 });
    }
}
