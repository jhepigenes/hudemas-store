
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetPassword() {
    const email = 'admin@hudemas.ro';
    const newPassword = 'admin123'; // Keeping it simple for local dev/verification

    const { data, error } = await supabase.auth.admin.updateUserById(
        '1d0f1de6-b6f5-4a14-98b2-d5e93ddccef7', // ID from previous step
        { password: newPassword }
    );

    if (error) {
        console.error('Error resetting password:', error);
    } else {
        console.log(`Password for ${email} reset successfully.`);
    }
}

resetPassword();
