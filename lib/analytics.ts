import { createClient } from '@/lib/supabase';

const supabase = createClient();

export type AnalyticsEvent = 'view_item' | 'add_to_cart' | 'purchase' | 'search' | 'page_view';

export const trackEvent = async (
    event: AnalyticsEvent,
    data: Record<string, unknown> = {}
) => {
    try {
        // Get session if available
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;

        // Get basic browser info if client-side
        const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'server';
        const url = typeof window !== 'undefined' ? window.location.href : '';

        const payload = {
            event_name: event,
            user_id: userId,
            data: data,
            user_agent: userAgent,
            url: url,
            created_at: new Date().toISOString()
        };

        // Fire and forget - don't await to avoid blocking UI
        supabase.from('analytics_events').insert(payload).then(({ error }: { error: unknown }) => {
            if (error) console.error('Analytics error:', error);
        });

    } catch (error) {
        console.error('Failed to track event:', error);
    }
};
