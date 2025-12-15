import { NextRequest, NextResponse } from 'next/server';

// Nominatim (OpenStreetMap) for free geocoding
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

interface GeoResult {
    lat: string;
    lon: string;
    display_name: string;
    address?: {
        city?: string;
        town?: string;
        village?: string;
        county?: string;
        state?: string;
        country?: string;
        postcode?: string;
    };
}

// POST /api/customers/validate-address
// Validates and geocodes an address
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { address, locality, state, country = 'Romania' } = body;

        if (!address && !locality) {
            return NextResponse.json({
                valid: false,
                error: 'Address or locality required'
            }, { status: 400 });
        }

        // Build search query
        const searchTerms = [address, locality, state, country]
            .filter(Boolean)
            .join(', ');

        // Call Nominatim API
        const response = await fetch(
            `${NOMINATIM_URL}?` + new URLSearchParams({
                q: searchTerms,
                format: 'json',
                addressdetails: '1',
                limit: '1'
            }),
            {
                headers: {
                    'User-Agent': 'HudemasStore/1.0 (contact@hudemas.ro)'
                }
            }
        );

        if (!response.ok) {
            return NextResponse.json({
                valid: false,
                error: 'Geocoding service unavailable'
            }, { status: 503 });
        }

        const results: GeoResult[] = await response.json();

        if (results.length === 0) {
            return NextResponse.json({
                valid: false,
                error: 'Address not found',
                suggestion: 'Please check spelling or try a simpler address'
            });
        }

        const result = results[0];
        const addr = result.address || {};

        // Determine validated city/locality
        const validatedLocality = addr.city || addr.town || addr.village || locality;
        const validatedState = addr.county || addr.state || state;
        const validatedCountry = addr.country || country;

        // Confidence score (0-100)
        let confidence = 100;
        if (!addr.city && !addr.town) confidence -= 20;  // No city match
        if (!addr.county && !addr.state) confidence -= 15;  // No state match
        if (!addr.postcode) confidence -= 10;  // No postal code

        return NextResponse.json({
            valid: true,
            original: {
                address,
                locality,
                state,
                country
            },
            validated: {
                address: result.display_name,
                locality: validatedLocality,
                state: validatedState,
                postalcode: addr.postcode || body.postalcode,
                country: validatedCountry,
                country_normalized: validatedCountry
            },
            geo: {
                lat: parseFloat(result.lat),
                lon: parseFloat(result.lon),
                confidence: confidence >= 70 ? 'high' : confidence >= 50 ? 'medium' : 'low',
                confidence_score: confidence
            }
        });

    } catch (e) {
        console.error('Geocoding error:', e);
        return NextResponse.json({
            valid: false,
            error: 'Validation failed'
        }, { status: 500 });
    }
}
