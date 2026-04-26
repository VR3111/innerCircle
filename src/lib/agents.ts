export const AGENT_NAMES = ['baron', 'blitz', 'circuit', 'reel', 'pulse', 'atlas'] as const
export type AgentName = typeof AGENT_NAMES[number]

// Fixed UUIDs from api/_agents/constants.ts — correspond to profile rows
// inserted by migration 010_agent_profiles.sql.
export const AGENT_PROFILE_IDS: Record<AgentName, string> = {
  baron:   '00000000-0000-0000-0000-0000000a6a01',
  blitz:   '00000000-0000-0000-0000-0000000b112a',
  circuit: '00000000-0000-0000-0000-0000000c1234',
  reel:    '00000000-0000-0000-0000-0000000ee512',
  pulse:   '00000000-0000-0000-0000-0000000a771e',
  atlas:   '00000000-0000-0000-0000-0000000a7145',
}

export interface AgentMeta {
  id:       string   // slug (e.g. 'baron')
  name:     string   // display name (e.g. 'Baron')
  color:    string   // hex color
  category: string   // human-readable category
  profileId: string  // Supabase profile UUID
}

export const AGENTS: AgentMeta[] = [
  { id: 'baron',   name: 'Baron',   color: '#E63946', category: 'Finance',       profileId: AGENT_PROFILE_IDS.baron },
  { id: 'blitz',   name: 'Blitz',   color: '#F4A261', category: 'Sports',        profileId: AGENT_PROFILE_IDS.blitz },
  { id: 'circuit', name: 'Circuit', color: '#457B9D', category: 'Tech',          profileId: AGENT_PROFILE_IDS.circuit },
  { id: 'reel',    name: 'Reel',    color: '#E9C46A', category: 'Entertainment', profileId: AGENT_PROFILE_IDS.reel },
  { id: 'pulse',   name: 'Pulse',   color: '#2A9D8F', category: 'Fitness',       profileId: AGENT_PROFILE_IDS.pulse },
  { id: 'atlas',   name: 'Atlas',   color: '#6C757D', category: 'Politics',      profileId: AGENT_PROFILE_IDS.atlas },
]

// Detect the first @agent mention in a reply string.
export function detectAgentMention(text: string): AgentName | null {
  const match = text.match(/(?:^|\s)@(baron|blitz|circuit|reel|pulse|atlas)\b/i)
  if (!match) return null
  return match[1].toLowerCase() as AgentName
}

// Look up an agent by the username stored in their profiles row.
export function getAgentByUsername(username: string): AgentMeta | null {
  const lower = username.toLowerCase()
  return AGENTS.find(a => a.name.toLowerCase() === lower) ?? null
}
