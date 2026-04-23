// DEPRECATED — LeaderboardScreen is no longer wired to any route.
// It has been superseded by the 2-level Arenas hub:
//   /leaderboard        → ArenasHubScreen.tsx
//   /leaderboard/:cat   → CategoryLeaderboardScreen.tsx
//
// Retained (not deleted) as a design reference for the old "agents as
// competitors" premise. Safe to delete once the new hub is confirmed stable.

import { useState } from 'react';
import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { AGENTS, AGENT_ORDER, type AgentId } from '@/lib/design-tokens';
import { LEADERBOARD, fmtCompact } from '@/lib/mock-data';
import type { LeaderboardEntry } from '@/lib/types';
import { AgentDot, LivePulse, Odometer, Sparkline } from '@/components/primitives';
import { ListSkeleton, ErrorState, EmptyState } from '@/components/states';
import { useAsync } from '@/lib/useAsync';

async function loadRanks(): Promise<LeaderboardEntry[]> {
  return new Promise(r => setTimeout(() => r(LEADERBOARD), 200));
}

interface LeaderboardScreenProps { entries?: LeaderboardEntry[] }

export function LeaderboardScreen({ entries: entriesProp }: LeaderboardScreenProps) {
  const [filter, setFilter] = useState<AgentId>('ALL');
  const { status, data, refetch } = useAsync(loadRanks, []);
  const entries = entriesProp ?? data ?? [];

  const accent = filter === 'ALL' ? '#E9C46A' : AGENTS[filter].color;

  const visible = filter === 'ALL' ? entries : entries.filter(e => e.agent === filter);
  const mkSpark = (seed: number, up: boolean) =>
    Array.from({ length: 12 }).map((_, i) => Math.sin(i * 0.7 + seed) * 5 + i * (up ? 0.8 : -0.2) + 10);

  return (
    <div className="flex flex-col h-full bg-bg">
      <header className="px-5" style={{ padding: 'calc(18px + var(--ic-top-inset, 0px)) 20px 10px' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] text-mute tracking-[0.18em] mb-1.5">LEADERBOARD · WK 16</div>
            <h1 className="m-0 font-sans text-[44px] font-bold text-white tracking-[-1.5px] leading-none">TOP 06</h1>
          </div>
          <LivePulse color={accent} label="LIVE" />
        </div>
      </header>

      {/* filter strip */}
      <div className="pt-2 pb-4">
        <div className="flex gap-[18px] px-5 overflow-x-auto no-scrollbar">
          {AGENT_ORDER.map(id => {
            const A = AGENTS[id];
            const active = filter === id;
            return (
              <div key={id} className="flex flex-col items-center gap-1.5 min-w-[48px]">
                <AgentDot agent={id} size={44} active={active} onClick={() => setFilter(id)} />
                <span
                  className="font-mono text-[9px] tracking-[0.12em] uppercase transition-colors"
                  style={{ color: active ? A.color : 'rgba(255,255,255,0.38)' }}
                >{A.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* rows */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6 flex flex-col gap-2">
        {status === 'loading' && <ListSkeleton rows={6} />}
        {status === 'error' && <ErrorState message="Couldn't load the leaderboard." onRetry={refetch} />}
        {status === 'ready' && visible.length === 0 && (
          <EmptyState title="No ranks yet" subtitle="Check back after the next week rolls over." />
        )}
        {status === 'ready' && visible.map((e, i) => (
          <LeaderRow key={e.agent} entry={e} first={i === 0 && filter === 'ALL'} spark={mkSpark(i * 3, e.change > 0)} />
        ))}
        <div className="h-20" />
      </div>

      {/* your-rank sticky card (solid background, no backdrop-filter) */}
      <div className="mx-5 mb-[18px] px-4 py-3 flex items-center gap-3 rounded-card border border-gold/30 bg-[rgba(233,196,106,0.06)]">
        <div className="font-mono text-[10px] text-gold tracking-[0.15em]">YOUR RANK</div>
        <NavLink to="/profile" className="ml-auto text-right font-sans text-[14px] text-white">
          <span className="text-gold font-bold">#12</span>
          <span className="text-mute2 ml-2 font-mono text-[10px]">▲ 3 from yesterday</span>
        </NavLink>
      </div>
    </div>
  );
}

function LeaderRow({ entry, first, spark }: { entry: LeaderboardEntry; first: boolean; spark: number[] }) {
  const A = AGENTS[entry.agent];
  const up = entry.change > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: entry.rank * 0.035, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative flex items-center gap-3.5 rounded-card overflow-hidden"
      style={{
        padding: first ? '20px 18px' : '14px 18px',
        background: first ? `linear-gradient(90deg, ${A.color}18 0%, ${A.color}00 80%)` : 'transparent',
        border: first ? `1px solid ${A.color}44` : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="w-8 text-left font-sans font-bold tracking-[-1px]"
           style={{
             fontSize: first ? 32 : 24,
             color: first ? A.color : 'rgba(255,255,255,0.22)',
             textShadow: first ? `0 0 20px ${A.color}66` : 'none',
           }}>
        {String(entry.rank).padStart(2, '0')}
      </div>
      <AgentDot agent={entry.agent} size={first ? 44 : 36} active={first} clickable={false} />
      <div className="flex-1 min-w-0">
        <div className="font-sans font-semibold text-white tracking-[-0.2px]"
             style={{ fontSize: first ? 17 : 15 }}>{A.name}</div>
        <div className="font-mono text-[9px] text-mute2 tracking-[0.12em] mt-0.5">{A.tag.toUpperCase()}</div>
      </div>
      <Sparkline points={spark} color={up ? A.color : 'rgba(255,255,255,0.56)'} width={48} height={22} />
      <div className="text-right">
        <div className="font-sans text-[15px] font-semibold text-white tracking-[-0.2px]">
          <Odometer value={entry.followers} format={fmtCompact} />
        </div>
        <div className="font-mono text-[10px] mt-0.5 flex items-center justify-end gap-0.5"
             style={{ color: up ? '#2A9D8F' : '#E63946' }}>
          <span>{up ? '▲' : '▼'}</span>
          <span>{Math.abs(entry.change).toFixed(1)}%</span>
        </div>
      </div>
    </motion.div>
  );
}
