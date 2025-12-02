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

async function syncVariantsByImageId() {
    console.log('🚀 Starting sync by Image ID...');

    // 1. Parse SQL Dump first
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
                    if (cleanValues[2] === '1') { 
                        const id = parseInt(cleanValues[1]);
                        const extra = cleanValues[5];
                        if (!legacyData.has(id)) legacyData.set(id, { id, formats: new Set() });
                        const data = legacyData.get(id)!;
                        if (extra && extra.includes('culori')) {
                            const colorMatch = extra.match(/(\d+)\s*culori/i);
                            if (colorMatch) data.colors = colorMatch[1];
                        }
                    }
                } else if (currentTable === 'product_attribute') {
                    const id_pa = parseInt(cleanValues[0]);
                    const id_p = parseInt(cleanValues[1]);
                    const details = cleanValues[3];
                    productAttributeToProduct.set(id_pa, id_p);
                    if (!legacyData.has(id_p)) legacyData.set(id_p, { id: id_p, formats: new Set() });
                    const data = legacyData.get(id_p)!;
                    if (details && (details.includes('Mărime') || details.match(/\d+\s*x\s*\d+/))) {
                        const dimMatch = details.match(/Mărime:\s*([\d\s\.x]+cm)/i) ||
                            details.match(/Mărime:\s*([\d\s\.x]+)/i) ||
                            details.match(/([\d\s\.x]+cm)/i);
                        if (dimMatch) data.dimensions = dimMatch[1].trim();
                    }
                } else if (currentTable === 'product_attribute_combination') {
                     const id_attr = parseInt(cleanValues[1]);
                     const id_pa = parseInt(cleanValues[2]);
                     const id_p = productAttributeToProduct.get(id_pa);
                     if (id_p && legacyData.has(id_p)) {
                         const data = legacyData.get(id_p)!;
                         if (id_attr === 1) data.formats.add('Printed');
                         if (id_attr === 2) data.formats.add('Diagram');
                     }
                }
            } catch (e) {}
        }
    }
    console.log(`Parsed data for ${legacyData.size} products from SQL.`);

    // 2. Fetch Supabase Products
    const { data: products, error } = await supabase
        .from('products')
        .select('*'); // Fetch everything to check image_url

    if (error || !products) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Fetched ${products.length} products from Supabase.`);

    // 3. Update Products by Image ID
    let updatedCount = 0;
    
    for (const p of products) {
        // Only update if missing data
        if (p.dimensions && p.colors && p.formats && p.formats.length > 0) continue;

        if (!p.image_url) continue;

        // Extract ID from image: ...goblen-hudemas-123-...
        const match = p.image_url.match(/goblen-hudemas-(\d+)-/);
        if (match) {
            const imageId = parseInt(match[1]);
            const legacy = legacyData.get(imageId);

            if (legacy) {
                const updatePayload: any = {};
                if (!p.colors && legacy.colors) updatePayload.colors = legacy.colors;
                if (!p.dimensions && legacy.dimensions) updatePayload.dimensions = legacy.dimensions;
                if ((!p.formats || p.formats.length === 0) && legacy.formats.size > 0) {
                    updatePayload.formats = Array.from(legacy.formats);
                }

                if (Object.keys(updatePayload).length > 0) {
                    const { error } = await supabase
                        .from('products')
                        .update(updatePayload)
                        .eq('id', p.id);

                    if (error) {
                        console.error(`Failed to update product ${p.title} (${p.id}):`, error.message);
                    } else {
                        updatedCount++;
                        if (updatedCount % 50 === 0) process.stdout.write('.');
                    }
                }
            }
        }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} products using Image IDs.`);
}

syncVariantsByImageId();
