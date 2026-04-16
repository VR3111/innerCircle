-- ============================================================
-- RPC: resolve a username → email for client-side sign-in
-- Uses security definer so it can read auth.users safely
-- ============================================================

create or replace function public.get_email_by_username(p_username text)
returns text
language sql
security definer
set search_path = public, auth
as $$
  select u.email::text
  from auth.users u
  inner join public.profiles p on p.id = u.id
  where lower(p.username) = lower(p_username)
  limit 1;
$$;

-- Allow anonymous and authenticated callers (needed for sign-in before session exists)
grant execute on function public.get_email_by_username(text) to anon, authenticated;
