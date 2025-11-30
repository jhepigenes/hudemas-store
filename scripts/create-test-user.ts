import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
    const email = 'testuser@example.com';
    const password = 'password123';

    // Check if exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    const existing = users?.users.find(u => u.email === email);

    if (existing) {
        console.log('Test user already exists:', existing.id);
        // Update password just in case
        await supabase.auth.admin.updateUserById(existing.id, { password: password });
        return;
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Test Artist' }
    });

    if (error) {
        console.error('Error creating user:', error);
    } else {
        console.log('Created test user:', data.user.id);
    }
}

createTestUser();
