import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/customers/import - Bulk CSV import
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        const customers: any[] = [];
        const b2bPatterns = /\b(srl|s\.r\.l|sa|s\.a|pfa|p\.f\.a|ltd|gmbh|inc|llc|company|firma)\b/i;

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            // Parse CSV line (handle quoted fields)
            const values: string[] = [];
            let current = '';
            let inQuotes = false;

            for (const char of lines[i]) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());

            // Map to customer object
            const customer: any = {};
            headers.forEach((header, idx) => {
                const value = values[idx] || '';

                // Map CSV columns to DB columns
                const columnMap: Record<string, string> = {
                    'id_user': 'legacy_id',
                    'name': 'name',
                    'email': 'email',
                    'phone': 'phone',
                    'phone_normalized': 'phone_normalized',
                    'address': 'address',
                    'locality': 'locality',
                    'state': 'state',
                    'postalcode': 'postalcode',
                    'country': 'country',
                    'country_normalized': 'country_normalized',
                    'total_spent': 'total_spent',
                    'order_count': 'order_count',
                    'first_order': 'first_order',
                    'last_order': 'last_order_date',
                    'days_since_order': 'days_since_order',
                    'ltv_tier': 'ltv_tier',
                    'recency_tier': 'recency_tier',
                    'is_holiday_buyer': 'is_holiday_buyer',
                    'is_lapsed_vip': 'is_lapsed_vip',
                    'is_repeat': 'is_repeat',
                    'is_international': 'is_international',
                    'is_b2b': 'is_b2b',
                    'email_valid': 'email_valid',
                    'data_quality_score': 'data_quality_score',
                    'geo_lat': 'geo_lat',
                    'geo_lon': 'geo_lon',
                    'geo_confidence': 'geo_confidence',
                    'address_quality_score': 'address_quality_score'
                };

                const dbColumn = columnMap[header];
                if (dbColumn && value) {
                    // Type conversions
                    if (['legacy_id', 'order_count', 'days_since_order', 'data_quality_score', 'address_quality_score'].includes(dbColumn)) {
                        customer[dbColumn] = parseInt(value) || null;
                    } else if (dbColumn === 'total_spent') {
                        customer[dbColumn] = parseFloat(value) || 0;
                    } else if (['geo_lat', 'geo_lon'].includes(dbColumn)) {
                        customer[dbColumn] = parseFloat(value) || null;
                    } else if (['is_holiday_buyer', 'is_lapsed_vip', 'is_repeat', 'is_international', 'is_b2b'].includes(dbColumn)) {
                        // Handle both 'true/false' and 'Yes/No' formats
                        customer[dbColumn] = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
                    } else if (dbColumn === 'email_valid') {
                        customer[dbColumn] = value.toLowerCase() === 'yes';
                    } else if (['first_order', 'last_order'].includes(dbColumn)) {
                        customer[dbColumn] = value || null;
                    } else {
                        customer[dbColumn] = value;
                    }
                }
            });

            // B2B detection: use CSV value if present, otherwise fallback to regex
            if (customer.is_b2b === undefined || customer.is_b2b === null) {
                customer.is_b2b = b2bPatterns.test(customer.name || '');
            }
            customer.source = 'csv_import';

            if (customer.legacy_id || customer.email) {
                customers.push(customer);
            }
        }

        // Batch upsert (in chunks of 500)
        const chunkSize = 500;
        let imported = 0;
        let errors = 0;

        for (let i = 0; i < customers.length; i += chunkSize) {
            const chunk = customers.slice(i, i + chunkSize);

            const { error } = await supabase
                .from('customers')
                .upsert(chunk, {
                    onConflict: 'legacy_id',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error('Chunk import error:', error);
                errors += chunk.length;
            } else {
                imported += chunk.length;
            }
        }

        return NextResponse.json({
            message: 'Import complete',
            total: customers.length,
            imported,
            errors
        });

    } catch (e) {
        console.error('Import error:', e);
        return NextResponse.json({ error: 'Import failed' }, { status: 500 });
    }
}
