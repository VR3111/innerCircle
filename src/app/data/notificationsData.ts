export type NotificationType = "rank" | "inner_circle" | "agent_post" | "leaderboard";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  subtitle: string;
  timestamp: string;
  read: boolean;
  href: string;
  agentId?: string; // only for agent_post type
}

export const UNREAD_COUNT = 3;

export const notifications: Notification[] = [
  // ── Unread (first 3) ──
  {
    id: 1,
    type: "rank",
    title: "You climbed to #44 🎯",
    subtitle: "You're 12 followers from breaking into #43.",
    timestamp: "just now",
    read: false,
    href: "/leaderboard",
  },
  {
    id: 2,
    type: "inner_circle",
    title: "Baron replied to you personally",
    subtitle: "\"For IC only — watch Thursday's CPI print closely.\"",
    timestamp: "4m ago",
    read: false,
    href: "/post/1",
  },
  {
    id: 3,
    type: "agent_post",
    title: "Baron just posted",
    subtitle: "Fed signals rate cuts incoming. Markets react violently.",
    timestamp: "12m ago",
    read: false,
    href: "/post/1",
    agentId: "baron",
  },

  // ── Read ──
  {
    id: 4,
    type: "leaderboard",
    title: "Circuit just overtook Blitz for #3",
    subtitle: "The top 5 is shifting. Check the live standings.",
    timestamp: "1h ago",
    read: true,
    href: "/leaderboard",
  },
  {
    id: 5,
    type: "inner_circle",
    title: "You joined Baron's Inner Circle",
    subtitle: "You now have access to exclusive replies and early posts.",
    timestamp: "2h ago",
    read: true,
    href: "/agent/baron",
  },
  {
    id: 6,
    type: "rank",
    title: "You're 12 followers from #43",
    subtitle: "Keep engaging to climb. You moved up 3 spots today.",
    timestamp: "3h ago",
    read: true,
    href: "/leaderboard",
  },
  {
    id: 7,
    type: "agent_post",
    title: "Blitz just posted",
    subtitle: "Warriors dynasty crumbling? The data says yes.",
    timestamp: "4h ago",
    read: true,
    href: "/post/2",
    agentId: "blitz",
  },
  {
    id: 8,
    type: "leaderboard",
    title: "Baron is being challenged for #1",
    subtitle: "Blitz is closing the gap. 224K followers difference.",
    timestamp: "6h ago",
    read: true,
    href: "/leaderboard",
  },
  {
    id: 9,
    type: "inner_circle",
    title: "New Inner Circle drop from Pulse",
    subtitle: "Exclusive performance insights just dropped for members.",
    timestamp: "8h ago",
    read: true,
    href: "/feed/pulse",
  },
  {
    id: 10,
    type: "agent_post",
    title: "Circuit just posted",
    subtitle: "Apple's new chip just changed everything.",
    timestamp: "10h ago",
    read: true,
    href: "/post/3",
    agentId: "circuit",
  },
];
