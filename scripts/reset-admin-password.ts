
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://msepwdbzrzqotapgesnd.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZXB3ZGJ6cnpxb3RhcGdlc25kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzMjUyNywiZXhwIjoyMDc5OTA4NTI3fQ.hUpmhh7IkuiSHTlaf2zYUxT6F9mQyOnT-8QiQNbItD8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetAdminPassword() {
    const email = 'admin@hudemas.ro';
    const newPassword = 'admin123';

    console.log(`Resetting password for ${email}...`);

    // 1. Find User ID
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error(`User ${email} not found! Creating it...`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password: newPassword,
            email_confirm: true,
            user_metadata: { role: 'admin' }
        });

        if (createError) {
            console.error('Error creating user:', createError);
        } else {
            console.log(`User created with ID: ${newUser.user.id}`);
            // Ensure profile exists
            await supabase.from('profiles').upsert({
                id: newUser.user.id,
                role: 'admin',
                full_name: 'Hudemas Admin',
                username: 'admin'
            });
        }
        return;
    }

    console.log(`Found user ID: ${user.id}`);

    // 2. Update Password
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword
    });

    if (updateError) {
        console.error('Error updating password:', updateError);
    } else {
        console.log('✅ Password updated successfully to: adminadmin');
    }
}

resetAdminPassword();
