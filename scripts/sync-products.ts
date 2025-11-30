import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncProducts() {
    // Read products from full_products.json for syncing
    const productsFile = path.resolve(__dirname, '../scraped_data/full_products.json');

    if (!fs.existsSync(productsFile)) {
        console.error(`Products file not found: ${productsFile}`);
        return;
    }

    const productsData = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
    console.log(`Found ${productsData.length} products in ${productsFile}`);

    // Get a user ID to assign as the "seller" (admin)
    let { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    let adminUserId;

    if (userError || !users || users.length === 0) {
        console.log('No users found. Creating admin user...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: 'admin@hudemas.ro',
            password: 'hudemas-admin-123',
            email_confirm: true,
            user_metadata: { full_name: 'Hudemas Admin' }
        });

        if (createError) {
            console.error('Error creating admin user:', createError);
            return;
        }
        adminUserId = newUser.user.id;
        console.log(`Created admin user: ${adminUserId}`);
    } else {
        adminUserId = users[0].id;
        console.log(`Assigning products to existing user: ${adminUserId} (${users[0].email})`);
    }

    // Sync products
    let syncedCount = 0;
    for (const product of productsData) {
        // Use large image if available
        const imageUrl = product.image ? product.image.replace('/small/', '/large/') : '';

        // Try to find by source_url first
        let { data: existing } = await supabase
            .from('marketplace_listings')
            .select('id')
            .eq('source_url', product.url)
            .eq('user_id', adminUserId)
            .single();

        // If not found by source_url, try to find by title (legacy migration)
        if (!existing) {
            const { data: legacy } = await supabase
                .from('marketplace_listings')
                .select('id')
                .eq('title', product.title)
                .eq('user_id', adminUserId)
                .is('source_url', null)
                .maybeSingle();

            if (legacy) {
                existing = legacy;
            }
        }

        const productType = product.product_type || 'kit';

        if (existing) {
            // Update existing product
            const { error } = await supabase
                .from('marketplace_listings')
                .update({
                    price: parseFloat(product.price.replace(',', '.').replace(/[^\d.]/g, '')),
                    image_url: imageUrl,
                    category: product.category || 'Goblenuri',
                    description: product.description || `Goblen: ${product.title}`,
                    source_url: product.url,
                    product_type: productType,
                    stock: 10 // Default stock for now
                })
                .eq('id', existing.id);

            if (error) {
                console.error(`Error updating product ${product.title}:`, error.message);
            }
            continue;
        }

        // Insert new product
        const { error } = await supabase
            .from('marketplace_listings')
            .insert({
                title: product.title,
                description: product.description || `Goblen: ${product.title}`,
                price: parseFloat(product.price.replace(',', '.').replace(/[^\d.]/g, '')),
                currency: 'RON',
                status: 'active',
                image_url: imageUrl,
                user_id: adminUserId,
                category: product.category || 'Goblenuri',
                source_url: product.url,
                product_type: productType,
                stock: 10
            });

        if (error) {
            console.error(`Error inserting product ${product.title}:`, error.message);
        } else {
            console.log(`Synced product: ${product.title} (${productType})`);
            syncedCount++;
        }
    }

    console.log(`Sync complete. Newly synced ${syncedCount} products.`);
}

syncProducts();
