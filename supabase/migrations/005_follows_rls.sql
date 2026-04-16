-- Row-level security for the follows table.
-- Without these policies the JS client cannot read, insert, or delete rows,
-- causing the following count to always show 0 even when follows exist.

alter table public.follows enable row level security;

create policy "follows_select_own"
  on public.follows for select
  using (auth.uid() = user_id);

create policy "follows_insert_own"
  on public.follows for insert
  with check (auth.uid() = user_id);

create policy "follows_delete_own"
  on public.follows for delete
  using (auth.uid() = user_id);
