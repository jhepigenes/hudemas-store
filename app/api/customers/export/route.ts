import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/customers/export?format=gls|mailchimp|google|meta
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const format = searchParams.get('format') || 'gls';
    const ltv_tier = searchParams.get('ltv_tier');
    const is_b2b = searchParams.get('is_b2b');
    const has_email = searchParams.get('has_email');
    const limit = parseInt(searchParams.get('limit') || '10000');

    // Build query
    let query = supabase.from('customers').select('*');

    if (ltv_tier) {
        query = query.eq('ltv_tier', ltv_tier);
    }
    if (is_b2b === 'true') {
        query = query.eq('is_b2b', true);
    }
    if (has_email === 'true') {
        query = query.not('email', 'is', null).neq('email', '');
    }

    query = query.order('total_spent', { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let csv = '';
    const customers = data || [];

    switch (format) {
        case 'gls':
            // GLS shipping format: Amount of CoD;Name;Address;City;ZIP Code;Country;E-mail;Phone;Client reference
            csv = 'Amount of CoD;Name;Address;City;ZIP Code;Country;E-mail;Phone;Client reference\n';
            customers.forEach(c => {
                csv += `0;${c.name || ''};${c.address || ''};${c.locality || ''};${c.postalcode || ''};${c.country_normalized || 'Romania'};${c.email || ''};${c.phone || ''};${c.legacy_id || ''}\n`;
            });
            break;

        case 'mailchimp':
            // Mailchimp format: Email Address,First Name,Last Name,Phone,Total Spent,LTV Tier
            csv = 'Email Address,First Name,Last Name,Phone,Total Spent,LTV Tier\n';
            customers.forEach(c => {
                if (!c.email) return;
                const nameParts = (c.name || '').split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';
                csv += `${c.email},"${firstName}","${lastName}",${c.phone || ''},${c.total_spent || 0},${c.ltv_tier || ''}\n`;
            });
            break;

        case 'google':
            // Google Customer Match: Email,Phone,First Name,Last Name,Country,Zip
            csv = 'Email,Phone,First Name,Last Name,Country,Zip\n';
            customers.forEach(c => {
                if (!c.email && !c.phone_normalized) return;
                const nameParts = (c.name || '').split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';
                const countryCode = c.is_international ? (c.country || '').substring(0, 2).toUpperCase() : 'RO';
                csv += `${c.email || ''},${c.phone_normalized || ''},"${firstName}","${lastName}",${countryCode},${c.postalcode || ''}\n`;
            });
            break;

        case 'meta':
            // Meta Custom Audience: email,phone,fn,ln,st,ct,zip,country (lowercase, hashing optional)
            csv = 'email,phone,fn,ln,st,ct,zip,country\n';
            customers.forEach(c => {
                if (!c.email && !c.phone_normalized) return;
                const nameParts = (c.name || '').split(' ');
                const firstName = nameParts[0]?.toLowerCase() || '';
                const lastName = nameParts.slice(1).join(' ')?.toLowerCase() || '';
                const countryCode = c.is_international ? (c.country || '').substring(0, 2).toLowerCase() : 'ro';
                csv += `${(c.email || '').toLowerCase()},${(c.phone_normalized || '').replace(/\+/g, '')},${firstName},${lastName},${(c.state || '').toLowerCase()},${(c.locality || '').toLowerCase()},${c.postalcode || ''},${countryCode}\n`;
            });
            break;

        default:
            return NextResponse.json({ error: 'Invalid format. Use: gls, mailchimp, google, meta' }, { status: 400 });
    }

    // Return as downloadable CSV
    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="customers_${format}_${new Date().toISOString().split('T')[0]}.csv"`
        }
    });
}
