
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = 'products';
const FILE_PATH = 'beta-feedback.json';

export async function GET() {
    try {
        // 1. Try to download existing feedback
        const { data, error } = await supabase.storage.from(BUCKET).download(FILE_PATH);
        
        if (error) {
            // If file doesn't exist, return empty array
            if (error.message.includes('not found')) return NextResponse.json([]);
            throw error;
        }

        const text = await data.text();
        return NextResponse.json(JSON.parse(text));
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const newEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            ...body
        };

        // 1. Get existing
        const { data, error } = await supabase.storage.from(BUCKET).download(FILE_PATH);
        let currentFeedback = [];
        
        if (!error) {
            const text = await data.text();
            currentFeedback = JSON.parse(text);
        }

        // 2. Append
        const updatedFeedback = [newEntry, ...currentFeedback];

        // 3. Upload back
        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(FILE_PATH, JSON.stringify(updatedFeedback, null, 2), {
                contentType: 'application/json',
                upsert: true
            });

        if (uploadError) throw uploadError;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        
        // We expect 'body' to be the full array of feedback items
        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
        }

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(FILE_PATH, JSON.stringify(body, null, 2), {
                contentType: 'application/json',
                upsert: true
            });

        if (uploadError) throw uploadError;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
    }
}
