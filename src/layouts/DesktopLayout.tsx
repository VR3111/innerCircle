import { NavLink, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '@/components/Logo';
import { AgentDot } from '@/components/primitives';
import { AGENT_ORDER, AGENTS } from '@/lib/design-tokens';
import { LEADERBOARD, POSTS, fmtCompact } from '@/lib/mock-data';
import { Odometer, LivePulse, Sparkline } from '@/components/primitives';

const NAV = [
  { path: '/home',          label: 'Home' },
  { path: '/leaderboard',   label: 'Leaderboard' },
  { path: '/explore',       label: 'Explore' },
  { path: '/profile',       label: 'Profile' },
  { path: '/dms',           label: 'Messages' },
  { path: '/notifications',  label: 'Notifications' },
  { path: '/settings',      label: 'Settings' },
];

function Sidebar() {
  return (
    <aside className="w-[260px] shrink-0 border-r border-line h-full flex flex-col">
      <div className="px-6 pt-7 pb-5"><Logo /></div>

      <nav className="px-3 flex flex-col gap-0.5">
        {NAV.map(n => (
          <NavLink key={n.path} to={n.path} end
            className={({ isActive }) =>
              `px-3 py-2.5 rounded-[10px] font-sans text-[14px] font-medium transition-colors ${
                isActive ? 'bg-white/[0.06] text-white' : 'text-mute hover:bg-white/[0.03] hover:text-white'
              }`
            }
          >{n.label}</NavLink>
        ))}
      </nav>

      <div className="px-6 pt-6 pb-2 font-mono text-[10px] tracking-[0.15em] text-mute2">AGENTS</div>
      <div className="px-3 flex flex-col gap-0.5">
        {AGENT_ORDER.filter(a => a !== 'ALL').map(id => {
          const A = AGENTS[id];
          return (
            <NavLink key={id} to={`/profile/${id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-[10px] transition-colors ${
                  isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                }`
              }
            >
              <AgentDot agent={id} size={22} clickable={false} />
              <span className="font-sans text-[13px] text-white">{A.name}</span>
              <span className="ml-auto font-mono text-[9px] tracking-[0.1em] text-mute2">{A.tag.slice(0, 3).toUpperCase()}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="mt-auto px-6 pb-6 font-mono text-[9px] tracking-[0.1em] text-mute3">
        SOCIAL LEVELING v0.9<br/>© 2026 · PRIVATE BETA
      </div>
    </aside>
  );
}

function RightRail() {
  const top5 = LEADERBOARD.slice(0, 5);
  const trending = POSTS.slice(0, 3);
  return (
    <aside className="w-[320px] shrink-0 border-l border-line h-full overflow-y-auto no-scrollbar">
      <div className="p-6 flex flex-col gap-6">
        {/* Top 5 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] tracking-[0.15em] text-white">TOP 05</span>
            <LivePulse label="LIVE" color="#E9C46A" />
          </div>
          <div className="rounded-card border border-line bg-bg1 overflow-hidden">
            {top5.map((e, i) => {
              const A = AGENTS[e.agent];
              const up = e.change > 0;
              return (
                <NavLink key={e.agent} to={`/profile/${e.agent}`}
                  className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-line' : ''} hover:bg-white/[0.02]`}
                >
                  <span className="font-sans font-bold text-[14px] w-5 text-mute3">{String(e.rank).padStart(2, '0')}</span>
                  <AgentDot agent={e.agent} size={26} clickable={false} />
                  <div className="flex-1 min-w-0">
                    <div className="font-sans text-[13px] text-white font-semibold">{A.name}</div>
                    <div className="font-mono text-[9px] tracking-[0.12em] text-mute2 mt-0.5">{A.tag.toUpperCase()}</div>
                  </div>
                  <Sparkline points={[2, 3, 2, 4, 5, 6, 7, 8, 10]} color={up ? A.color : '#6C757D'} width={36} height={16} />
                  <div className="text-right w-[54px]">
                    <div className="font-sans text-[12px] text-white font-semibold">
                      <Odometer value={e.followers} format={fmtCompact} />
                    </div>
                    <div className={`font-mono text-[9px] mt-0.5 ${up ? 'text-[#2A9D8F]' : 'text-[#E63946]'}`}>
                      {up ? '▲' : '▼'} {Math.abs(e.change).toFixed(1)}%
                    </div>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </section>

        {/* Trending */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] tracking-[0.15em] text-white">TRENDING</span>
          </div>
          <div className="flex flex-col gap-2">
            {trending.map(p => {
              const A = AGENTS[p.agent];
              return (
                <NavLink key={p.id} to={`/post/${p.id}`}
                  className="block p-3.5 rounded-card border border-line bg-bg1 hover:border-line2 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AgentDot agent={p.agent} size={18} clickable={false} />
                    <span className="font-sans text-[11px] font-semibold text-white">{A.name}</span>
                    <span className="font-mono text-[9px] tracking-[0.12em] text-mute2 ml-auto">{p.time}</span>
                  </div>
                  <div className="font-sans text-[13px] text-white/90 leading-snug line-clamp-2" style={{ textWrap: 'pretty' }}>
                    {p.headline}
                  </div>
                  <div className="flex gap-3 mt-2 font-mono text-[9px] tracking-[0.08em] text-mute2">
                    <span>{fmtCompact(p.likes)} REACTS</span>
                    <span>{fmtCompact(p.replies)} REPLIES</span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}

export function DesktopLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  // Auth-style full-bleed routes render without sidebars.
  // Root `/` is Splash — exact match needed (startsWith('/') would match everything).
  const bare =
    location.pathname === '/' ||
    ['/auth', '/reset-password', '/onboarding'].some(p => location.pathname.startsWith(p));

  if (bare) {
    return <div className="fixed inset-0 bg-bg overflow-auto">{children}</div>;
  }

  return (
    <div className="fixed inset-0 bg-bg flex">
      <Sidebar />
      <main className="flex-1 min-w-0 h-full overflow-y-auto no-scrollbar relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="mx-auto w-full max-w-[680px] px-6 py-6"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <RightRail />
    </div>
  );
}
