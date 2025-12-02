import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const SQL_FILE = path.resolve(__dirname, '../../hudemas_hudemas20140317.sql');

interface LegacyProductData {
    id: number;
    colors?: string;
    dimensions?: string;
    formats: Set<string>;
}

async function syncVariantsById() {
    console.log('🚀 Starting sync by Legacy ID...');

    // 1. Fetch Supabase Products
    const { data: products, error } = await supabase
        .from('products')
        .select('id, original_url, title')
        .not('original_url', 'is', null);

    if (error || !products) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Fetched ${products.length} products from Supabase.`);

    // 2. Build Map: Legacy ID -> Supabase UUID
    const legacyIdToUuid = new Map<number, string>();
    let mappedCount = 0;

    for (const p of products) {
        if (p.original_url) {
            // Extract ID from URL: .../slug-123
            const match = p.original_url.match(/-(\d+)$/);
            if (match) {
                const legacyId = parseInt(match[1]);
                legacyIdToUuid.set(legacyId, p.id);
                mappedCount++;
            }
        }
    }
    console.log(`Mapped ${mappedCount} products to Legacy IDs.`);

    // 3. Parse SQL Dump
    console.log('Parsing SQL dump...');
    const legacyData = new Map<number, LegacyProductData>();
    const productAttributeToProduct = new Map<number, number>();

    const fileStream = fs.createReadStream(SQL_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let currentTable = '';

    for await (const line of rl) {
        if (line.startsWith('INSERT INTO `product_lang`')) currentTable = 'product_lang';
        else if (line.startsWith('INSERT INTO `product_attribute`')) currentTable = 'product_attribute';
        else if (line.startsWith('INSERT INTO `product_attribute_combination`')) currentTable = 'product_attribute_combination';
        else if (line.startsWith('INSERT INTO')) currentTable = '';

        if (!currentTable) continue;

        const matches = line.match(/\((.+?)\)/g);
        if (!matches) continue;

        for (const match of matches) {
            const cleanMatch = match.slice(1, -1);
            
            // Better CSV parser logic (handling quotes)
            const values: string[] = [];
            let currentVal = '';
            let inQuote = false;
            for (let i = 0; i < cleanMatch.length; i++) {
                const char = cleanMatch[i];
                if (char === "'" && cleanMatch[i - 1] !== '\\') inQuote = !inQuote;
                if (char === ',' && !inQuote) {
                    values.push(currentVal.trim());
                    currentVal = '';
                } else {
                    currentVal += char;
                }
            }
            values.push(currentVal.trim());
            
            const cleanValues = values.map(v => {
                 if (v.startsWith("'" ) && v.endsWith("'")) return v.slice(1, -1).replace(/\'/g, "'");
                 return v;
            });

            try {
                if (currentTable === 'product_lang') {
                    // (id_product_lang, id_product, id_language, name, description, extra, ...)
                    if (cleanValues[2] === '1') { // Language 1
                        const id = parseInt(cleanValues[1]);
                        const extra = cleanValues[5]; // "14 culori"

                        if (!legacyData.has(id)) legacyData.set(id, { id, formats: new Set() });
                        const data = legacyData.get(id)!;

                        if (extra && extra.includes('culori')) {
                            const colorMatch = extra.match(/(\d+)\s*culori/i);
                            if (colorMatch) data.colors = colorMatch[1];
                        }
                    }
                } else if (currentTable === 'product_attribute') {
                    // (id_product_attribute, id_product, reference, details, ...)
                    const id_pa = parseInt(cleanValues[0]);
                    const id_p = parseInt(cleanValues[1]);
                    const details = cleanValues[3];

                    productAttributeToProduct.set(id_pa, id_p);

                    if (!legacyData.has(id_p)) legacyData.set(id_p, { id: id_p, formats: new Set() });
                    const data = legacyData.get(id_p)!;

                    // Extract Dimensions
                    if (details && (details.includes('Mărime') || details.match(/\d+\s*x\s*\d+/))) {
                        const dimMatch = details.match(/Mărime:\s*([\d\s\.x]+cm)/i) ||
                            details.match(/Mărime:\s*([\d\s\.x]+)/i) ||
                            details.match(/([\d\s\.x]+cm)/i);
                        
                        if (dimMatch) data.dimensions = dimMatch[1].trim();
                    }
                } else if (currentTable === 'product_attribute_combination') {
                     // (id_product_attribute_combination, id_attribute, id_product_attribute)
                     const id_attr = parseInt(cleanValues[1]);
                     const id_pa = parseInt(cleanValues[2]);
                     const id_p = productAttributeToProduct.get(id_pa);

                     if (id_p && legacyData.has(id_p)) {
                         const data = legacyData.get(id_p)!;
                         if (id_attr === 1) data.formats.add('Printed');
                         if (id_attr === 2) data.formats.add('Diagram');
                     }
                }
            } catch (e) {
                // Ignore
            }
        }
    }

    console.log(`Parsed data for ${legacyData.size} products from SQL.`);

    // 4. Update Supabase
    let updatedCount = 0;
    let batchUpdates = 0;
    
    for (const [legacyId, data] of legacyData) {
        const uuid = legacyIdToUuid.get(legacyId);
        if (uuid) {
            const updatePayload: any = {};
            if (data.colors) updatePayload.colors = data.colors;
            if (data.dimensions) updatePayload.dimensions = data.dimensions;
            if (data.formats.size > 0) updatePayload.formats = Array.from(data.formats);

            if (Object.keys(updatePayload).length > 0) {
                const { error } = await supabase
                    .from('products')
                    .update(updatePayload)
                    .eq('id', uuid);

                if (error) {
                    console.error(`Failed to update product ${legacyId}:`, error.message);
                } else {
                    updatedCount++;
                    if (updatedCount % 50 === 0) process.stdout.write('.');
                }
            }
        }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} products.`);
}

syncVariantsById();
