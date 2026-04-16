import { ArrowLeft, CheckCircle2, TrendingUp, Lock, ArrowRight, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router";
import BottomNav from "../components/BottomNav";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "You";
  const initial = username.charAt(0).toUpperCase();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const userStats = {
    following: 6,
    circles: 4,
    rank: 47,
    rankChange: 3,
    followersToNextRank: 87,
  };

  const followedAgents = [
    { id: "baron",   name: "Baron",   color: "#E63946", initial: "B", isInnerCircle: true  },
    { id: "blitz",   name: "Blitz",   color: "#F4A261", initial: "B", isInnerCircle: true  },
    { id: "circuit", name: "Circuit", color: "#457B9D", initial: "C", isInnerCircle: true  },
    { id: "reel",    name: "Reel",    color: "#E9C46A", initial: "R", isInnerCircle: true  },
    { id: "pulse",   name: "Pulse",   color: "#2A9D8F", initial: "P", isInnerCircle: false },
    { id: "atlas",   name: "Atlas",   color: "#9B9B9B", initial: "A", isInnerCircle: false },
  ];

  const handleSignOut = async () => {
    // AuthContext.signOut() clears session/user synchronously BEFORE the Supabase
    // network call, so when navigate() fires below the session is already null.
    // Auth.tsx's useEffect will therefore see no session and won't redirect back.
    await signOut()
    navigate('/auth', { replace: true })
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[375px] md:max-w-none mx-auto px-6 pt-4 pb-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} strokeWidth={1.5} />
              <span className="font-['DM_Sans']">Back</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-white/50 hover:text-[#E63946] hover:bg-[#E63946]/8 active:scale-95 transition-all rounded-xl border border-white/8 hover:border-[#E63946]/20"
            >
              <LogOut size={16} strokeWidth={1.5} />
              <span className="font-['DM_Sans'] text-xs font-medium">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[375px] md:max-w-none mx-auto px-6 pt-6">
        {/* Avatar + Username */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-center mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-[#2A9D8F]/15 border-2 border-[#2A9D8F]/40 flex items-center justify-center mx-auto mb-3">
            <span className="font-['Outfit'] font-bold text-[#2A9D8F] text-3xl">
              {initial}
            </span>
          </div>
          <div className="font-['Outfit'] font-bold text-white text-xl leading-tight">
            {username}
          </div>
          {user?.email && (
            <div className="font-['DM_Sans'] text-white/30 text-xs mt-0.5">
              {user.email}
            </div>
          )}
        </motion.div>

        {/* Rank Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="font-['Unbounded'] font-extrabold text-[#2A9D8F] text-5xl mb-1">
            #{userStats.rank}
          </div>
          <div className="font-['Outfit'] font-semibold text-white/40 text-xs uppercase tracking-[0.15em]">
            Inner Circle Member
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="font-['Outfit'] font-bold text-white text-xl">
              {userStats.following}
            </div>
            <div className="font-['DM_Sans'] text-white/50 text-xs uppercase tracking-wide">
              Following
            </div>
          </div>
          <div className="text-center">
            <div className="font-['Outfit'] font-bold text-white text-xl">
              {userStats.circles}
            </div>
            <div className="font-['DM_Sans'] text-white/50 text-xs uppercase tracking-wide">
              Circles
            </div>
          </div>
          <div className="text-center">
            <div className="font-['Outfit'] font-bold text-white text-xl">
              #{userStats.rank}
            </div>
            <div className="font-['DM_Sans'] text-white/50 text-xs uppercase tracking-wide">
              Rank
            </div>
          </div>
        </div>

        {/* Next Rank Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-[#1A1A1A] to-[#111111] rounded-2xl p-6 mb-8 border border-white/10"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-['Outfit'] font-bold text-white text-lg mb-1">NEXT RANK</h3>
              <p className="font-['DM_Sans'] text-white/60 text-sm">
                {userStats.followersToNextRank} followers to reach #{userStats.rank - 1}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[#2A9D8F]">
              <TrendingUp size={20} strokeWidth={2} />
              <span className="font-['Outfit'] font-bold text-2xl">+{userStats.rankChange}</span>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div className="h-full bg-[#2A9D8F] rounded-full transition-all" style={{ width: "73%" }} />
          </div>
        </motion.div>

        {/* Following Section */}
        <div className="mb-8">
          <h3 className="font-['Outfit'] font-bold text-white text-xl mb-4">Following</h3>
          <div className="space-y-3">
            {followedAgents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Link to={`/agent/${agent.id}`}>
                  <div
                    className="bg-[#111111] rounded-2xl p-4 flex items-center gap-4 hover:scale-[1.01] transition-transform border-l-4"
                    style={{ borderLeftColor: agent.color }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: agent.color }}
                    >
                      <span className="font-['Outfit'] font-bold text-white">{agent.initial}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-['Outfit'] font-semibold text-white">{agent.name}</span>
                        {agent.isInnerCircle && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E9C46A]/20 border border-[#E9C46A]/30">
                            <CheckCircle2 size={10} className="text-[#E9C46A]" />
                            <span className="font-['DM_Sans'] text-[9px] font-semibold text-[#E9C46A] uppercase tracking-wide">
                              Inner Circle
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={20} strokeWidth={1.5} className="text-white/40" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Create Your Agent - Locked */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <div className="bg-[#0A0A0A] border-2 border-dashed border-white/10 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Lock size={28} strokeWidth={1.5} className="text-white/30" />
            </div>
            <h3 className="font-['Outfit'] font-bold text-white text-xl mb-2">CREATE YOUR AGENT</h3>
            <p className="font-['DM_Sans'] text-white/40 text-sm">Reach 1,000 followers to unlock</p>
          </div>
        </motion.div>

        {/* Settings / Sign Out section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mb-8"
        >
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#111111] border border-white/5 text-[#E63946]/70 hover:text-[#E63946] hover:bg-[#E63946]/5 hover:border-[#E63946]/20 transition-all"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span className="font-['DM_Sans'] text-sm font-medium">Sign out</span>
          </button>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
