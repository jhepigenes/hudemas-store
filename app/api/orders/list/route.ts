// API route to fetch orders from Supabase (with fallback to legacy)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LEGACY_SYNC_URL = process.env.LEGACY_SYNC_URL?.replace('customer_sync.php', 'order_sync.php')
    || 'https://www.hudemas.ro/assets/order_sync.php';
const LEGACY_SYNC_SECRET = process.env.LEGACY_SYNC_SECRET || '6f35b97e06a1585ee8daa975d7d86ed3';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const source = searchParams.get('source') || 'legacy'; // 'legacy' or 'supabase'
        const action = searchParams.get('action') || 'recent';
        const days = searchParams.get('days') || '7';
        const limit = searchParams.get('limit') || '100';
        const offset = searchParams.get('offset') || '0';

        // For now, primary source is legacy (Supabase orders table not yet populated)
        if (source === 'legacy') {
            const legacyUrl = `${LEGACY_SYNC_URL}?action=${action}&days=${days}&limit=${limit}&offset=${offset}&secret=${LEGACY_SYNC_SECRET}`;

            const res = await fetch(legacyUrl, {
                headers: { 'Accept': 'application/json' },
                next: { revalidate: 60 } // Cache for 1 minute
            });

            if (!res.ok) {
                throw new Error(`Legacy API returned ${res.status}`);
            }

            const data = await res.json();
            return NextResponse.json({
                ...data,
                source: 'legacy'
            });
        }

        // Supabase source (for when orders table is populated)
        let query = supabase
            .from('orders')
            .select('*', { count: 'exact' })
            .is('deleted_at', null) // Exclude cancelled orders
            .order('order_date', { ascending: false });

        if (action === 'pending') {
            query = query.eq('status', 'pending');
        } else if (action === 'recent') {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(days));
            query = query.gte('order_date', daysAgo.toISOString());
        }

        query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        const { data, count, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            orders: data,
            count: data?.length || 0,
            total: count,
            source: 'supabase'
        });

    } catch (error) {
        console.error('Orders fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders', details: String(error) },
            { status: 500 }
        );
    }
}

// POST: Mark order as shipped (write-back to legacy)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { order_id, status_id = 3 } = body; // 3 = Shipped typically

        if (!order_id) {
            return NextResponse.json({ error: 'order_id required' }, { status: 400 });
        }

        // Update legacy system
        const res = await fetch(`${LEGACY_SYNC_URL}?action=mark_shipped&secret=${LEGACY_SYNC_SECRET}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id, status_id })
        });

        const data = await res.json();

        // Also update Supabase if orders table exists
        if (data.success) {
            await supabase
                .from('orders')
                .update({
                    status: status_id === 3 ? 'shipped' : 'processing',
                    shipped_date: status_id === 3 ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString()
                })
                .eq('legacy_id', order_id);
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Order update error:', error);
        return NextResponse.json(
            { error: 'Failed to update order', details: String(error) },
            { status: 500 }
        );
    }
}
