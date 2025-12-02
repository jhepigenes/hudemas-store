
-- Allow users to update their own profile
create policy "Users can update own profile"
on profiles for update
using ( auth.uid() = id );

-- Allow users to insert their own profile (usually handled by trigger, but safe to add)
create policy "Users can insert own profile"
on profiles for insert
with check ( auth.uid() = id );
