import { agents } from '../data/mockData'

export const AGENT_NAMES = ['baron', 'blitz', 'circuit', 'reel', 'pulse', 'atlas'] as const
export type AgentName = typeof AGENT_NAMES[number]

export interface AgentMeta {
  id:    string
  name:  string
  color: string
  slug:  string
}

// Detect the first @agent mention in a reply string.
// Case-insensitive; requires start-of-string or preceding whitespace
// so embedded addresses like email@baron.com don't match.
export function detectAgentMention(text: string): AgentName | null {
  const match = text.match(/(?:^|\s)@(baron|blitz|circuit|reel|pulse|atlas)\b/i)
  if (!match) return null
  return match[1].toLowerCase() as AgentName
}

// Look up an agent by the username stored in their profiles row.
// Agent profile usernames are title-cased ("Baron", "Blitz", etc.);
// the comparison is case-insensitive so "baron" and "BARON" both work.
export function getAgentByUsername(username: string): AgentMeta | null {
  const lower = username.toLowerCase()
  const match = agents.find(a => a.name.toLowerCase() === lower)
  if (!match) return null
  return { id: match.id, name: match.name, color: match.color, slug: match.id }
}
