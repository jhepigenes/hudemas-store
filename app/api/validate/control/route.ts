import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: Get validation status
export async function GET() {
    try {
        // Get config
        const { data: config, error: configError } = await supabase
            .from('validation_config')
            .select('*')
            .eq('id', 1)
            .single();

        if (configError) {
            return NextResponse.json({
                success: true,
                is_enabled: false,
                total_validated: 0,
                errors_count: 0,
                message: 'Config not initialized'
            });
        }

        // Get count of unvalidated customers
        const { count: unvalidatedCount } = await supabase
            .from('customers')
            .select('id', { count: 'exact', head: true })
            .is('geo_lat', null);

        // Get total customers
        const { count: totalCount } = await supabase
            .from('customers')
            .select('id', { count: 'exact', head: true });

        return NextResponse.json({
            success: true,
            is_enabled: config.is_enabled,
            total_validated: config.total_validated,
            errors_count: config.errors_count,
            last_run_at: config.last_run_at,
            started_at: config.started_at,
            unvalidated_remaining: unvalidatedCount || 0,
            total_customers: totalCount || 0,
            progress_percent: totalCount ? Math.round(((totalCount - (unvalidatedCount || 0)) / totalCount) * 100) : 0
        });
    } catch (error) {
        console.error('Control status error:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}

// POST: Start or stop validation
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const action = body.action;

        if (!['start', 'stop', 'reset'].includes(action)) {
            return NextResponse.json(
                { success: false, error: 'Invalid action. Use: start, stop, or reset' },
                { status: 400 }
            );
        }

        // Ensure config exists
        await supabase
            .from('validation_config')
            .upsert({ id: 1, is_enabled: false, total_validated: 0, errors_count: 0 }, { onConflict: 'id' });

        if (action === 'start') {
            const { error } = await supabase
                .from('validation_config')
                .update({
                    is_enabled: true,
                    started_at: new Date().toISOString()
                })
                .eq('id', 1);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Background validation started' });
        }

        if (action === 'stop') {
            const { error } = await supabase
                .from('validation_config')
                .update({ is_enabled: false })
                .eq('id', 1);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Background validation stopped' });
        }

        if (action === 'reset') {
            const { error } = await supabase
                .from('validation_config')
                .update({
                    is_enabled: false,
                    total_validated: 0,
                    errors_count: 0,
                    started_at: null,
                    last_run_at: null
                })
                .eq('id', 1);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Validation stats reset' });
        }

    } catch (error) {
        console.error('Control action error:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
