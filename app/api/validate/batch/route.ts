import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NOMINATIM_URL = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rate limit: 1 request per second for Nominatim
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface Customer {
    id: number;
    address: string | null;
    locality: string | null;
    state: string | null;
    postalcode: string | null;
    country: string | null;
}

interface NominatimResult {
    lat: string;
    lon: string;
    display_name: string;
    importance: number;
}

async function geocodeAddress(customer: Customer): Promise<{
    geo_lat: number | null;
    geo_lon: number | null;
    geo_confidence: number;
    geo_display_name: string | null;
}> {
    const parts = [
        customer.address,
        customer.locality,
        customer.state,
        customer.postalcode,
        customer.country || 'Romania'
    ].filter(Boolean);

    if (parts.length < 2) {
        return { geo_lat: null, geo_lon: null, geo_confidence: 0, geo_display_name: null };
    }

    const query = encodeURIComponent(parts.join(', '));

    try {
        const response = await fetch(
            `${NOMINATIM_URL}/search?q=${query}&format=json&limit=1&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'HudemasOpsCenter/1.0 (contact@hudemas.ro)'
                }
            }
        );

        if (!response.ok) {
            console.error(`Nominatim error: ${response.status}`);
            return { geo_lat: null, geo_lon: null, geo_confidence: 0, geo_display_name: null };
        }

        const results: NominatimResult[] = await response.json();

        if (results.length === 0) {
            return { geo_lat: null, geo_lon: null, geo_confidence: 0.1, geo_display_name: null };
        }

        const result = results[0];
        const confidence = Math.min(result.importance * 1.5, 1);

        return {
            geo_lat: parseFloat(result.lat),
            geo_lon: parseFloat(result.lon),
            geo_confidence: confidence,
            geo_display_name: result.display_name
        };
    } catch (error) {
        console.error('Geocoding error:', error);
        return { geo_lat: null, geo_lon: null, geo_confidence: 0, geo_display_name: null };
    }
}

function calculateAddressQuality(customer: Customer, geoResult: { geo_lat: number | null; geo_confidence: number }): number {
    let score = 0;

    // Address completeness (up to 60 points)
    if (customer.address && customer.address.length >= 5) score += 15;
    if (customer.locality) score += 15;
    if (customer.state) score += 10;
    if (customer.postalcode && customer.postalcode.length >= 5) score += 10;
    if (customer.country) score += 10;

    // Geocoding bonus (up to 40 points)
    if (geoResult.geo_lat) {
        score += 20;
        if (geoResult.geo_confidence >= 0.7) score += 20;
        else if (geoResult.geo_confidence >= 0.4) score += 10;
    }

    return Math.min(score, 100);
}

export async function GET(request: Request) {
    // Verify cron secret (Vercel sends this)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow without secret for manual testing, but log a warning
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        console.log('Warning: Request without valid cron secret');
    }

    try {
        // Check if validation is enabled
        const { data: config, error: configError } = await supabase
            .from('validation_config')
            .select('*')
            .eq('id', 1)
            .single();

        if (configError) {
            // Table might not exist yet - create it
            console.log('Config table not found, validation disabled');
            return NextResponse.json({
                success: true,
                message: 'Validation disabled (no config)',
                processed: 0
            });
        }

        if (!config?.is_enabled) {
            return NextResponse.json({
                success: true,
                message: 'Validation paused',
                processed: 0
            });
        }

        // Get batch of unvalidated customers (5 per run)
        const { data: customers, error: fetchError } = await supabase
            .from('customers')
            .select('id, address, locality, state, postalcode, country')
            .is('geo_lat', null)
            .limit(5);

        if (fetchError) {
            throw new Error(`Failed to fetch customers: ${fetchError.message}`);
        }

        if (!customers || customers.length === 0) {
            // All done!
            await supabase
                .from('validation_config')
                .update({ is_enabled: false, last_run_at: new Date().toISOString() })
                .eq('id', 1);

            return NextResponse.json({
                success: true,
                message: 'All customers validated!',
                processed: 0,
                complete: true
            });
        }

        let validated = 0;
        let errors = 0;

        for (const customer of customers) {
            // Geocode the address
            const geoResult = await geocodeAddress(customer);
            const qualityScore = calculateAddressQuality(customer, geoResult);

            // Update customer
            const { error: updateError } = await supabase
                .from('customers')
                .update({
                    geo_lat: geoResult.geo_lat,
                    geo_lon: geoResult.geo_lon,
                    geo_confidence: geoResult.geo_confidence,
                    geo_display_name: geoResult.geo_display_name,
                    geo_validated_at: new Date().toISOString(),
                    address_quality_score: qualityScore
                })
                .eq('id', customer.id);

            if (updateError) {
                console.error(`Failed to update customer ${customer.id}:`, updateError);
                errors++;
            } else {
                validated++;
            }

            // Rate limit: 1.5 seconds between requests
            await delay(1500);
        }

        // Update validation config stats
        await supabase
            .from('validation_config')
            .update({
                last_run_at: new Date().toISOString(),
                total_validated: config.total_validated + validated,
                errors_count: config.errors_count + errors
            })
            .eq('id', 1);

        return NextResponse.json({
            success: true,
            processed: validated,
            errors,
            total: config.total_validated + validated,
            message: `Validated ${validated} customers`
        });

    } catch (error) {
        console.error('Batch validation error:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
