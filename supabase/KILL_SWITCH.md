# Kill Switch — Step 1 Triggers

Run the SQL blocks below in the Supabase SQL Editor
(project `xjhwepzhqfmyiabisvqb`) if anything behaves unexpectedly
after migration 013 is applied.

---

## If something breaks after migration 013

Paste this into the SQL Editor and run it immediately.
Disables all six Step-1 triggers without removing them.

```sql
ALTER TABLE user_follows DISABLE TRIGGER on_user_follow_insert;
ALTER TABLE user_follows DISABLE TRIGGER on_user_follow_delete;
ALTER TABLE posts        DISABLE TRIGGER on_user_post_insert;
ALTER TABLE posts        DISABLE TRIGGER on_user_post_delete;
ALTER TABLE replies      DISABLE TRIGGER on_user_reply_signal_insert;
ALTER TABLE replies      DISABLE TRIGGER on_user_reply_signal_delete;
```

---

## Re-enable

Once you've diagnosed the issue, re-enable with:

```sql
ALTER TABLE user_follows ENABLE TRIGGER on_user_follow_insert;
ALTER TABLE user_follows ENABLE TRIGGER on_user_follow_delete;
ALTER TABLE posts        ENABLE TRIGGER on_user_post_insert;
ALTER TABLE posts        ENABLE TRIGGER on_user_post_delete;
ALTER TABLE replies      ENABLE TRIGGER on_user_reply_signal_insert;
ALTER TABLE replies      ENABLE TRIGGER on_user_reply_signal_delete;
```

---

## Permanent removal

If the triggers need to be fully removed (e.g., rolling back to manual counter updates):

```sql
DROP TRIGGER IF EXISTS on_user_follow_insert       ON user_follows;
DROP TRIGGER IF EXISTS on_user_follow_delete       ON user_follows;
DROP TRIGGER IF EXISTS on_user_post_insert         ON posts;
DROP TRIGGER IF EXISTS on_user_post_delete         ON posts;
DROP TRIGGER IF EXISTS on_user_reply_signal_insert ON replies;
DROP TRIGGER IF EXISTS on_user_reply_signal_delete ON replies;
```

---

## What disabling does

- Triggers stop firing **immediately** on the next write.
- Existing data in `profiles` is **unchanged** — no rollback of counts.
- `posts_count`, `followers_count`, `user_following_count`, and `signal_score`
  stop auto-updating on writes. The Profile screen will display stale counts
  until the triggers are re-enabled or the counts are manually reconciled.
- **Agent reply pipeline is UNAFFECTED.** The `on_user_reply_signal_insert` /
  `on_user_reply_signal_delete` triggers filter on `is_agent_reply = false`,
  so agent replies (set by `/api/agent-reply`) are always skipped — disabling
  these triggers changes nothing for the agent pipeline.
- **Cron post pipeline is UNAFFECTED.** The `on_user_post_insert` /
  `on_user_post_delete` triggers filter on `user_id IS NOT NULL`, so
  agent posts inserted by `/api/generate-posts` (with `user_id = NULL`)
  are always skipped.
