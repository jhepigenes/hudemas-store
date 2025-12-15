import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://msepwdbzrzqotapgesnd.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZXB3ZGJ6cnpxb3RhcGdlc25kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzMjUyNywiZXhwIjoyMDc5OTA4NTI3fQ.hUpmhh7IkuiSHTlaf2zYUxT6F9mQyOnT-8QiQNbItD8";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createAdmin() {
  const email = 'admin@hudemas.ro';
  const password = 'newsecurepassword123'; 

  console.log(`Creating/Updating user ${email}...`);

  // First check if user exists
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
      console.error("Error listing users:", listError);
      return;
  }

  const existing = listData?.users.find(u => u.email === email);

  if (existing) {
      console.log('User exists. Updating password...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
          existing.id, 
          { password: password }
      );
      if (updateError) console.error('Update error:', updateError);
      else console.log('Password updated.');
  } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'admin' }
      });

      if (error) {
        console.error('Error creating user:', error);
      } else {
        console.log('User created:', data.user.id);
      }
  }
}

createAdmin();
