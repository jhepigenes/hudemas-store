import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

    const { data, error } = await supabaseAdmin
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const supabase = createClient();
    
    // Verify Auth
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { productId, rating, comment, imageUrl, authorName } = body;

        // Check for Verified Purchase (Optional enhancement: query orders table)
        // For now, we trust the status unless we want to enforce it strictly.
        // Let's do a quick check if the user bought the item for the "is_verified" badge.
        const { data: orders } = await supabaseAdmin
            .from('order_items')
            .select('order_id, orders(user_id)')
            .eq('product_id', productId)
            .eq('orders.user_id', session.user.id) // Note: inner join filter
            .limit(1);
        
        const isVerified = orders && orders.length > 0;

        const { error } = await supabaseAdmin
            .from('reviews')
            .insert({
                product_id: productId,
                user_id: session.user.id,
                author_name: authorName || 'Anonymous',
                rating,
                comment,
                image_url: imageUrl,
                is_verified: isVerified,
                status: 'pending' // Moderation required
            });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
