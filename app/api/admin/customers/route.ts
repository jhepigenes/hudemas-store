
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        console.log('[API] Admin Update Customer Body:', body);
        const { email, ...updates } = body;

        if (!email) {
            console.error('[API] Email missing in update request');
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Upsert into customer_details using Service Role (bypassing RLS)
        const { error } = await supabaseAdmin
            .from('customer_details')
            .upsert({
                email,
                ...updates,
                updated_at: new Date().toISOString()
            }, { onConflict: 'email' });

        if (error) {
            console.error('Supabase error updating customer:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Internal error updating customer:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
