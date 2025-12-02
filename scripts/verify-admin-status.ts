
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://msepwdbzrzqotapgesnd.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZXB3ZGJ6cnpxb3RhcGdlc25kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzMjUyNywiZXhwIjoyMDc5OTA4NTI3fQ.hUpmhh7IkuiSHTlaf2zYUxT6F9mQyOnT-8QiQNbItD8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminUser() {
    console.log('Checking Admin User Status...');

    // 1. List all users to find admin@hudemas.ro
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Error fetching users:', authError);
        return;
    }

    const adminEmail = 'admin@hudemas.ro';
    const adminUser = users.find(u => u.email === adminEmail);

    if (!adminUser) {
        console.error(`❌ User ${adminEmail} NOT FOUND in auth.users`);
        return;
    }

    console.log(`✅ User ${adminEmail} found. ID: ${adminUser.id}`);

    // 2. Check profile role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', adminUser.id)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
    } else {
        console.log('Profile:', profile);
        if (profile.role === 'admin') {
            console.log('✅ User has "admin" role.');
        } else {
            console.error(`❌ User role is "${profile.role}", expected "admin".`);
        }
    }
}

checkAdminUser();
