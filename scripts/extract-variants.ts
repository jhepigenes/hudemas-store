import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SQL_FILE = path.resolve(__dirname, '../../hudemas_hudemas20140317.sql');

interface ProductData {
    id: number;
    names: Set<string>;
    sku?: string;
    colors?: string;
    dimensions?: string;
    formats: Set<string>;
}

async function extractAndSync() {
    console.log('Starting extraction from:', SQL_FILE);

    const fileStream = fs.createReadStream(SQL_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const products = new Map<number, ProductData>();
    const productDimensions = new Map<number, string>();
    const productSkus = new Map<number, string>();

    // Mappings
    // attribute_lang: id_attribute -> name (e.g. 1 -> 'imprimat')
    const attributeNames = new Map<number, string>();

    // product_attribute_combination: id_product_attribute -> id_attribute
    const attributeCombinations = new Map<number, number[]>();

    // product_attribute: id_product_attribute -> id_product
    const productAttributeToProduct = new Map<number, number>();

    let currentTable = '';

    for await (const line of rl) {
        if (line.startsWith('INSERT INTO `product_lang`')) {
            currentTable = 'product_lang';
        } else if (line.startsWith('INSERT INTO `product_attribute`')) {
            currentTable = 'product_attribute';
        } else if (line.startsWith('INSERT INTO `attribute_lang`')) {
            currentTable = 'attribute_lang';
        } else if (line.startsWith('INSERT INTO `product_attribute_combination`')) {
            currentTable = 'product_attribute_combination';
        } else if (line.startsWith('INSERT INTO')) {
            currentTable = '';
        }

        if (!currentTable) continue;

        // Simple regex to match values inside (...)
        // This is brittle but works for standard mysqldump format
        const matches = line.match(/\((.+?)\)/g);
        if (!matches) continue;

        for (const match of matches) {
            // Remove parens and split by comma, handling quoted strings
            // This is a simplified parser
            const cleanMatch = match.slice(1, -1);

            // Split by comma but ignore commas inside quotes
            const values: string[] = [];
            let currentVal = '';
            let inQuote = false;

            for (let i = 0; i < cleanMatch.length; i++) {
                const char = cleanMatch[i];
                if (char === "'" && cleanMatch[i - 1] !== '\\') {
                    inQuote = !inQuote;
                }
                if (char === ',' && !inQuote) {
                    values.push(currentVal.trim());
                    currentVal = '';
                } else {
                    currentVal += char;
                }
            }
            values.push(currentVal.trim());

            // Clean quotes from values
            const cleanValues = values.map(v => {
                if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
                return v;
            });

            try {
                if (currentTable === 'product_lang') {
                    // (id_product_lang, id_product, id_language, name, description, extra, ...)
                    // We only care about id_language = 1 (Romanian) or 2 (English)
                    if (cleanValues[2] === '1' || cleanValues[2] === '2') {
                        const id = parseInt(cleanValues[1]);
                        const name = cleanValues[3];
                        const extra = cleanValues[5]; // "12 culori"

                        if (!products.has(id)) {
                            products.set(id, { id, names: new Set(), formats: new Set() });
                        }
                        const p = products.get(id)!;
                        p.names.add(name);

                        // Extract colors
                        if (extra && extra.includes('culori')) {
                            const colorMatch = extra.match(/(\d+)\s*culori/i);
                            if (colorMatch) {
                                p.colors = colorMatch[1];
                            }
                        }
                    }
                } else if (currentTable === 'product_attribute') {
                    // (id_product_attribute, id_product, reference, details, ...)
                    const id_p = parseInt(cleanValues[1]);
                    const reference = cleanValues[2];
                    const details = cleanValues[3];

                    if (reference && !productSkus.has(id_p)) {
                        productSkus.set(id_p, reference);
                    }

                    // Try matching "Mărime" OR just "x" with numbers
                    if (details && (details.includes('Mărime') || details.match(/\d+\s*x\s*\d+/))) {
                        const dimMatch = details.match(/Mărime:\s*([\d\s\.x]+cm)/i) ||
                            details.match(/Mărime:\s*([\d\s\.x]+)/i) ||
                            details.match(/([\d\s\.x]+cm)/i);

                        if (dimMatch) {
                            // Store in dimensions map
                            if (!productDimensions.has(id_p)) {
                                productDimensions.set(id_p, dimMatch[1].trim());
                            }
                        }
                    }

                    // Store mapping for attribute combinations
                    const id_pa = parseInt(cleanValues[0]);
                    productAttributeToProduct.set(id_pa, id_p);
                } else if (currentTable === 'attribute_lang') {
                    // (id_attribute_lang, id_attribute, id_language, name, ...)
                    if (cleanValues[2] === '1') {
                        const id_attr = parseInt(cleanValues[1]);
                        const name = cleanValues[3];
                        attributeNames.set(id_attr, name);
                    }
                } else if (currentTable === 'product_attribute_combination') {
                    // (id_product_attribute_combination, id_attribute, id_product_attribute)
                    const id_attr = parseInt(cleanValues[1]);
                    const id_pa = parseInt(cleanValues[2]);

                    const id_p = productAttributeToProduct.get(id_pa);
                    if (id_p) {
                        if (!products.has(id_p)) {
                            products.set(id_p, { id: id_p, names: new Set(), formats: new Set() });
                        }
                        const p = products.get(id_p)!;

                        // Map attribute ID to format name
                        // We know 1=imprimat, 2=cu diagramă from manual inspection, but let's use the map if available
                        // Or just hardcode for reliability based on the dump analysis
                        if (id_attr === 1) p.formats.add('Printed');
                        if (id_attr === 2) p.formats.add('Diagram');
                    }
                }
                // We might need product_attribute_combination later if we want to distinguish printed vs diagram
                // But 'details' in product_attribute often contains enough info? 
                // Actually, looking at the dump, 'details' only had size.
                // The 'imprimat' vs 'diagrama' info is likely in the attribute combination.
            } catch (e) {
                // Ignore parse errors for individual lines
            }
        }
    }

    // Merge dimensions and SKUs into products
    for (const [id, dims] of productDimensions) {
        if (products.has(id)) {
            products.get(id)!.dimensions = dims;
        }
    }
    for (const [id, sku] of productSkus) {
        if (products.has(id)) {
            products.get(id)!.sku = sku;
        }
    }

    console.log(`Parsed ${products.size} products.`);

    // Now update Supabase
    let updatedCount = 0;

    // Batch updates
    const updates = Array.from(products.values()).filter(p => p.colors || p.dimensions || p.formats.size > 0);
    console.log(`Found ${updates.length} products with new data.`);

    for (const p of updates) {
        let sbProducts = null;

        // 1. Try matching by SKU first (Most reliable)
        if (p.sku) {
            const { data, error } = await supabase
                .from('products')
                .select('id, title, sku')
                .or(`sku.eq.${p.sku},sku.eq.HUD-${p.sku}`); // Try both '057' and 'HUD-057'
            
            if (data && data.length > 0) {
                sbProducts = data;
            }
        }

        // 2. Fallback to Name match if SKU didn't find anything
        if (!sbProducts) {
            for (const name of p.names) {
                const { data, error } = await supabase
                    .from('products')
                    .select('id, title')
                    .eq('title', name);
                
                if (data && data.length > 0) {
                    sbProducts = data;
                    break; // Found a match
                }
            }
        }

        if (sbProducts && sbProducts.length > 0) {
            // Update all matched products (could be multiple if duplicate titles but that's handled by SKU now for specific ones)
            for (const sbProduct of sbProducts) {
                const updateData: any = {};
                if (p.colors) updateData.colors = p.colors;
                if (p.dimensions) updateData.dimensions = p.dimensions;
                if (p.formats.size > 0) updateData.formats = Array.from(p.formats);

                if (Object.keys(updateData).length > 0) {
                    const { error: updateError } = await supabase
                        .from('products')
                        .update(updateData)
                        .eq('id', sbProduct.id);

                    if (!updateError) {
                        updatedCount++;
                        if (updatedCount <= 5) {
                            console.log(`Updated ${sbProduct.title} (ID: ${sbProduct.id}) with dims: ${p.dimensions}, colors: ${p.colors}`);
                        }
                        if (updatedCount % 50 === 0) process.stdout.write('.');
                    } else {
                        console.error(`Failed to update ${sbProduct.title}:`, updateError.message);
                    }
                }
            }
        }
    }

    console.log(`\nUpdated ${updatedCount} products in Supabase.`);
}

extractAndSync().catch(console.error);
