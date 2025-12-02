import { createClient } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-11-17.clover' as any, // Cast to any to avoid strict type checking if needed
});

export async function POST(request: Request) {
    console.log('POST /api/admin/bundles called');
    try {
        console.log('Initializing Supabase client...');
        const supabase = createClient();
        console.log('Supabase client initialized');

        const body = await request.json();
        console.log('Request body:', body);
        const { name, discount, description, productIds } = body;

        console.log('Creating Stripe coupon...');
        // 1. Create Coupon in Stripe
        const coupon = await stripe.coupons.create({
            name: name,
            percent_off: discount,
            duration: 'forever', // or 'once', 'repeating'
        });
        console.log('Stripe coupon created:', coupon.id);

        // 2. Create Bundle in Supabase
        const { data: bundle, error } = await supabase
            .from('bundles')
            .insert({
                name,
                description,
                discount_percent: discount,
                stripe_coupon_id: coupon.id,
                active: true
            })
            .select()
            .single();

        if (error) throw error;

        // 3. Create Bundle Items
        if (productIds && productIds.length > 0) {
            const bundleItems = productIds.map((productId: string) => ({
                bundle_id: bundle.id,
                product_id: productId
            }));

            const { error: itemsError } = await supabase
                .from('bundle_items')
                .insert(bundleItems);

            if (itemsError) throw itemsError;
        }

        return NextResponse.json(bundle);
    } catch (error: any) {
        console.error('Error creating bundle:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = createClient();
        const { id, name, description, active, discount, productIds } = await request.json();

        // 1. Fetch current bundle to check for changes
        const { data: currentBundle, error: fetchError } = await supabase
            .from('bundles')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        let stripeCouponId = currentBundle.stripe_coupon_id;

        // 2. Check if discount changed
        if (discount !== undefined && discount !== currentBundle.discount_percent) {
            console.log('Discount changed, creating new Stripe coupon...');
            const coupon = await stripe.coupons.create({
                name: name,
                percent_off: discount,
                duration: 'forever',
            });
            stripeCouponId = coupon.id;
        } else if (name !== currentBundle.name && stripeCouponId) {
            // Only update name if discount didn't change (otherwise new coupon has new name)
            await stripe.coupons.update(stripeCouponId, {
                name: name
            });
        }

        // 3. Update Bundle in Supabase
        const { data, error } = await supabase
            .from('bundles')
            .update({
                name,
                description,
                active,
                discount_percent: discount, // Update discount if provided
                stripe_coupon_id: stripeCouponId
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 4. Update Bundle Items (Delete all and re-insert)
        if (productIds) {
            // Delete existing items
            const { error: deleteError } = await supabase
                .from('bundle_items')
                .delete()
                .eq('bundle_id', id);

            if (deleteError) throw deleteError;

            // Insert new items
            if (productIds.length > 0) {
                const bundleItems = productIds.map((productId: string) => ({
                    bundle_id: id,
                    product_id: productId
                }));

                const { error: insertError } = await supabase
                    .from('bundle_items')
                    .insert(bundleItems);

                if (insertError) throw insertError;
            }
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error updating bundle:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('bundles')
            .select('*, bundle_items(product_id, products(title, image_url))')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
