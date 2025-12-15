const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const SQL_DUMP_PATH = process.argv[2] || path.join(__dirname, '../hudemas_hudemas20140317.sql');
const OUTPUT_CSV_PATH = path.join(__dirname, '../gls/legacy_gls_export.csv');
const DAYS_LOOKBACK = process.argv[3] ? parseInt(process.argv[3]) : 365;

console.log(`Processing SQL Dump: ${SQL_DUMP_PATH}`);
console.log(`Looking for orders in last ${DAYS_LOOKBACK} days...`);

const addressMap = new Map();
const orders = [];
const userMap = new Map(); // id -> email

const clean = (str) => str ? str.replace(/^'|'$/g, '').trim() : '';
const sanitize = (str) => String(str || '').replace(/;/g, ',').replace(/\n/g, ' ').trim();

async function processLineByLine() {
    const fileStream = fs.createReadStream(SQL_DUMP_PATH);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let currentTable = null;

    for await (const line of rl) {
        const trimmed = line.trim();

        // Detect Start of Insert Block
        if (trimmed.startsWith('INSERT INTO `address`')) {
            currentTable = 'address';
        } else if (trimmed.startsWith('INSERT INTO `order`')) {
            currentTable = 'order';
        } else if (trimmed.startsWith('INSERT INTO `user`')) {
            currentTable = 'user';
        }

        // Process Data Lines (Must start with '(' )
        if (currentTable && trimmed.startsWith('(')) {
            // A line can contain multiple records if compacted, or just one.
            // The dump previously showed one per line: (id, ...),
            // But let's handle the string.
            if (currentTable === 'address') parseAddressRow(trimmed);
            if (currentTable === 'order') parseOrderRow(trimmed);
            if (currentTable === 'user') parseUserRow(trimmed);
        }

        // End of Insert Block
        if (trimmed.endsWith(';')) {
            currentTable = null;
        }
    }

    generateCSV();
}

function parseUserRow(line) {
    let content = line.replace(/[,;]$/, '');
    const parts = splitSQLValues(content);
    if (parts.length >= 2) {
        const id = clean(parts[0]);
        const email = clean(parts[1]);
        userMap.set(id, email);
    }
}

function parseAddressRow(line) {
    // line looks like: (1, 1, 'Name', ...), or (1, ...);
    // Remove trailing comma or semicolon
    let content = line.replace(/[,;]$/, '');

    // Simple split by comma is dangerous due to quotes.
    // We must tokenize.
    const parts = splitSQLValues(content);

    if (parts.length >= 9) {
        const id = clean(parts[0]);
        // Schema: id, user, name, addr, state, city, zip, country, phone
        const name = clean(parts[2]);
        const address = clean(parts[3]);
        const state = clean(parts[4]);
        const city = clean(parts[5]);
        const zip = clean(parts[6]);
        const country = clean(parts[7]);
        const phone = clean(parts[8]);

        addressMap.set(id, { name, address, city, zip, country, phone });
    }
}

function parseOrderRow(line) {
    let content = line.replace(/[,;]$/, '');
    const parts = splitSQLValues(content);

    if (parts.length >= 16) {
        // Schema: id(0), user(1), addr_del(2), ..., date_add(10), ..., total(15)
        const id = clean(parts[0]);
        const userId = clean(parts[1]);
        const addressId = clean(parts[2]);
        const dateStr = clean(parts[10]);
        const total = clean(parts[15]);

        const orderDate = new Date(dateStr);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - DAYS_LOOKBACK);

        if (!isNaN(orderDate) && orderDate >= cutoff) {
            orders.push({ id, userId, addressId, total, dateStr });
        }
    }
}

// Robust SQL Value Splitter
function splitSQLValues(str) {
    // Remove outer parens ( ... )
    if (str.startsWith('(')) str = str.substring(1);
    if (str.endsWith(')')) str = str.substring(0, str.length - 1);

    const parts = [];
    let current = '';
    let inQuote = false;
    let escape = false;

    for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if (escape) {
            current += char;
            escape = false;
            continue;
        }

        if (char === '\\') {
            escape = true;
            // distinct distinction: MySQL standard escapes quotes with backslash, OR doubled quotes.
            // We'll keep the backslash logic for safety.
            current += char;
        } else if (char === "'") {
            inQuote = !inQuote;
            current += char;
        } else if (char === ',' && !inQuote) {
            parts.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    parts.push(current.trim());
    return parts;
}

function generateCSV() {
    console.log(`Extracted addresses: ${addressMap.size}`);
    console.log(`Found recent orders: ${orders.length}`);

    const header = 'Amount of CoD;Name;Address;City;ZIP Code;Country;E-mail;Phone;Client reference;CoD reference;Comment;Count;Contact;Services';

    // Sort by date desc (newest first)
    orders.sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr));

    // Limit if requested (default to 50 to avoid massive files if not specified)
    const LIMIT = process.argv[4] ? parseInt(process.argv[4]) : 50;
    const limitedOrders = orders.slice(0, LIMIT);

    const csvRows = limitedOrders.map(order => {
        const addr = addressMap.get(order.addressId) || {};

        const name = addr.name || 'Unknown';
        const addressLine = addr.address || '';
        const city = addr.city || '';
        let zip = (addr.zip || '').replace(/\s+/g, ''); // Strict sanitization: no spaces
        let country = addr.country || 'Romania';

        if (country.toLowerCase().includes('rom') || country.toLowerCase() === 'ro') country = 'RO';
        else if (country.toLowerCase().includes('germ') || country.toLowerCase().includes('deutsch') || country.toLowerCase() === 'de') country = 'DE';
        else if (country.toLowerCase().includes('hung') || country.toLowerCase() === 'hu') country = 'HU';
        else if (country.toLowerCase().includes('aust') || country.toLowerCase() === 'at') country = 'AT';
        else if (country.toLowerCase().includes('ital') || country.toLowerCase().includes('it')) country = 'IT';
        else if (country.toLowerCase().includes('span') || country.toLowerCase().includes('es')) country = 'ES';
        else if (country.toLowerCase().includes('unit') || country.toLowerCase().includes('us') || country.toLowerCase().includes('states')) country = 'US';
        else if (country.toLowerCase().includes('canad') || country.toLowerCase() === 'ca') country = 'CA';
        else if (country.toLowerCase().includes('belg') || country.toLowerCase() === 'be') country = 'BE';
        else if (country.toLowerCase().includes('franc') || country.toLowerCase() === 'fr') country = 'FR';
        else if (country.toLowerCase().includes('slov') || country.toLowerCase() === 'si') country = 'SI';
        else if (country.toLowerCase().includes('czech') || country.toLowerCase().includes('cz')) country = 'CZ';
        else if (country.toLowerCase().includes('mold') || country.toLowerCase() === 'md') country = 'MD';
        else if (country.toLowerCase().includes('bulg') || country.toLowerCase().includes('bg')) country = 'BG';
        else if (country.toLowerCase().includes('mold') || country.toLowerCase().includes('md')) country = 'MD';
        else if (country.toLowerCase().includes('bulg') || country.toLowerCase().includes('bg')) country = 'BG';
        else if (country.toLowerCase().includes('neder') || country.toLowerCase().includes('nether') || country.toLowerCase().includes('oland') || country.toLowerCase().includes('tarile') || country.toLowerCase() === 'nl') country = 'NL';

        const phone = addr.phone || '';
        // Map user ID to email if available
        let email = userMap.get(order.userId) || '';
        // Country Normalizationc

        // COD Logic
        let codAmount = order.total;
        let codRef = order.id;

        // DISABLE COD for non-RO countries (International usually prepaid)
        if (country !== 'RO') {
            codAmount = '';
            codRef = '';
        }

        // Zip Correction (Specific known legacy error)
        if (zip === '727879' && city.toLowerCase().includes('cacica')) {
            zip = '727095'; // Correct postcode for Cacica
        }

        // Phone Normalization
        let cleanPhone = phone.replace(/[^0-9+]/g, ''); // Remove spaces, dashes
        // If RO number starting with 07, add +40 prefix
        if (cleanPhone.startsWith('07') && cleanPhone.length === 10) {
            cleanPhone = '+40' + cleanPhone.substring(1);
        } else if (cleanPhone.startsWith('0040')) {
            cleanPhone = '+' + cleanPhone.substring(2);
        } else if (cleanPhone.startsWith('40') && cleanPhone.length === 11) {
            cleanPhone = '+' + cleanPhone;
        }

        // Service Logic: FDS is mandatory but only available in specific countries.
        // Supported: RO, HU, SK, CZ, SI, HR (approximate list for Central/East Europe GLS)
        // Service Logic: FDS is mandatory but only available in specific countries.
        // Supported: RO, HU, SK, CZ, SI, HR
        const fdsCountries = ['RO', 'HU', 'SK', 'CZ', 'SI', 'HR'];
        let services = '';
        let comment = ''; // New variable for comments

        if (fdsCountries.includes(country)) {
            // Supported country: Enable FDS if contact info exists
            if (cleanPhone || email) {
                services = 'FDS()';
            }
        } else {
            // Unsupported (IT, DE): Putting data in "Phone"/"Email" columns triggers auto-SMS which fails.
            // WORKAROUND: Move the contact info to the "Comment" field so it's printed on the label but ignored by the digital system.
            const parts = [];
            if (cleanPhone) parts.push(`Tel:${cleanPhone}`);
            if (email) parts.push(`Email:${email}`);

            if (parts.length > 0) {
                comment = parts.join(' ');
            }

            // Clear the actual columns to prevent error
            cleanPhone = '';
            email = '';
        }

        // Fix Decimal Separator: . -> ,
        const formattedCod = codAmount ? String(codAmount).replace('.', ',') : '';

        return [
            sanitize(formattedCod),
            sanitize(name),
            sanitize(addressLine),
            sanitize(city),
            sanitize(zip),
            sanitize(country),
            sanitize(email), // contact email (empty for IT/DE)
            sanitize(cleanPhone), // phone (empty for IT/DE)
            sanitize(order.id),
            sanitize(codRef),
            sanitize(comment), // NEW: Now includes phone/email for IT/DE
            1,
            sanitize(name),
            services
        ].join(';');
    });

    // Rename output file to v5
    const NEW_OUTPUT_PATH = path.join(__dirname, '../gls/legacy_gls_export_v5.csv');
    const dir = path.dirname(NEW_OUTPUT_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Add BOM for Excel/GLS encoding compatibility
    const BOM = '\uFEFF';
    fs.writeFileSync(NEW_OUTPUT_PATH, BOM + [header, ...csvRows].join('\n'));
    console.log(`GLS CSV Generated: ${NEW_OUTPUT_PATH}`);
}

processLineByLine();
