
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase'; // Normal client to verify session
import { supabaseAdmin } from '@/lib/supabase-admin'; // Admin client to update

export async function PUT(request: Request) {
    try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { full_name, phone, address, city, county, country, zip_code } = body;

        // Update using Admin client to bypass RLS issues, but strictly scoped to the user's ID
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({
                full_name,
                phone,
                address,
                city,
                county,
                country,
                zip_code,
                updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);

        if (error) {
            console.error('Profile update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Internal error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
