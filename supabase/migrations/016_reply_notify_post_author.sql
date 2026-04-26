-- ============================================================
-- Migration 016: Fix reply notification to include post author
--
-- Bug: create_reply_notification() (from 008) only notified
-- co-repliers — users who had previously replied on the same
-- post. The post AUTHOR (posts.user_id) was never notified
-- when someone replied to their post.
--
-- Fix: UNION the post author into the target set so both
-- co-repliers AND the original poster receive notifications.
--
-- Idempotent: CREATE OR REPLACE overwrites the function body
-- while preserving the existing trigger binding.
-- ============================================================

create or replace function public.create_reply_notification()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  -- Skip anonymous / agent inserts
  if NEW.user_id is null then
    return NEW;
  end if;

  insert into public.notifications (user_id, type, title, body, is_read, created_at)
  select distinct target_user_id,
    'agent_post',
    'New reply on a post you follow',
    left(NEW.content, 60),
    false,
    now()
  from (
    -- Co-repliers (existing logic from 008)
    select r.user_id as target_user_id
    from public.replies r
    where r.post_id = NEW.post_id
      and r.user_id != NEW.user_id

    union

    -- Post author (new: notify the original poster)
    select p.user_id as target_user_id
    from public.posts p
    where p.id = NEW.post_id
      and p.user_id is not null
      and p.user_id != NEW.user_id
  ) targets;

  return NEW;
end;
$$;
