
import { Client } from 'pg';

const connectionString = 'postgres://postgres:hudemasajo@db.msepwdbzrzqotapgesnd.supabase.co:5432/postgres';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Supabase requires SSL
});

async function fixBrokenImages() {
    console.log('Connecting to database...');
    try {
        await client.connect();
        console.log('Connected.');

        const brokenImageUrl = 'https://www.hudemas.ro/assets/images/products/large/goblen-hudemas-005-fata-in-alb-256.jpg';

        console.log(`Deleting listing with image: ${brokenImageUrl}`);
        const res = await client.query('DELETE FROM marketplace_listings WHERE image_url = $1', [brokenImageUrl]);

        console.log(`Deleted ${res.rowCount} rows.`);
    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

fixBrokenImages();
