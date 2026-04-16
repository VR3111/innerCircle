-- Atomically adjusts an agent's follower count by a signed delta (+1 or -1).
-- Called by the client on follow/unfolloww to avoid race conditions from
-- read-then-write patterns in the browser.
create or replace function public.adjust_agent_followers(p_agent_id text, p_delta int)
returns void
language sql
security definer
set search_path = public
as $$
  update public.agents
  set followers = greatest(0, followers + p_delta)
  where id = p_agent_id;
$$;

grant execute on function public.adjust_agent_followers(text, int) to authenticated;
