// Sync orders from legacy MySQL to Supabase
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LEGACY_SYNC_URL = process.env.LEGACY_SYNC_URL?.replace('customer_sync.php', 'order_sync.php')
    || 'https://www.hudemas.ro/assets/order_sync.php';
const LEGACY_SYNC_SECRET = process.env.LEGACY_SYNC_SECRET || '6f35b97e06a1585ee8daa975d7d86ed3';

interface LegacyOrder {
    order_id: number;
    order_date: string;
    status_id: number;
    status_name: string;
    total: number;
    shipping: number;
    customer: {
        user_id: number;
        name: string;
        email: string;
        phone: string;
    };
    shipping_address: {
        name: string;
        address: string;
        locality: string;
        state: string;
        postalcode: string;
        country: string;
    };
    items: Array<{
        product_id: number;
        name: string;
        quantity: number;
        unit_price: number;
        total: number;
    }>;
}

// GET: Check sync status
export async function GET() {
    try {
        // Get legacy stats
        const statsRes = await fetch(`${LEGACY_SYNC_URL}?action=recent&days=30&secret=${LEGACY_SYNC_SECRET}`);
        const legacyData = await statsRes.json();

        // Get Supabase counts
        const { count: supabaseCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        return NextResponse.json({
            legacy: {
                recent_orders: legacyData.count || 0
            },
            supabase: {
                orders: supabaseCount || 0
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Order sync status error:', error);
        return NextResponse.json(
            { error: 'Failed to check sync status', details: String(error) },
            { status: 500 }
        );
    }
}

// POST: Execute sync
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await request.json().catch(() => ({}));
        const days = body.days || 30;
        const limit = body.limit || 500;

        // Fetch orders from legacy
        const res = await fetch(
            `${LEGACY_SYNC_URL}?action=all&limit=${limit}&offset=0&secret=${LEGACY_SYNC_SECRET}`
        );
        const data = await res.json();

        if (!data.success || !data.orders?.length) {
            return NextResponse.json({
                success: true,
                message: 'No orders to sync',
                synced: 0
            });
        }

        // Transform for Supabase
        const orders = data.orders.map((o: LegacyOrder) => {
            // Map status_id to status name
            let status = 'pending';
            if (o.status_id === 3) status = 'shipped';
            else if (o.status_id === 4 || o.status_id === 5) status = 'cancelled';
            else if (o.status_id === 2) status = 'processing';

            return {
                legacy_id: o.order_id,
                legacy_customer_id: o.customer.user_id,
                status,
                total: o.total,
                shipping_cost: o.shipping,
                items: o.items,
                ship_name: o.shipping_address.name,
                ship_address: o.shipping_address.address,
                ship_locality: o.shipping_address.locality,
                ship_state: o.shipping_address.state,
                ship_postalcode: o.shipping_address.postalcode,
                ship_country: o.shipping_address.country || 'Romania',
                ship_phone: o.customer.phone,
                order_date: o.order_date,
                deleted_at: status === 'cancelled' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            };
        });

        // Upsert to Supabase
        const { error } = await supabase
            .from('orders')
            .upsert(orders, {
                onConflict: 'legacy_id',
                ignoreDuplicates: false
            });

        if (error) {
            throw error;
        }

        const duration = (Date.now() - startTime) / 1000;

        return NextResponse.json({
            success: true,
            message: `Synced ${orders.length} orders from legacy`,
            synced: orders.length,
            duration: `${duration.toFixed(1)}s`
        });

    } catch (error) {
        console.error('Order sync error:', error);
        return NextResponse.json(
            { error: 'Sync failed', details: String(error) },
            { status: 500 }
        );
    }
}
