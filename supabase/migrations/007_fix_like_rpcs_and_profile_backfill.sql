-- ============================================================
-- Fix like RPC parameter ambiguity and guarantee profile rows
-- for existing and future auth users.
-- ============================================================

insert into public.profiles (id, username)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data->>'username', ''),
    nullif(split_part(u.email, '@', 1), ''),
    'user'
  ) as username
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      nullif(split_part(new.email, '@', 1), ''),
      'user'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user_profile();

create or replace function public.increment_likes(p_post_id uuid)
returns void
language sql
security definer
as $$
  update public.posts as p
  set likes = p.likes + 1
  where p.id = p_post_id;
$$;

create or replace function public.decrement_likes(p_post_id uuid)
returns void
language sql
security definer
as $$
  update public.posts as p
  set likes = greatest(p.likes - 1, 0)
  where p.id = p_post_id;
$$;
