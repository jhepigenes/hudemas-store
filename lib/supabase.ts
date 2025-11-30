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
                getSession: async () => ({ data: { session: null }, error: null }),
                signInWithOAuth: async () => console.log('Mock sign in'),
                signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Mock login failed' } }),
                signOut: async () => console.log('Mock sign out'),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            },
            from: () => ({
                select: () => ({ data: [], error: null }),
                insert: () => ({ data: [], error: null }),
                update: () => ({ data: [], error: null }),
                delete: () => ({ data: [], error: null }),
                upsert: () => ({ data: [], error: null }),
            }),
            storage: {
                from: () => ({
                    upload: async () => ({ data: {}, error: null }),
                    getPublicUrl: () => ({ data: { publicUrl: 'https://placeholder.com/image.jpg' } }),
                }),
            },
        } as any;
    }

    return createBrowserClient(supabaseUrl, supabaseKey);
}
