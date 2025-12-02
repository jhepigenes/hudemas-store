import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, slug, content, excerpt, image_url, published_at, id } = body;

        // Basic slug generation if missing
        const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const articleData = {
            title,
            slug: finalSlug,
            content,
            excerpt,
            image_url,
            published_at: published_at || new Date().toISOString()
        };

        let error;
        if (id) {
            const { error: updateError } = await supabaseAdmin
                .from('articles')
                .update(articleData)
                .eq('id', id);
            error = updateError;
        } else {
            const { error: insertError } = await supabaseAdmin
                .from('articles')
                .insert(articleData);
            error = insertError;
        }

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Blog API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const { error } = await supabaseAdmin.from('articles').delete().eq('id', id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
