
import postgres from 'postgres';

const connectionString = 'postgres://postgres.msepwdbzrzqotapgesnd:hudemasajo@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

const sql = postgres(connectionString);

async function run() {
    try {
        await sql`
            do $$ begin
            create policy "Users can update own profile"
            on profiles for update
            using ( auth.uid() = id );
            exception when duplicate_object then null; end $$;
        `;
        console.log('Policy update created');

        await sql`
            do $$ begin
            create policy "Users can insert own profile"
            on profiles for insert
            with check ( auth.uid() = id );
            exception when duplicate_object then null; end $$;
        `;
        console.log('Policy insert created');

        await sql`alter table profiles add column if not exists phone text`;
        await sql`alter table profiles add column if not exists address text`;
        await sql`alter table profiles add column if not exists city text`;
        await sql`alter table profiles add column if not exists county text`;
        await sql`alter table profiles add column if not exists country text`;
        await sql`alter table profiles add column if not exists zip_code text`;
        
        console.log('Columns ensured');
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

run();
