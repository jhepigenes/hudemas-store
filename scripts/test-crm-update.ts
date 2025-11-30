
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCRMUpdate() {
    const testEmail = 'test.crm@example.com';
    const testData = {
        email: testEmail,
        name: 'Test CRM User',
        phone: '0700123456',
        company_name: 'Test Corp',
        notes: 'Updated via script at ' + new Date().toISOString()
    };

    console.log('Upserting customer details...');
    const { error: upsertError } = await supabase
        .from('customer_details')
        .upsert(testData);

    if (upsertError) {
        console.error('Error upserting:', upsertError);
        return;
    }

    console.log('Upsert successful. Fetching back...');

    const { data, error: fetchError } = await supabase
        .from('customer_details')
        .select('*')
        .eq('email', testEmail)
        .single();

    if (fetchError) {
        console.error('Error fetching:', fetchError);
        return;
    }

    console.log('Fetched data:', data);

    if (data.notes === testData.notes) {
        console.log('SUCCESS: Data verified.');
    } else {
        console.error('FAILURE: Data mismatch.');
    }
}

testCRMUpdate();
