-- ============================================================
-- Allow authenticated users to insert their own profile row
-- Required for client-side profile creation on first sign-up
-- ============================================================

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);
