
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
    const email = 'admin@hudemas.ro';
    const password = 'adminadmin';

    console.log(`Creating admin user: ${email}`);

    // 1. Create user in auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    let userId;

    if (userError) {
        console.log('User creation error (might already exist):', userError.message);
        // If user exists, try to get ID
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === email);
        if (existingUser) {
            userId = existingUser.id;
            console.log(`Found existing user ID: ${userId}`);

            // Update password
            const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });
            if (updateError) {
                console.error('Error updating password:', updateError.message);
            } else {
                console.log('Password updated successfully.');
            }
        } else {
            console.error('Could not find or create user.');
            return;
        }
    } else {
        userId = userData.user.id;
        console.log(`User created with ID: ${userId}`);
    }

    // 2. Upsert profile with role 'admin'
    if (userId) {
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                role: 'admin',
                username: 'admin',
                full_name: 'Hudemas Admin'
            });

        if (profileError) {
            console.error('Error updating profile role:', profileError);
        } else {
            console.log('Profile updated with role "admin".');
        }
    }
}

createAdmin();
