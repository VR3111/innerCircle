-- ============================================================
-- Migration 008: Notifications RLS policies + reply trigger
--
-- Prerequisites (already in 001_initial_schema.sql):
--   - notifications table created
--   - RLS enabled on notifications
--   - SELECT policy "notifications_select_own" exists
-- ============================================================

-- ── Additional RLS policies ───────────────────────────────────

-- UPDATE: owner can mark their own notifications read
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id);

-- DELETE: owner can dismiss their own notifications
drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- (No direct INSERT policy — inserts go through the SECURITY DEFINER trigger below)

-- ── Trigger function: notify co-repliers on new reply ─────────
--
-- When user A posts a reply on a post, find every distinct user
-- who has previously replied to that same post (excluding A),
-- and insert one notification row per user.

create or replace function public.create_reply_notification()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  -- Skip anonymous inserts
  if NEW.user_id is null then
    return NEW;
  end if;

  -- Insert one notification for each distinct co-replier
  insert into public.notifications (user_id, type, title, body, is_read, created_at)
  select distinct r.user_id,
    'agent_post',
    'New reply on a post you follow',
    left(NEW.content, 60),
    false,
    now()
  from public.replies r
  where r.post_id = NEW.post_id
    and r.user_id != NEW.user_id;

  return NEW;
end;
$$;

-- ── Trigger ──────────────────────────────────────────────────

drop trigger if exists on_reply_insert on public.replies;

create trigger on_reply_insert
  after insert on public.replies
  for each row execute function public.create_reply_notification();
