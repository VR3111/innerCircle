// leaderboard-mock.ts — per-category user rankings for the new Arenas hub.
// Replaces the flat LEADERBOARD array in mock-data.ts which ranked agents
// against each other (the old, discarded premise).
//
// Data rules:
//   - Each category has 20-25 visible users (enough to scroll)
//   - "taylor.alpha" is the YOU user (from Settings); placed at varying ranks:
//       BARON   → rank 12  (in users array at index 11)
//       BLITZ   → rank 47  (NOT in users array; yourRank field used)
//       CIRCUIT → rank 7   (in users array at index 6)
//       REEL    → rank 23  (in users array at index 22)
//       PULSE   → unranked (NOT in users array; yourRank: null)
//       ATLAS   → rank 89  (NOT in users array; yourRank field used)
//   - Scores descend from ~9500 (rank 1) to ~2700 (rank 25) with variation
//   - Change deltas: -50 to +80 range, bias toward small positives

import type { AgentId } from './design-tokens';

export type CategoryAgentId = Exclude<AgentId, 'ALL'>;

export interface LeaderboardUser {
  id: string;
  handle: string;
  initials: string; // 1-2 chars for avatar circle
  signalScore: number; // 0-9999 range
  change: number; // signed int delta this week
}

export interface CategoryData {
  agentId: CategoryAgentId;
  activeUsers: number;
  weeklyGrowthPct: number; // e.g. 18 means +18%
  users: LeaderboardUser[]; // sorted by rank (index 0 = rank 1); may not include YOU
  yourRank: number | null; // null = unranked
  yourScore: number | null;
  yourChange: number | null;
}

// ─── BARON · Finance ──────────────────────────────────────────────────────────
// taylor.alpha is rank 12 (index 11 in users array)
const BARON_USERS: LeaderboardUser[] = [
  { id: 'devon_w',       handle: 'devon_w',       initials: 'DW', signalScore: 9487, change: +62 },
  { id: 'nina.j',        handle: 'nina.j',         initials: 'NJ', signalScore: 9241, change: +34 },
  { id: 'monetary.mav',  handle: 'monetary.mav',   initials: 'MM', signalScore: 9012, change: +18 },
  { id: 'quantrose',     handle: 'quantrose',       initials: 'QR', signalScore: 8756, change: +41 },
  { id: 'serena_k',      handle: 'serena_k',        initials: 'SK', signalScore: 8503, change: -12 },
  { id: 'alex.m',        handle: 'alex.m',          initials: 'AM', signalScore: 8190, change: +28 },
  { id: 'riley.x',       handle: 'riley.x',         initials: 'RX', signalScore: 7843, change:  +5 },
  { id: 'marcus.c',      handle: 'marcus.c',        initials: 'MC', signalScore: 7521, change: -19 },
  { id: 'priya.t',       handle: 'priya.t',         initials: 'PT', signalScore: 7289, change: +33 },
  { id: 'will.b',        handle: 'will.b',          initials: 'WB', signalScore: 7043, change:  -8 },
  { id: 'jade.w',        handle: 'jade.w',          initials: 'JW', signalScore: 6812, change: +17 },
  { id: 'taylor.alpha',  handle: 'taylor.alpha',    initials: 'TA', signalScore: 5834, change:  +3 }, // YOU · rank 12
  { id: 'oliver.b',      handle: 'oliver.b',        initials: 'OB', signalScore: 5601, change: -22 },
  { id: 'zara.k',        handle: 'zara.k',          initials: 'ZK', signalScore: 5380, change: +44 },
  { id: 'finn.r',        handle: 'finn.r',          initials: 'FR', signalScore: 5140, change:  -6 },
  { id: 'caden.m',       handle: 'caden.m',         initials: 'CM', signalScore: 4933, change: +11 },
  { id: 'leo.p',         handle: 'leo.p',           initials: 'LP', signalScore: 4720, change:  -3 },
  { id: 'mia.s',         handle: 'mia.s',           initials: 'MS', signalScore: 4487, change:  +8 },
  { id: 'noah.t',        handle: 'noah.t',          initials: 'NT', signalScore: 4231, change: -27 },
  { id: 'ava.g',         handle: 'ava.g',           initials: 'AG', signalScore: 4018, change: +52 },
  { id: 'eli.r',         handle: 'eli.r',           initials: 'ER', signalScore: 3795, change:  +4 },
  { id: 'luna.v',        handle: 'luna.v',          initials: 'LV', signalScore: 3542, change: -16 },
  { id: 'sam.h',         handle: 'sam.h',           initials: 'SH', signalScore: 3310, change: +19 },
  { id: 'kai.d',         handle: 'kai.d',           initials: 'KD', signalScore: 3087, change:  -9 },
  { id: 'bri.n',         handle: 'bri.n',           initials: 'BN', signalScore: 2834, change:  +7 },
];

// ─── BLITZ · Sports ───────────────────────────────────────────────────────────
// taylor.alpha is rank 47 — outside the displayed list; stored in yourRank field
const BLITZ_USERS: LeaderboardUser[] = [
  { id: 'devon_w',      handle: 'devon_w',      initials: 'DW', signalScore: 9312, change: +71 },
  { id: 'marcus.c',     handle: 'marcus.c',     initials: 'MC', signalScore: 8934, change: +45 },
  { id: 'alex.m',       handle: 'alex.m',       initials: 'AM', signalScore: 8756, change:  -8 },
  { id: 'priya.t',      handle: 'priya.t',      initials: 'PT', signalScore: 8490, change: +38 },
  { id: 'serena_k',     handle: 'serena_k',     initials: 'SK', signalScore: 8203, change: +14 },
  { id: 'will.b',       handle: 'will.b',       initials: 'WB', signalScore: 7887, change: -23 },
  { id: 'nina.j',       handle: 'nina.j',       initials: 'NJ', signalScore: 7651, change:  +9 },
  { id: 'riley.x',      handle: 'riley.x',      initials: 'RX', signalScore: 7342, change: +55 },
  { id: 'jade.w',       handle: 'jade.w',       initials: 'JW', signalScore: 7089, change:  -4 },
  { id: 'zara.k',       handle: 'zara.k',       initials: 'ZK', signalScore: 6843, change: +31 },
  { id: 'noah.t',       handle: 'noah.t',       initials: 'NT', signalScore: 6521, change: +19 },
  { id: 'kai.d',        handle: 'kai.d',        initials: 'KD', signalScore: 6290, change: -11 },
  { id: 'bri.n',        handle: 'bri.n',        initials: 'BN', signalScore: 6034, change: +28 },
  { id: 'oliver.b',     handle: 'oliver.b',     initials: 'OB', signalScore: 5809, change: -37 },
  { id: 'ava.g',        handle: 'ava.g',        initials: 'AG', signalScore: 5601, change:  +6 },
  { id: 'finn.r',       handle: 'finn.r',       initials: 'FR', signalScore: 5367, change: +43 },
  { id: 'caden.m',      handle: 'caden.m',      initials: 'CM', signalScore: 5140, change: -18 },
  { id: 'eli.r',        handle: 'eli.r',        initials: 'ER', signalScore: 4912, change: +22 },
  { id: 'mia.s',        handle: 'mia.s',        initials: 'MS', signalScore: 4688, change:  -9 },
  { id: 'leo.p',        handle: 'leo.p',        initials: 'LP', signalScore: 4431, change: +15 },
  { id: 'sam.h',        handle: 'sam.h',        initials: 'SH', signalScore: 4213, change: -31 },
  { id: 'luna.v',       handle: 'luna.v',       initials: 'LV', signalScore: 3978, change:  +8 },
  { id: 'dex.f',        handle: 'dex.f',        initials: 'DF', signalScore: 3745, change: +47 },
  { id: 'mo.k',         handle: 'mo.k',         initials: 'MK', signalScore: 3489, change: -14 },
  { id: 'tasha.r',      handle: 'tasha.r',      initials: 'TR', signalScore: 3234, change:  +3 },
];

// ─── CIRCUIT · Tech ───────────────────────────────────────────────────────────
// taylor.alpha is rank 7 (index 6 in users array)
const CIRCUIT_USERS: LeaderboardUser[] = [
  { id: 'quantrose',    handle: 'quantrose',    initials: 'QR', signalScore: 9623, change: +58 },
  { id: 'nina.j',       handle: 'nina.j',       initials: 'NJ', signalScore: 9378, change: +42 },
  { id: 'monetary.mav', handle: 'monetary.mav', initials: 'MM', signalScore: 9134, change: -11 },
  { id: 'devon_w',      handle: 'devon_w',      initials: 'DW', signalScore: 8902, change: +25 },
  { id: 'riley.x',      handle: 'riley.x',      initials: 'RX', signalScore: 8643, change: +67 },
  { id: 'serena_k',     handle: 'serena_k',     initials: 'SK', signalScore: 8379, change:  -4 },
  { id: 'taylor.alpha', handle: 'taylor.alpha', initials: 'TA', signalScore: 7234, change: +12 }, // YOU · rank 7
  { id: 'alex.m',       handle: 'alex.m',       initials: 'AM', signalScore: 7021, change: +31 },
  { id: 'jade.w',       handle: 'jade.w',       initials: 'JW', signalScore: 6789, change:  +8 },
  { id: 'marcus.c',     handle: 'marcus.c',     initials: 'MC', signalScore: 6543, change: -19 },
  { id: 'priya.t',      handle: 'priya.t',      initials: 'PT', signalScore: 6312, change: +44 },
  { id: 'will.b',       handle: 'will.b',       initials: 'WB', signalScore: 6089, change:  -7 },
  { id: 'noah.t',       handle: 'noah.t',       initials: 'NT', signalScore: 5843, change: +22 },
  { id: 'ava.g',        handle: 'ava.g',        initials: 'AG', signalScore: 5601, change:  +3 },
  { id: 'eli.r',        handle: 'eli.r',        initials: 'ER', signalScore: 5367, change: -28 },
  { id: 'luna.v',       handle: 'luna.v',       initials: 'LV', signalScore: 5134, change: +11 },
  { id: 'oliver.b',     handle: 'oliver.b',     initials: 'OB', signalScore: 4901, change:  -5 },
  { id: 'finn.r',       handle: 'finn.r',       initials: 'FR', signalScore: 4667, change: +36 },
  { id: 'caden.m',      handle: 'caden.m',      initials: 'CM', signalScore: 4423, change: +18 },
  { id: 'mia.s',        handle: 'mia.s',        initials: 'MS', signalScore: 4189, change: -13 },
  { id: 'zara.k',       handle: 'zara.k',       initials: 'ZK', signalScore: 3956, change:  +6 },
  { id: 'kai.d',        handle: 'kai.d',        initials: 'KD', signalScore: 3712, change: -22 },
  { id: 'bri.n',        handle: 'bri.n',        initials: 'BN', signalScore: 3487, change: +29 },
  { id: 'leo.p',        handle: 'leo.p',        initials: 'LP', signalScore: 3256, change:  +1 },
  { id: 'sam.h',        handle: 'sam.h',        initials: 'SH', signalScore: 3021, change: -17 },
];

// ─── REEL · Entertainment ─────────────────────────────────────────────────────
// taylor.alpha is rank 23 (index 22 in users array)
const REEL_USERS: LeaderboardUser[] = [
  { id: 'nina.j',       handle: 'nina.j',       initials: 'NJ', signalScore: 9489, change: +43 },
  { id: 'devon_w',      handle: 'devon_w',      initials: 'DW', signalScore: 9267, change: +72 },
  { id: 'serena_k',     handle: 'serena_k',     initials: 'SK', signalScore: 8934, change: +19 },
  { id: 'mia.s',        handle: 'mia.s',        initials: 'MS', signalScore: 8712, change:  -8 },
  { id: 'riley.x',      handle: 'riley.x',      initials: 'RX', signalScore: 8453, change: +55 },
  { id: 'ava.g',        handle: 'ava.g',        initials: 'AG', signalScore: 8189, change: +11 },
  { id: 'caden.m',      handle: 'caden.m',      initials: 'CM', signalScore: 7867, change: +33 },
  { id: 'quantrose',    handle: 'quantrose',    initials: 'QR', signalScore: 7643, change:  -6 },
  { id: 'luna.v',       handle: 'luna.v',       initials: 'LV', signalScore: 7389, change: +24 },
  { id: 'jade.w',       handle: 'jade.w',       initials: 'JW', signalScore: 7134, change: +48 },
  { id: 'leo.p',        handle: 'leo.p',        initials: 'LP', signalScore: 6867, change: -17 },
  { id: 'priya.t',      handle: 'priya.t',      initials: 'PT', signalScore: 6623, change:  +9 },
  { id: 'will.b',       handle: 'will.b',       initials: 'WB', signalScore: 6378, change:  -3 },
  { id: 'tasha.r',      handle: 'tasha.r',      initials: 'TR', signalScore: 6134, change: +37 },
  { id: 'dex.f',        handle: 'dex.f',        initials: 'DF', signalScore: 5867, change: -21 },
  { id: 'eli.r',        handle: 'eli.r',        initials: 'ER', signalScore: 5623, change: +14 },
  { id: 'mo.k',         handle: 'mo.k',         initials: 'MK', signalScore: 5378, change:  +2 },
  { id: 'oliver.b',     handle: 'oliver.b',     initials: 'OB', signalScore: 5134, change:  -9 },
  { id: 'marcus.c',     handle: 'marcus.c',     initials: 'MC', signalScore: 4867, change: +26 },
  { id: 'finn.r',       handle: 'finn.r',       initials: 'FR', signalScore: 4623, change:  -4 },
  { id: 'alex.m',       handle: 'alex.m',       initials: 'AM', signalScore: 4378, change: +18 },
  { id: 'noah.t',       handle: 'noah.t',       initials: 'NT', signalScore: 4134, change: -31 },
  { id: 'taylor.alpha', handle: 'taylor.alpha', initials: 'TA', signalScore: 3867, change:  +2 }, // YOU · rank 23
  { id: 'zara.k',       handle: 'zara.k',       initials: 'ZK', signalScore: 3623, change: +11 },
  { id: 'bri.n',        handle: 'bri.n',        initials: 'BN', signalScore: 3378, change:  -8 },
];

// ─── PULSE · Fitness ──────────────────────────────────────────────────────────
// taylor.alpha is UNRANKED — not present in the users array
const PULSE_USERS: LeaderboardUser[] = [
  { id: 'priya.t',  handle: 'priya.t',  initials: 'PT', signalScore: 9301, change: +61 },
  { id: 'serena_k', handle: 'serena_k', initials: 'SK', signalScore: 9045, change: +38 },
  { id: 'riley.x',  handle: 'riley.x',  initials: 'RX', signalScore: 8789, change: +14 },
  { id: 'ava.g',    handle: 'ava.g',    initials: 'AG', signalScore: 8512, change: -23 },
  { id: 'devon_w',  handle: 'devon_w',  initials: 'DW', signalScore: 8267, change: +46 },
  { id: 'mia.s',    handle: 'mia.s',    initials: 'MS', signalScore: 7989, change:  +8 },
  { id: 'jade.w',   handle: 'jade.w',   initials: 'JW', signalScore: 7734, change: -11 },
  { id: 'luna.v',   handle: 'luna.v',   initials: 'LV', signalScore: 7467, change: +29 },
  { id: 'noah.t',   handle: 'noah.t',   initials: 'NT', signalScore: 7212, change:  +4 },
  { id: 'eli.r',    handle: 'eli.r',    initials: 'ER', signalScore: 6934, change: -17 },
  { id: 'marcus.c', handle: 'marcus.c', initials: 'MC', signalScore: 6678, change: +33 },
  { id: 'caden.m',  handle: 'caden.m',  initials: 'CM', signalScore: 6412, change:  +7 },
  { id: 'finn.r',   handle: 'finn.r',   initials: 'FR', signalScore: 6134, change: -28 },
  { id: 'alex.m',   handle: 'alex.m',   initials: 'AM', signalScore: 5878, change: +21 },
  { id: 'will.b',   handle: 'will.b',   initials: 'WB', signalScore: 5601, change:  -6 },
  { id: 'tasha.r',  handle: 'tasha.r',  initials: 'TR', signalScore: 5334, change: +14 },
  { id: 'dex.f',    handle: 'dex.f',    initials: 'DF', signalScore: 5067, change:  -3 },
  { id: 'zara.k',   handle: 'zara.k',   initials: 'ZK', signalScore: 4789, change: +43 },
  { id: 'mo.k',     handle: 'mo.k',     initials: 'MK', signalScore: 4512, change:  +9 },
  { id: 'bri.n',    handle: 'bri.n',    initials: 'BN', signalScore: 4256, change: -19 },
  { id: 'kai.d',    handle: 'kai.d',    initials: 'KD', signalScore: 3989, change:  +5 },
  { id: 'sam.h',    handle: 'sam.h',    initials: 'SH', signalScore: 3712, change: -14 },
];

// ─── ATLAS · Politics ─────────────────────────────────────────────────────────
// taylor.alpha is rank 89 — outside the displayed list; stored in yourRank field
const ATLAS_USERS: LeaderboardUser[] = [
  { id: 'monetary.mav', handle: 'monetary.mav', initials: 'MM', signalScore: 9134, change: +29 },
  { id: 'quantrose',    handle: 'quantrose',    initials: 'QR', signalScore: 8867, change:  -7 },
  { id: 'devon_w',      handle: 'devon_w',      initials: 'DW', signalScore: 8601, change: +43 },
  { id: 'alex.m',       handle: 'alex.m',       initials: 'AM', signalScore: 8334, change: +16 },
  { id: 'noah.t',       handle: 'noah.t',       initials: 'NT', signalScore: 8067, change: -19 },
  { id: 'marcus.c',     handle: 'marcus.c',     initials: 'MC', signalScore: 7789, change:  +8 },
  { id: 'priya.t',      handle: 'priya.t',      initials: 'PT', signalScore: 7534, change: +37 },
  { id: 'serena_k',     handle: 'serena_k',     initials: 'SK', signalScore: 7267, change:  -4 },
  { id: 'jade.w',       handle: 'jade.w',       initials: 'JW', signalScore: 7001, change: +22 },
  { id: 'riley.x',      handle: 'riley.x',      initials: 'RX', signalScore: 6734, change: -11 },
  { id: 'will.b',       handle: 'will.b',       initials: 'WB', signalScore: 6467, change: +14 },
  { id: 'nina.j',       handle: 'nina.j',       initials: 'NJ', signalScore: 6201, change: +56 },
  { id: 'caden.m',      handle: 'caden.m',      initials: 'CM', signalScore: 5934, change:  -8 },
  { id: 'luna.v',       handle: 'luna.v',       initials: 'LV', signalScore: 5667, change: +31 },
  { id: 'ava.g',        handle: 'ava.g',        initials: 'AG', signalScore: 5401, change:  -3 },
  { id: 'finn.r',       handle: 'finn.r',       initials: 'FR', signalScore: 5134, change: +18 },
  { id: 'eli.r',        handle: 'eli.r',        initials: 'ER', signalScore: 4867, change: -27 },
  { id: 'leo.p',        handle: 'leo.p',        initials: 'LP', signalScore: 4601, change:  +7 },
  { id: 'mia.s',        handle: 'mia.s',        initials: 'MS', signalScore: 4334, change: +42 },
  { id: 'zara.k',       handle: 'zara.k',       initials: 'ZK', signalScore: 4067, change:  -9 },
  { id: 'bri.n',        handle: 'bri.n',        initials: 'BN', signalScore: 3789, change: +13 },
  { id: 'tasha.r',      handle: 'tasha.r',      initials: 'TR', signalScore: 3512, change:  -5 },
  { id: 'kai.d',        handle: 'kai.d',        initials: 'KD', signalScore: 3256, change: +25 },
  { id: 'dex.f',        handle: 'dex.f',        initials: 'DF', signalScore: 2989, change: -18 },
  { id: 'sam.h',        handle: 'sam.h',        initials: 'SH', signalScore: 2723, change:  +4 },
];

// ─── Master record ────────────────────────────────────────────────────────────
export const LEADERBOARD_DATA: Record<CategoryAgentId, CategoryData> = {
  BARON: {
    agentId: 'BARON',
    activeUsers: 2341,
    weeklyGrowthPct: 18,
    users: BARON_USERS,
    yourRank: 12,
    yourScore: 5834,
    yourChange: +3,
  },
  BLITZ: {
    agentId: 'BLITZ',
    activeUsers: 3890,
    weeklyGrowthPct: 11,
    users: BLITZ_USERS,
    yourRank: 47,
    yourScore: 2134,
    yourChange: -5,
  },
  CIRCUIT: {
    agentId: 'CIRCUIT',
    activeUsers: 4521,
    weeklyGrowthPct: 22,
    users: CIRCUIT_USERS,
    yourRank: 7,
    yourScore: 7234,
    yourChange: +12,
  },
  REEL: {
    agentId: 'REEL',
    activeUsers: 1876,
    weeklyGrowthPct: 9,
    users: REEL_USERS,
    yourRank: 23,
    yourScore: 3867,
    yourChange: +2,
  },
  PULSE: {
    agentId: 'PULSE',
    activeUsers: 2104,
    weeklyGrowthPct: 14,
    users: PULSE_USERS,
    yourRank: null,
    yourScore: null,
    yourChange: null,
  },
  ATLAS: {
    agentId: 'ATLAS',
    activeUsers: 1567,
    weeklyGrowthPct: 5,
    users: ATLAS_USERS,
    yourRank: 89,
    yourScore: 1389,
    yourChange: -12,
  },
};
