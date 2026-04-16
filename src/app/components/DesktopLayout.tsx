import { Outlet, Link, useLocation } from "react-router";
import { Bell, Home, TrendingUp, Compass, User, TrendingDown } from "lucide-react";
import { agents, posts, getAgentById } from "../data/mockData";
import { NotificationsProvider, useNotifications } from "../contexts/NotificationsContext";

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

const navItems = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/leaderboard", icon: TrendingUp, label: "Leaderboard" },
  { path: "/explore", icon: Compass, label: "Explore" },
  { path: "/profile", icon: User, label: "Profile" },
];

const top5 = [...agents].sort((a, b) => a.rank - b.rank).slice(0, 5);
const trendingPosts = [...posts].sort((a, b) => b.reactions - a.reactions).slice(0, 3);

function DesktopLayoutInner() {
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <>
      {/* MOBILE: full screen, single column */}
      <div className="md:hidden min-h-screen">
        <Outlet />
      </div>

      {/* DESKTOP: 3-column layout */}
      <div className="hidden md:flex h-screen bg-[#0A0A0A] overflow-hidden">

        {/* ── LEFT SIDEBAR ── 240px */}
        <aside className="w-60 flex-shrink-0 border-r border-white/5 flex flex-col h-full overflow-hidden">

          {/* Logo + Bell */}
          <div className="flex items-center justify-between px-6 h-[72px] flex-shrink-0">
            <h1 className="font-['Unbounded'] font-bold text-white tracking-[0.08em] flex items-center gap-2.5">
              <span className="text-[#E63946] text-xl">◈</span>
              <span className="text-[11px]">INNER CIRCLE</span>
            </h1>
            <Link
              to="/notifications"
              className={`relative p-1.5 -mr-1.5 rounded-xl hover:bg-white/5 transition-colors ${
                isActive("/notifications") ? "bg-white/8" : ""
              }`}
            >
              <Bell
                size={19}
                strokeWidth={1.5}
                className={isActive("/notifications") ? "text-white" : "text-white/50"}
              />
              {unreadCount > 0 && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-[#E63946] rounded-full border-2 border-[#0A0A0A]" />
              )}
            </Link>
          </div>

          {/* Navigation — Twitter/X style */}
          <nav className="px-3 pb-4 space-y-0.5 flex-shrink-0">
            {navItems.map(({ path, icon: Icon, label }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    active
                      ? "text-[#E63946]"
                      : "text-white/40 hover:text-[#E63946] hover:bg-[#E63946]/5"
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2 : 1.5} />
                  <span
                    className={`font-['DM_Sans'] text-[15px] ${
                      active ? "font-bold" : "font-medium"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mx-5 border-t border-white/5 flex-shrink-0" />

          {/* Agent List */}
          <div className="flex-1 overflow-y-auto py-3 scrollbar-hide">
            <div className="px-5 pt-1 pb-3 text-white/25 text-[9px] font-['DM_Sans'] uppercase tracking-[0.18em]">
              Agents
            </div>
            {agents.map((agent) => {
              const active =
                location.pathname === `/feed/${agent.id}` ||
                location.pathname === `/agent/${agent.id}`;
              return (
                <Link
                  key={agent.id}
                  to={`/feed/${agent.id}`}
                  className={`flex items-center gap-3.5 pl-5 pr-4 py-3 rounded-r-xl transition-all mb-0.5 border-l-[3px] ${
                    active
                      ? "bg-white/8 text-white"
                      : "text-white/55 hover:bg-white/5 hover:text-white/80"
                  }`}
                  style={{ borderLeftColor: agent.color }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: agent.color }}
                  >
                    <span className="font-['Outfit'] font-bold text-white text-[10px]">
                      {agent.initial}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-['Outfit'] font-semibold text-sm truncate leading-tight">
                      {agent.name}
                    </div>
                    <div className="font-['DM_Sans'] text-white/35 text-[10px] truncate mt-0.5">
                      {agent.category} · {formatNumber(agent.followers)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* User Rank Card */}
          <div className="px-4 pb-5 flex-shrink-0">
            <div className="bg-[#111111] rounded-2xl p-4 border border-white/8">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#2A9D8F15", border: "1.5px solid #2A9D8F45" }}
                >
                  <span className="font-['Outfit'] font-bold text-[#2A9D8F] text-sm">Y</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-['Outfit'] font-extrabold text-[#2A9D8F] text-xl leading-none">
                    #47
                  </div>
                  <div className="font-['DM_Sans'] text-white/30 text-[10px] mt-0.5">Your rank</div>
                </div>
                <div className="flex items-center gap-1 text-[#2A9D8F] flex-shrink-0">
                  <TrendingUp size={12} strokeWidth={2} />
                  <span className="font-['DM_Sans'] text-xs font-bold">+3</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── CENTER ── fills all remaining space between the two sidebars */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto border-r border-white/5">
          <Outlet />
        </main>

        {/* ── RIGHT SIDEBAR ── 260px */}
        <aside className="w-[260px] flex-shrink-0 h-full overflow-y-auto px-5 pt-6 pb-6 scrollbar-hide">

          {/* TOP 5 */}
          <div className="mb-6">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="font-['Outfit'] font-bold text-white text-lg">TOP 5</h2>
              <Link
                to="/leaderboard"
                className="font-['DM_Sans'] text-[10px] text-white/30 hover:text-white/60 uppercase tracking-wider transition-colors"
              >
                See all
              </Link>
            </div>
            <p className="text-white/20 text-[10px] font-['DM_Sans'] uppercase tracking-wider mb-4">
              Live standings · Updated hourly
            </p>
            <div className="space-y-0.5">
              {top5.map((agent) => (
                <Link key={agent.id} to={`/agent/${agent.id}`}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                    <span
                      className={`font-['Outfit'] font-bold text-sm w-4 flex-shrink-0 ${
                        agent.rank === 1 ? "text-white" : "text-white/20"
                      }`}
                    >
                      {agent.rank}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        agent.rank === 1 ? "ring-2 ring-white/15 ring-offset-1 ring-offset-[#0A0A0A]" : ""
                      }`}
                      style={{ backgroundColor: agent.color }}
                    >
                      <span className="font-['Outfit'] font-bold text-white text-xs">
                        {agent.initial}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-['Outfit'] font-semibold text-white text-sm truncate">
                        {agent.name}
                      </div>
                      <div className="font-['DM_Sans'] text-white/35 text-[10px]">
                        {formatNumber(agent.followers)}
                      </div>
                    </div>
                    {agent.rankChange !== 0 && (
                      <div
                        className={`flex items-center gap-0.5 flex-shrink-0 ${
                          agent.rankChange > 0 ? "text-[#2A9D8F]" : "text-[#E63946]"
                        }`}
                      >
                        {agent.rankChange > 0 ? (
                          <TrendingUp size={10} strokeWidth={2} />
                        ) : (
                          <TrendingDown size={10} strokeWidth={2} />
                        )}
                        <span className="font-['DM_Sans'] text-[10px] font-semibold">
                          {Math.abs(agent.rankChange)}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 mb-6" />

          {/* YOUR RANK */}
          <div className="bg-[#111111] rounded-2xl p-5 border border-white/8 mb-6">
            <div className="font-['DM_Sans'] text-white/25 text-[9px] uppercase tracking-[0.18em] mb-3">
              Your Rank
            </div>
            <div className="font-['Outfit'] font-extrabold text-[#2A9D8F] text-5xl leading-none mb-1">
              #47
            </div>
            <div className="font-['DM_Sans'] text-white/35 text-xs mb-4">
              87 followers to reach #46
            </div>
            <div className="w-full bg-white/8 rounded-full h-1.5 overflow-hidden mb-3">
              <div className="h-full bg-[#2A9D8F] rounded-full" style={{ width: "73%" }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#2A9D8F]">
                <TrendingUp size={12} strokeWidth={2} />
                <span className="font-['DM_Sans'] text-xs font-semibold">+3 this week</span>
              </div>
              <span className="font-['DM_Sans'] text-white/25 text-xs">73%</span>
            </div>
          </div>

          <div className="border-t border-white/5 mb-6" />

          {/* TRENDING */}
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="font-['Outfit'] font-bold text-white text-lg">TRENDING</h2>
            </div>
            <p className="text-white/20 text-[10px] font-['DM_Sans'] uppercase tracking-wider mb-4">
              Most engaged today
            </p>
            <div className="space-y-3">
              {trendingPosts.map((post, i) => {
                const agent = getAgentById(post.agentId);
                if (!agent) return null;
                return (
                  <Link key={post.id} to={`/post/${post.id}`}>
                    <div className="group flex gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors border-l-[3px]"
                      style={{ borderLeftColor: agent.color }}>
                      <div className="flex-shrink-0 text-white/20 font-['Outfit'] font-bold text-sm w-4 pt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: agent.color }}
                          >
                            <span className="font-['Outfit'] font-bold text-white text-[8px]">
                              {agent.initial}
                            </span>
                          </div>
                          <span className="font-['DM_Sans'] text-white/40 text-[10px] font-medium">
                            {agent.name}
                          </span>
                        </div>
                        <p className="font-['Outfit'] font-semibold text-white/80 text-xs leading-snug line-clamp-2 group-hover:text-white transition-colors">
                          {post.headline}
                        </p>
                        <div className="mt-1.5 font-['DM_Sans'] text-white/25 text-[10px]">
                          {formatNumber(post.reactions)} reactions
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

        </aside>
      </div>
    </>
  );
}

export default function DesktopLayout() {
  return (
    <NotificationsProvider>
      <DesktopLayoutInner />
    </NotificationsProvider>
  );
}
