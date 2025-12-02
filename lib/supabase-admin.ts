
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Note: This client should ONLY be used in server-side contexts (API routes, Server Actions)
// never in Client Components.
export const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export const createClient = () => supabaseAdmin;

export async function getGuestUserId() {
    const GUEST_EMAIL = 'guest@hudemas.ro';

    // 1. Try to find existing guest user
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        throw error;
    }

    const guestUser = users.users.find(u => u.email === GUEST_EMAIL);

    if (guestUser) {
        return guestUser.id;
    }

    // 2. Create guest user if not exists
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: GUEST_EMAIL,
        email_confirm: true,
        password: 'guestpassword123!@#', // Random password, no one logs in as this
        user_metadata: { full_name: 'Guest User' }
    });

    if (createError) {
        console.error('Error creating guest user:', createError);
        throw createError;
    }

    return newUser.user.id;
}
