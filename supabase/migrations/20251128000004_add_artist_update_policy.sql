do $$ begin
  create policy "Users can update their own artist profile." on artists for update using ( auth.uid() = id );
exception when duplicate_object then null; end $$;
