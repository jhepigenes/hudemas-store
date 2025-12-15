import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Configuration - update these for your setup
const LEGACY_SYNC_URL = process.env.LEGACY_SYNC_URL || 'https://www.hudemas.ro/assets/customer_sync.php';
const LEGACY_SYNC_SECRET = process.env.LEGACY_SYNC_SECRET || '6f35b97e06a1585ee8daa975d7d86ed3';

interface LegacyCustomer {
    id_user: number;
    name: string;
    email: string;
    user_created: string;
    active: number;
    address: string;
    locality: string;
    state: string;
    postalcode: string;
    country: string;
    phone: string;
    order_count: number;
    total_spent: number;
    first_order: string;
    last_order: string;
    is_b2b: boolean;
    is_international: boolean;
}

// GET /api/sync/legacy - Check sync status or dry run
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    try {
        // Fetch stats from legacy system
        const statsRes = await fetch(`${LEGACY_SYNC_URL}?action=stats&secret=${LEGACY_SYNC_SECRET}`);
        const stats = await statsRes.json();

        if (!stats.success) {
            return NextResponse.json({ error: 'Failed to connect to legacy system', details: stats }, { status: 500 });
        }

        // Get Supabase counts for comparison
        const { count: supabaseCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true });

        const response: any = {
            legacy: stats.stats,
            supabase: { customers: supabaseCount || 0 },
            drift: {
                users: stats.stats.user - (supabaseCount || 0),
                message: stats.stats.user > (supabaseCount || 0)
                    ? `${stats.stats.user - (supabaseCount || 0)} customers pending sync`
                    : 'Supabase is up to date'
            },
            lastLegacyOrder: stats.stats.last_order,
            timestamp: new Date().toISOString()
        };

        // If dry run, fetch sample customers
        if (dryRun) {
            const customersRes = await fetch(
                `${LEGACY_SYNC_URL}?action=customers&limit=${limit}&offset=0&secret=${LEGACY_SYNC_SECRET}`
            );
            const customersData = await customersRes.json();
            response.sample = customersData.customers?.slice(0, 5);
        }

        return NextResponse.json(response);

    } catch (e) {
        console.error('Sync status error:', e);
        return NextResponse.json({ error: 'Failed to check sync status', details: String(e) }, { status: 500 });
    }
}

// POST /api/sync/legacy - Execute sync
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await request.json().catch(() => ({}));
        const batchSize = body.batchSize || 500;
        const maxBatches = body.maxBatches || 100; // Safety limit
        const preserveGeo = body.preserveGeo !== false; // Default: true

        let totalSynced = 0;
        let newCustomers = 0;
        let updatedCustomers = 0;
        let errors: string[] = [];
        let offset = 0;

        // Fetch existing Supabase customers for geo preservation
        const existingGeoData = new Map<number, any>();
        if (preserveGeo) {
            const { data: existing } = await supabase
                .from('customers')
                .select('legacy_id, geo_lat, geo_lon, geo_confidence, address_quality_score')
                .not('geo_lat', 'is', null);

            existing?.forEach(c => {
                if (c.legacy_id) existingGeoData.set(c.legacy_id, c);
            });
        }

        // Batch sync loop
        for (let batch = 0; batch < maxBatches; batch++) {
            const res = await fetch(
                `${LEGACY_SYNC_URL}?action=customers&limit=${batchSize}&offset=${offset}&secret=${LEGACY_SYNC_SECRET}`
            );
            const data = await res.json();

            if (!data.success || !data.customers?.length) {
                break;
            }

            // Transform and preserve geo data
            const customers = data.customers.map((c: LegacyCustomer) => {
                const existingGeo = existingGeoData.get(c.id_user);

                // Calculate LTV tier
                let ltv_tier = 'LOW';
                if (c.total_spent >= 1000 && c.order_count >= 3) ltv_tier = 'VIP_PLATINUM';
                else if (c.total_spent >= 500 || c.order_count >= 5) ltv_tier = 'VIP_GOLD';
                else if (c.total_spent >= 300) ltv_tier = 'HIGH_VALUE';
                else if (c.total_spent >= 150) ltv_tier = 'MEDIUM';

                // Calculate recency
                const daysSinceOrder = c.last_order
                    ? Math.floor((Date.now() - new Date(c.last_order).getTime()) / (1000 * 60 * 60 * 24))
                    : 9999;

                let recency_tier = 'LOST';
                if (daysSinceOrder <= 90) recency_tier = 'ACTIVE';
                else if (daysSinceOrder <= 180) recency_tier = 'WARM';
                else if (daysSinceOrder <= 365) recency_tier = 'COOLING';
                else if (daysSinceOrder <= 730) recency_tier = 'DORMANT';

                // Check for lapsed VIP
                const is_lapsed_vip = (ltv_tier.includes('VIP') || ltv_tier === 'HIGH_VALUE')
                    && daysSinceOrder > 180;

                return {
                    legacy_id: c.id_user,
                    name: c.name,
                    email: c.email || null,
                    phone: c.phone || null,
                    address: c.address || null,
                    locality: c.locality || null,
                    state: c.state || null,
                    postalcode: c.postalcode || null,
                    country: c.country || 'Romania',
                    total_spent: c.total_spent || 0,
                    order_count: c.order_count || 0,
                    first_order: c.first_order || null,
                    last_order: c.last_order || null,
                    days_since_order: daysSinceOrder < 9999 ? daysSinceOrder : null,
                    ltv_tier,
                    recency_tier,
                    is_b2b: c.is_b2b || false,
                    is_international: c.is_international || false,
                    is_lapsed_vip,
                    is_repeat: (c.order_count || 0) >= 2,
                    // Preserve existing geo data
                    geo_lat: existingGeo?.geo_lat || null,
                    geo_lon: existingGeo?.geo_lon || null,
                    geo_confidence: existingGeo?.geo_confidence || null,
                    address_quality_score: existingGeo?.address_quality_score || null,
                    source: 'legacy_sync',
                    updated_at: new Date().toISOString()
                };
            });

            // Upsert to Supabase
            const { error } = await supabase
                .from('customers')
                .upsert(customers, {
                    onConflict: 'legacy_id',
                    ignoreDuplicates: false
                });

            if (error) {
                errors.push(`Batch ${batch}: ${error.message}`);
            } else {
                totalSynced += customers.length;
            }

            offset += batchSize;

            // Check if we've processed all
            if (data.customers.length < batchSize) {
                break;
            }
        }

        const duration = (Date.now() - startTime) / 1000;

        return NextResponse.json({
            success: true,
            message: `Synced ${totalSynced} customers from legacy system`,
            stats: {
                totalSynced,
                newCustomers,
                updatedCustomers,
                geoPreserved: existingGeoData.size,
                duration: `${duration.toFixed(1)}s`,
                errors: errors.length
            },
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (e) {
        console.error('Sync error:', e);
        return NextResponse.json({ error: 'Sync failed', details: String(e) }, { status: 500 });
    }
}
