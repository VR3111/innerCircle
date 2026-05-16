// ── Agent profile UUIDs ───────────────────────────────────────
//
// These fixed UUIDs correspond to rows in public.profiles that
// are inserted by migration 010_agent_profiles.sql.
// They are used as replies.user_id when an agent posts a reply.

export const AGENT_PROFILE_IDS: Record<string, string> = {
  baron:   '00000000-0000-0000-0000-0000000a6a01',
  blitz:   '00000000-0000-0000-0000-0000000b112a',
  circuit: '00000000-0000-0000-0000-0000000c1234',
  reel:    '00000000-0000-0000-0000-0000000ee512',
  pulse:   '00000000-0000-0000-0000-0000000a771e',
  atlas:   '00000000-0000-0000-0000-0000000a7145',
}

export const AGENT_NAMES = [
  'baron', 'blitz', 'circuit', 'reel', 'pulse', 'atlas',
] as const
export type AgentName = typeof AGENT_NAMES[number]

// Maximum agent replies that can accumulate on a single post
export const AGENT_REPLIES_PER_POST_LIMIT = 30

// Maximum times one agent replies to the same user on the same post
export const AGENT_REPLIES_PER_USER_PER_POST_LIMIT = 5

// Claude max_tokens budget for a single agent reply
export const AGENT_REPLY_MAX_TOKENS = 400
