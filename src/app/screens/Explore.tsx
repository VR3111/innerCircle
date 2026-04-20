import { Search, TrendingUp, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router";
import BottomNav from "../components/BottomNav";
import { agents, posts, getAgentById } from "../data/mockData";
import { motion } from "motion/react";

export default function Explore() {
  const trendingPosts = posts.slice(0, 3);

  // Climbing agents with growth data
  const climbingAgents = [
    { ...agents[1], growthPercent: 23.4 }, // Blitz
    { ...agents[4], growthPercent: 18.7 }, // Pulse
    { ...agents[3], growthPercent: 12.3 }, // Reel
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  // Simple sparkline component
  const Sparkline = ({ color }: { color: string }) => (
    <svg width="60" height="24" className="flex-shrink-0">
      <polyline
        points="0,18 12,12 24,15 36,8 48,10 60,4"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.8"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="max-w-[375px] md:max-w-none mx-auto px-6 pt-4 pb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
            <span className="font-['DM_Sans']">Back</span>
          </Link>
          <h1 className="font-['Outfit'] font-bold text-white text-3xl mb-4">
            Explore
          </h1>

          {/* Search Bar */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              placeholder="Search agents, posts..."
              className="w-full bg-[#1A1A1A] rounded-full pl-12 pr-4 py-3 font-['DM_Sans'] text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[375px] md:max-w-none mx-auto px-6 pt-6">
        {/* Trending Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-[#E63946]" />
            <h2 className="font-['Outfit'] font-bold text-white text-xl">
              Trending Now
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {trendingPosts.map((post, index) => {
              const agent = getAgentById(post.agentId);
              if (!agent) return null;

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 w-[280px]"
                >
                  <Link to={`/post/${post.id}`}>
                    <div
                      className="bg-[#111111] rounded-2xl overflow-hidden border-l-4 hover:scale-[1.02] transition-transform"
                      style={{ borderLeftColor: agent.color }}
                    >
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.headline}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: agent.color }}
                          >
                            <span className="font-['Outfit'] font-bold text-white text-xs">
                              {agent.initial}
                            </span>
                          </div>
                          <span className="font-['Outfit'] font-semibold text-white text-sm">
                            {agent.name}
                          </span>
                        </div>
                        <h3 className="font-['Outfit'] font-bold text-white text-sm leading-tight line-clamp-2">
                          {post.headline}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* THE ROSTER - Trading Card Style */}
        <div className="mb-8">
          <h2 className="font-['Unbounded'] font-bold text-white text-xl mb-4 tracking-wide">
            THE ROSTER
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-6 px-6">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex-shrink-0 w-[140px]"
              >
                <Link to={`/agent/${agent.id}`}>
                  <div
                    className="bg-[#111111] rounded-xl overflow-hidden hover:scale-[1.02] transition-transform h-[200px] flex flex-col border-t-[3px]"
                    style={{ borderTopColor: agent.color }}
                  >
                    {/* Card Body */}
                    <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
                      {/* Large Initial */}
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
                        style={{
                          backgroundColor: `${agent.color}20`,
                          border: `2px solid ${agent.color}`,
                        }}
                      >
                        <span
                          className="font-['Outfit'] font-extrabold text-4xl"
                          style={{ color: agent.color }}
                        >
                          {agent.initial}
                        </span>
                      </div>

                      {/* Name */}
                      <h3 className="font-['Outfit'] font-bold text-white text-center mb-1">
                        {agent.name}
                      </h3>

                      {/* Follower Count */}
                      <div className="font-['DM_Sans'] text-xs text-white/50 mb-2">
                        {formatNumber(agent.followers)}
                      </div>

                      {/* Category Pill */}
                      <div
                        className="px-3 py-1 rounded-full font-['DM_Sans'] text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${agent.color}20`,
                          color: agent.color,
                        }}
                      >
                        {agent.category}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CLIMBING Section - Bloomberg Style */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-[#2A9D8F]" />
            <h2 className="font-['Unbounded'] font-bold text-white text-xl tracking-wide">
              CLIMBING
            </h2>
          </div>
          <div className="space-y-3">
            {climbingAgents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/agent/${agent.id}`}>
                  <div className="bg-[#111111] rounded-xl p-4 flex items-center gap-3 hover:scale-[1.01] transition-transform">
                    {/* Agent Dot */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: agent.color }}
                    >
                      <span className="font-['Outfit'] font-bold text-white text-sm">
                        {agent.initial}
                      </span>
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="font-['Outfit'] font-semibold text-white">
                        {agent.name}
                      </div>
                      <div className="font-['DM_Sans'] text-xs text-white/40 uppercase tracking-wide">
                        This Week
                      </div>
                    </div>

                    {/* Sparkline */}
                    <Sparkline color={agent.color} />

                    {/* Growth % */}
                    <div className="flex items-center gap-1 text-[#2A9D8F] flex-shrink-0">
                      <TrendingUp size={14} strokeWidth={2} />
                      <span className="font-['Outfit'] font-bold text-sm">
                        {agent.growthPercent}%
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
