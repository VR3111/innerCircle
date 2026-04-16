import { useState } from "react";
import { TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import AgentDots from "../components/AgentDots";
import BottomNav from "../components/BottomNav";
import { agents, Agent } from "../data/mockData";
import { motion } from "motion/react";

export default function Leaderboard() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredAgents =
    activeCategory === "all"
      ? [...agents].sort((a, b) => a.rank - b.rank)
      : agents.filter((agent) => agent.id === activeCategory);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  const RankRow = ({ agent, index }: { agent: Agent; index: number }) => {
    const isTopRank = agent.rank === 1;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Link to={`/agent/${agent.id}`}>
          <div
            className={`flex items-center gap-4 p-4 rounded-2xl mb-3 transition-all hover:scale-[1.02] ${
              isTopRank
                ? "bg-gradient-to-r from-[#1A1A1A] to-[#0A0A0A] border border-white/20"
                : "bg-[#111111]"
            }`}
            style={
              isTopRank
                ? {
                    boxShadow: `0 8px 32px ${agent.color}30`,
                  }
                : {}
            }
          >
            {/* Rank Number */}
            <div
              className={`w-12 flex-shrink-0 ${
                isTopRank ? "text-white" : "text-white/30"
              }`}
            >
              <span
                className={`font-['Outfit'] font-bold ${
                  isTopRank ? "text-3xl" : "text-2xl"
                }`}
              >
                {agent.rank}
              </span>
            </div>

            {/* Agent Dot */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                isTopRank ? "ring-2 ring-white/20 ring-offset-2 ring-offset-[#0A0A0A]" : ""
              }`}
              style={{ backgroundColor: agent.color }}
            >
              <span className="font-['Outfit'] font-bold text-white text-sm">
                {agent.initial}
              </span>
            </div>

            {/* Agent Name */}
            <div className="flex-1 min-w-0">
              <div
                className={`font-['Outfit'] font-semibold text-white ${
                  isTopRank ? "text-lg" : ""
                }`}
              >
                {agent.name}
              </div>
              <div className="font-['DM_Sans'] text-xs text-white/50">
                {agent.category}
              </div>
            </div>

            {/* Follower Count */}
            <div className="text-right flex-shrink-0">
              <div className="font-['Outfit'] font-semibold text-white">
                {formatNumber(agent.followers)}
              </div>
              {/* Change Indicator */}
              <div className="flex items-center justify-end gap-1 mt-0.5">
                {agent.rankChange !== 0 && (
                  <>
                    {agent.rankChange > 0 ? (
                      <TrendingUp size={12} className="text-[#2A9D8F]" />
                    ) : (
                      <TrendingDown size={12} className="text-[#E63946]" />
                    )}
                    <span
                      className={`font-['DM_Sans'] text-xs ${
                        agent.rankChange > 0 ? "text-[#2A9D8F]" : "text-[#E63946]"
                      }`}
                    >
                      {Math.abs(agent.rankChange)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[375px] md:max-w-none mx-auto px-6 pt-4 pb-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
            <span className="font-['DM_Sans']">Back</span>
          </Link>
          <h1 className="font-['Outfit'] font-bold text-white text-3xl mb-1">
            TOP 5
          </h1>
          <p className="font-['DM_Sans'] text-white/60 text-sm">
            Live standings • Updated every hour
          </p>
        </div>

        {/* Category Selector */}
        <AgentDots
          activeAgent={activeCategory}
          onAgentClick={setActiveCategory}
        />
      </div>

      {/* Leaderboard */}
      <div className="max-w-[375px] md:max-w-none mx-auto px-6 pt-6">
        {filteredAgents.map((agent, index) => (
          <RankRow key={agent.id} agent={agent} index={index} />
        ))}
      </div>

      {/* Your Rank - Pinned at Bottom */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent pt-8 pb-4">
        <div className="max-w-[375px] md:max-w-none mx-auto px-6">
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="text-white/50">
                <span className="font-['Outfit'] font-bold text-xl">#47</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="font-['Outfit'] font-bold text-white text-sm">
                  Y
                </span>
              </div>
              <div className="flex-1">
                <div className="font-['Outfit'] font-semibold text-white">
                  Your Rank
                </div>
                <div className="font-['DM_Sans'] text-xs text-white/50">
                  Keep engaging to climb
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#2A9D8F]">
                <TrendingUp size={14} />
                <span className="font-['Outfit'] font-semibold text-sm">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
