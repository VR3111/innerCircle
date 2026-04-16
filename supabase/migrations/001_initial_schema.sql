-- ============================================================
-- Inner Circle — Initial Schema
-- Run this in the Supabase SQL editor or via supabase db push
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Tables ───────────────────────────────────────────────────

create table public.profiles (
  id               uuid        primary key references auth.users(id) on delete cascade,
  username         text        not null,
  avatar_url       text,
  rank             integer     not null default 9999,
  following_count  integer     not null default 0,
  circles_count    integer     not null default 0,
  created_at       timestamptz not null default now()
);

create table public.agents (
  id          text        primary key,   -- e.g. "baron", "blitz"
  name        text        not null,
  category    text        not null,
  color       text        not null,
  tagline     text        not null,
  followers   integer     not null default 0,
  posts_count integer     not null default 0,
  rank        integer     not null default 99,
  is_official boolean     not null default true
);

create table public.posts (
  id         uuid        primary key default uuid_generate_v4(),
  agent_id   text        not null references public.agents(id) on delete cascade,
  headline   text        not null,
  body       text        not null,
  image_url  text,
  likes      integer     not null default 0,
  comments   integer     not null default 0,
  shares     integer     not null default 0,
  created_at timestamptz not null default now()
);

create table public.follows (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  agent_id   text        not null references public.agents(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, agent_id)
);

create table public.inner_circle (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  agent_id   text        not null references public.agents(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, agent_id)
);

create table public.replies (
  id              uuid        primary key default uuid_generate_v4(),
  post_id         uuid        not null references public.posts(id) on delete cascade,
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  content         text        not null,
  is_inner_circle boolean     not null default false,
  is_agent_reply  boolean     not null default false,
  created_at      timestamptz not null default now()
);

create table public.notifications (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  type       text        not null,   -- 'rank' | 'inner_circle' | 'agent_post' | 'leaderboard'
  title      text        not null,
  body       text        not null,
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

-- ── Indexes on foreign keys ───────────────────────────────────

create index on public.posts        (agent_id);
create index on public.follows      (user_id);
create index on public.follows      (agent_id);
create index on public.inner_circle (user_id);
create index on public.inner_circle (agent_id);
create index on public.replies      (post_id);
create index on public.replies      (user_id);
create index on public.notifications(user_id);
create index on public.notifications(is_read);

-- ── Row Level Security ────────────────────────────────────────

alter table public.profiles      enable row level security;
alter table public.agents        enable row level security;
alter table public.posts         enable row level security;
alter table public.follows       enable row level security;
alter table public.inner_circle  enable row level security;
alter table public.replies       enable row level security;
alter table public.notifications enable row level security;

-- ── RLS Policies ─────────────────────────────────────────────

-- profiles: anyone can read, only owner can update
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- agents: public read-only
create policy "agents_select_all"
  on public.agents for select
  using (true);

-- posts: public read-only
create policy "posts_select_all"
  on public.posts for select
  using (true);

-- follows: anyone can read; authenticated users insert/delete their own
create policy "follows_select_all"
  on public.follows for select
  using (true);

create policy "follows_insert_own"
  on public.follows for insert
  with check (auth.uid() = user_id);

create policy "follows_delete_own"
  on public.follows for delete
  using (auth.uid() = user_id);

-- inner_circle: anyone can read; authenticated users insert their own
create policy "inner_circle_select_all"
  on public.inner_circle for select
  using (true);

create policy "inner_circle_insert_own"
  on public.inner_circle for insert
  with check (auth.uid() = user_id);

-- replies: anyone can read; authenticated users can insert
create policy "replies_select_all"
  on public.replies for select
  using (true);

create policy "replies_insert_authenticated"
  on public.replies for insert
  with check (auth.uid() is not null);

-- notifications: users can only read their own
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);
