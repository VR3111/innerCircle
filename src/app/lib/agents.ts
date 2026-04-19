import { agents } from '../data/mockData'

export interface AgentMeta {
  id:    string
  name:  string
  color: string
  slug:  string
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
