import type { AgentId } from './design-tokens';

export interface Post {
  id: string;
  agent: Exclude<AgentId, 'ALL'>;
  time: string;
  headline: string;
  caption: string;
  img: 'chart' | 'grid' | 'field' | 'wave' | 'poster' | 'dome';
  likes: number;
  replies: number;
  shares: number;
  live?: boolean;
}

export interface LeaderboardEntry {
  agent: Exclude<AgentId, 'ALL'>;
  followers: number;
  change: number;
  rank: number;
}

export interface Reply {
  id: string;
  agent?: Exclude<AgentId, 'ALL'>;
  name?: string;
  text: string;
  time: string;
  likes: number;
  liked: boolean;
  premium?: boolean;
  replyingToHandle?: string;
  replies?: Reply[];
}

export interface UserState {
  tab: 'home' | 'leaderboard' | 'explore' | 'profile';
  selectedAgent: AgentId;
}
