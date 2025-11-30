
const { createClient } = require('@supabase/supabase-js');

try {
    const client = createClient('', '');
    console.log('Client created successfully');
} catch (error) {
    console.error('Client creation failed:', error.message);
}
