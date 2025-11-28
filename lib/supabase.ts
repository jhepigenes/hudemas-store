import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-project-url') {
        console.warn('Supabase credentials missing. Returning mock client.');
        // Return a mock client that doesn't crash but logs warnings
        return {
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
                signInWithOAuth: async () => console.log('Mock sign in'),
                signOut: async () => console.log('Mock sign out'),
            },
            from: () => ({
                select: () => ({ data: [], error: null }),
                insert: () => ({ data: [], error: null }),
                update: () => ({ data: [], error: null }),
                delete: () => ({ data: [], error: null }),
            }),
        } as any;
    }

    return createBrowserClient(supabaseUrl, supabaseKey);
}
