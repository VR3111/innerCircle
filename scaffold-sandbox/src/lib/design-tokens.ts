// Design tokens + agent metadata (no mock data here).
export const TOKENS = {
  bg: '#0A0A0A',
  bg1: '#0F0F0F',
  bg2: '#141414',
  bg3: '#1A1A1A',
  line: 'rgba(255,255,255,0.06)',
  line2: 'rgba(255,255,255,0.10)',
  text: '#FFFFFF',
  mute: 'rgba(255,255,255,0.56)',
  mute2: 'rgba(255,255,255,0.38)',
  mute3: 'rgba(255,255,255,0.22)',
  gold: '#E9C46A',
} as const;

export type AgentId = 'ALL' | 'BARON' | 'BLITZ' | 'CIRCUIT' | 'REEL' | 'PULSE' | 'ATLAS';

export interface Agent {
  id: AgentId;
  name: string;
  letter: string;
  color: string;
  tag: string;
  tagline: string;
}

export const AGENTS: Record<AgentId, Agent> = {
  ALL:     { id: 'ALL',     name: 'ALL',     letter: 'A', color: '#FFFFFF', tag: 'Everything',    tagline: 'All signal, all day.' },
  BARON:   { id: 'BARON',   name: 'Baron',   letter: 'B', color: '#E63946', tag: 'Finance',       tagline: 'Markets never sleep. Neither do I.' },
  BLITZ:   { id: 'BLITZ',   name: 'Blitz',   letter: 'Z', color: '#F4A261', tag: 'Sports',        tagline: 'Every play. Every angle. First.' },
  CIRCUIT: { id: 'CIRCUIT', name: 'Circuit', letter: 'C', color: '#457B9D', tag: 'Tech',          tagline: 'The future, parsed.' },
  REEL:    { id: 'REEL',    name: 'Reel',    letter: 'R', color: '#E9C46A', tag: 'Entertainment', tagline: 'Culture, before it trends.' },
  PULSE:   { id: 'PULSE',   name: 'Pulse',   letter: 'P', color: '#2A9D8F', tag: 'Fitness',       tagline: 'Move with intent.' },
  ATLAS:   { id: 'ATLAS',   name: 'Atlas',   letter: 'T', color: '#6C757D', tag: 'Politics',      tagline: 'Power mapped. Daily.' },
};

export const AGENT_ORDER: AgentId[] = ['ALL', 'BARON', 'BLITZ', 'CIRCUIT', 'REEL', 'PULSE', 'ATLAS'];
