
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pg from 'pg';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !DB_PASSWORD) {
    console.error('Missing credentials in .env.local (Need URL, ANON_KEY, and DB_PASSWORD)');
    process.exit(1);
}

// Supabase client for Storage (using Anon Key - requires Policy)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Postgres client for Data (Direct Connection)
const dbConfig = {
    user: 'postgres',
    password: DB_PASSWORD,
    host: 'db.msepwdbzrzqotapgesnd.supabase.co', // Hardcoded based on project ref
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

const pool = new pg.Pool(dbConfig);

const SQL_FILE_PATH = path.resolve('../hudemas_hudemas20140317.sql');
const IMAGES_BASE_PATH = path.resolve('../extracted_images/images/products/large');

// Data structures
interface Category {
    id: number;
    name?: string;
    description?: string;
    slug?: string;
}

interface Product {
    id: number;
    categoryId: number;
    price: number;
    name?: string;
    description?: string;
    imageFilename?: string;
    reference?: string;
}

const categories: Map<number, Category> = new Map();
const products: Map<number, Product> = new Map();

async function main() {
    const isDryRun = process.argv.includes('--dry-run');
    console.log(`Starting migration... Dry Run: ${isDryRun}`);

    if (!fs.existsSync(SQL_FILE_PATH)) {
        console.error(`SQL file not found at ${SQL_FILE_PATH}`);
        process.exit(1);
    }

    const sqlContent = fs.readFileSync(SQL_FILE_PATH, 'utf-8');

    console.log('Parsing SQL dump...');
    parseCategories(sqlContent);
    parseCategoryLang(sqlContent);
    parseProducts(sqlContent);
    parseProductLang(sqlContent);

    console.log(`Found ${categories.size} categories and ${products.size} products.`);

    if (isDryRun) {
        console.log('Dry run complete.');
        return;
    }

    const client = await pool.connect();
    try {
        console.log('Connected to Database.');

        // Upload Categories
        for (const cat of categories.values()) {
            if (!cat.name) continue;

            const slug = cat.slug || slugify(cat.name);

            // Upsert Category with ID preservation
            const query = `
        INSERT INTO categories (id, name, slug, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description;
      `;
            await client.query(query, [cat.id, cat.name, slug, cat.description]);
        }
        console.log('Categories synced.');

        // Upload Products
        for (const prod of products.values()) {
            if (!prod.name) continue;

            let publicUrl = null;
            if (prod.imageFilename) {
                const imagePath = path.join(IMAGES_BASE_PATH, prod.imageFilename);
                if (fs.existsSync(imagePath)) {
                    const fileBuffer = fs.readFileSync(imagePath);
                    const { data, error } = await supabase.storage
                        .from('products')
                        .upload(prod.imageFilename, fileBuffer, {
                            contentType: 'image/jpeg',
                            upsert: true
                        });

                    if (!error && data) {
                        const { data: publicUrlData } = supabase.storage
                            .from('products')
                            .getPublicUrl(data.path);
                        publicUrl = publicUrlData.publicUrl;
                    } else if (error) {
                        console.error(`Error uploading image ${prod.imageFilename}:`, error.message);
                    }
                }
            }

            // Resolve Category Name
            const cat = categories.get(prod.categoryId);
            const categoryName = cat ? cat.name : null;

            // Upsert Product
            // Map: name->title, reference->sku, price->price, stock->stock_quantity
            // Use SKU (reference) for unique check if available, else name?
            // Legacy 'reference' is varchar(8).
            // If reference is missing, we might have issues.
            // Let's assume reference exists (it was NOT NULL in SQL).

            const sku = prod.reference || `SKU-${prod.id}`;
            const slug = slugify(prod.name) + `-${sku}`; // Ensure unique slug

            // Check if exists by SKU
            let checkRes = await client.query('SELECT id FROM products WHERE sku = $1', [sku]);

            // If not found by SKU, check by Slug (to avoid collision with existing data like HUD-001 vs 001)
            if (checkRes.rows.length === 0) {
                checkRes = await client.query('SELECT id FROM products WHERE slug = $1', [slug]);
            }

            if (checkRes.rows.length > 0) {
                // Update
                const updateQuery = `
            UPDATE products SET
              title = $2,
              description = $3,
              price = $4,
              image_url = $5,
              category = $6,
              stock_quantity = 10,
              slug = $7,
              sku = $8
            WHERE id = $1
          `;
                await client.query(updateQuery, [
                    checkRes.rows[0].id,
                    prod.name,
                    prod.description,
                    prod.price,
                    publicUrl,
                    categoryName,
                    slug,
                    sku // Update SKU to match legacy (or keep? let's overwrite to be consistent with legacy)
                ]);
            } else {
                // Insert
                const insertQuery = `
            INSERT INTO products (title, description, price, image_url, category, stock_quantity, sku, slug)
            VALUES ($1, $2, $3, $4, $5, 10, $6, $7)
          `;
                await client.query(insertQuery, [
                    prod.name,
                    prod.description,
                    prod.price,
                    publicUrl,
                    categoryName,
                    sku,
                    slug
                ]);
            }
            console.log(`Processed product: ${prod.name} (${sku})`);
        }

    } catch (err) {
        console.error('Database error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

// ... Parsing functions (same as before) ...
function parseCategories(sql: string) {
    const regex = /INSERT INTO `category` \([^)]+\) VALUES\s+([\s\S]+?);/g;
    let match;
    while ((match = regex.exec(sql)) !== null) {
        const valuesStr = match[1];
        const rows = valuesStr.split(/\),\s*\(/);
        rows.forEach(row => {
            const cleanRow = row.replace(/^\(/, '').replace(/\)$/, '');
            const cols = splitSqlValues(cleanRow);
            const id = parseInt(cols[0]);
            categories.set(id, { id });
        });
    }
}

function parseCategoryLang(sql: string) {
    const regex = /INSERT INTO `category_lang` \([^)]+\) VALUES\s+([\s\S]+?);/g;
    let match;
    while ((match = regex.exec(sql)) !== null) {
        const valuesStr = match[1];
        const rows = valuesStr.split(/\),\s*\(/);
        rows.forEach(row => {
            const cleanRow = row.replace(/^\(/, '').replace(/\)$/, '');
            const cols = splitSqlValues(cleanRow);
            const idCategory = parseInt(cols[1]);
            const name = cols[3].replace(/^'|'$/g, '');
            const description = cols[5].replace(/^'|'$/g, '');
            const slug = cols[8].replace(/^'|'$/g, '');

            if (categories.has(idCategory)) {
                const cat = categories.get(idCategory)!;
                cat.name = name;
                cat.description = description;
                cat.slug = slug;
            }
        });
    }
}

function parseProducts(sql: string) {
    const regex = /INSERT INTO `product` \([^)]+\) VALUES\s+([\s\S]+?);/g;
    let match;
    while ((match = regex.exec(sql)) !== null) {
        const valuesStr = match[1];
        const rows = valuesStr.split(/\),\s*\(/);
        rows.forEach(row => {
            const cleanRow = row.replace(/^\(/, '').replace(/\)$/, '');
            const cols = splitSqlValues(cleanRow);
            const id = parseInt(cols[0]);
            const categoryId = parseInt(cols[1]);
            const price = parseFloat(cols[3]);
            const reference = cols[12].replace(/^'|'$/g, '');
            const image = cols[13].replace(/^'|'$/g, '');

            products.set(id, { id, categoryId, price, reference, imageFilename: image });
        });
    }
}

function parseProductLang(sql: string) {
    const regex = /INSERT INTO `product_lang` \([^)]+\) VALUES\s+([\s\S]+?);/g;
    let match;
    while ((match = regex.exec(sql)) !== null) {
        const valuesStr = match[1];
        const rows = valuesStr.split(/\),\s*\(/);
        rows.forEach(row => {
            const cleanRow = row.replace(/^\(/, '').replace(/\)$/, '');
            const cols = splitSqlValues(cleanRow);
            const idProduct = parseInt(cols[1]);
            const name = cols[3].replace(/^'|'$/g, '');
            const description = cols[4].replace(/^'|'$/g, '');

            if (products.has(idProduct)) {
                const prod = products.get(idProduct)!;
                prod.name = name;
                prod.description = description;
            }
        });
    }
}

function splitSqlValues(str: string): string[] {
    const result = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === "'" && str[i - 1] !== '\\') {
            inQuote = !inQuote;
        }
        if (char === ',' && !inQuote) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

main().catch(console.error);
