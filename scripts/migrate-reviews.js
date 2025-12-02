import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = 'postgresql://postgres:hudemasajo@db.msepwdbzrzqotapgesnd.supabase.co:5432/postgres';

const sql = postgres(connectionString);

async function migrate() {
    const migrationFile = path.join(__dirname, '../supabase/migrations/20251201_create_reviews.sql');
    const query = fs.readFileSync(migrationFile, 'utf8');

    console.log('Running migration for reviews...');
    try {
        await sql.unsafe(query);
        console.log('✅ Migration successful: reviews table created.');
    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        await sql.end();
    }
}

migrate();
