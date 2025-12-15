const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateGLS() {
    console.log('Fetching last 15 orders...');
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

    if (error) {
        console.error('Error fetching orders:', error);
        process.exit(1);
    }

    console.log(`Found ${orders.length} orders.`);

    const header = 'Amount of CoD;Name;Address;City;ZIP Code;Country;E-mail;Phone;Client reference;CoD reference;Comment;Count;Contact;Services';
    const rows = orders.map(order => {
        // Parse customer details (handle both JSON object and flat fields if necessary)
        let details = order.customer_details || {};
        if (typeof details === 'string') {
            try { details = JSON.parse(details); } catch (e) { }
        }

        const firstName = details.firstName || '';
        const lastName = details.lastName || '';
        let name = `${firstName} ${lastName}`.trim();
        if (!name) name = order.customer_name || 'Customer';

        const address = details.address || order.customer_address_line1 || '';
        const city = details.city || order.customer_city || '';
        const zip = details.zipCode || order.customer_zip || '';

        let country = details.country || 'Romania';
        // Simple Country Map
        if (country.toLowerCase().includes('romania') || country.toLowerCase() === 'ro') country = 'RO';
        else if (country.toLowerCase().includes('germany') || country.toLowerCase() === 'de') country = 'DE';
        else if (country.toLowerCase().includes('hungary') || country.toLowerCase() === 'hu') country = 'HU';
        else if (country.toLowerCase().includes('austria') || country.toLowerCase() === 'at') country = 'AT';

        const email = details.email || order.customer_email || '';
        const phone = details.phone || order.customer_phone || '';
        const ref = order.id;

        // COD Logic
        let codAmount = '';
        let codRef = '';
        // Check payment method. Valid types usually: 'cod', 'card'.
        const isCod = (order.payment_method?.toLowerCase() === 'cod') || (order.payment_method === 'ramburs');
        if (isCod) {
            codAmount = order.total;
            codRef = order.id; // Or a shorter reference if GLS requires
        }

        const comment = '';
        const count = 1;
        const contact = name;

        // Services: Leave empty for standard, or add logic if needed.
        // Sample had 'FDS()' for Hungary, generic empty for others.
        const services = '';

        // CSV Sanitize: Remove ; and newlines
        const sanitize = (str) => String(str || '').replace(/;/g, ',').replace(/\n/g, ' ').trim();

        return [
            sanitize(codAmount),
            sanitize(name),
            sanitize(address),
            sanitize(city),
            sanitize(zip),
            sanitize(country),
            sanitize(email), // E-mail
            sanitize(phone), // Phone
            sanitize(ref),   // Client ref
            sanitize(codRef),// CoD ref
            sanitize(comment),
            count,
            sanitize(contact),
            services
        ].join(';');
    });

    const csvContent = [header, ...rows].join('\n');

    // Save to the gls folder in the parent directory if it exists, otherwise root
    const outputDir = path.join(__dirname, '../gls');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    const outputPath = path.join(outputDir, 'gls_orders_export.csv');

    fs.writeFileSync(outputPath, csvContent);
    console.log(`GLS CSV generated successfully at: ${outputPath}`);
}

generateGLS();
