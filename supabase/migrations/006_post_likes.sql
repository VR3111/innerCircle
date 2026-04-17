-- ============================================================
-- Post Likes
-- ============================================================

create table public.post_likes (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  post_id    uuid        not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create index on public.post_likes (post_id);
create index on public.post_likes (user_id);

alter table public.post_likes enable row level security;

create policy "post_likes_select_all"
  on public.post_likes for select
  using (true);

create policy "post_likes_insert_own"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

create policy "post_likes_delete_own"
  on public.post_likes for delete
  using (auth.uid() = user_id);

-- Atomically increment the likes counter on a post
create or replace function public.increment_likes(p_post_id uuid)
returns void
language sql
security definer
as $$
  update public.posts
  set likes = likes + 1
  where id = p_post_id;
$$;

-- Atomically decrement the likes counter, floored at 0
create or replace function public.decrement_likes(p_post_id uuid)
returns void
language sql
security definer
as $$
  update public.posts
  set likes = greatest(likes - 1, 0)
  where id = p_post_id;
$$;
