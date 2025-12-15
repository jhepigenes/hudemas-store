const line = "(24003, 11278, 'ANDRESI MARIA', 'AL. CLOPOTEILOR, NR.1 , SC.B , AP.61', 'BISTRITA-NASAUD', 'BISTRITA', '420154', 'România', '0745947806', 0, '2025-11-30 12:43:18', 1, 0),";

function parseAddressRow(line) {
    let content = line.replace(/[,;]$/, '');
    console.log('Content after replace:', content);

    const parts = splitSQLValues(content);
    console.log('Parts count:', parts.length);
    parts.forEach((p, i) => console.log(`${i}: ${p}`));
}

function splitSQLValues(str) {
    if (str.startsWith('(')) str = str.substring(1);
    if (str.endsWith(')')) str = str.substring(0, str.length - 1);
    console.log('String to split:', str);

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

parseAddressRow(line);
