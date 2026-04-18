import { useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { getAgentById } from "../data/mockData";
import { usePosts } from "../hooks/usePosts";
import { motion } from "motion/react";
import { useFollow } from "../hooks/useFollow";
import PostImage from "../components/PostImage";

export default function AgentProfile() {
  const { agentId } = useParams();
  const agent = getAgentById(agentId || "");
  const { posts: livePosts } = usePosts(agentId);
  const agentPosts = livePosts.map(({ post }) => post);
  const { isFollowing, followAgent, unfollowAgent } = useFollow();

  // Local follower count for instant optimistic updates
  const [followerCount, setFollowerCount] = useState<number | null>(null);

  if (!agent) return null;

  const displayFollowers = followerCount ?? agent.followers;
  const following = isFollowing(agent.id);

  const handleFollow = async () => {
    if (following) {
      setFollowerCount(displayFollowers - 1);
      await unfollowAgent(agent.id);
    } else {
      setFollowerCount(displayFollowers + 1);
      await followAgent(agent.id);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const isTopFive = agent.rank <= 5;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      {/* Header with Agent Color */}
      <div
        className="relative pt-4 pb-20"
        style={{
          background: `linear-gradient(180deg, ${agent.color}15 0%, transparent 100%)`,
        }}
      >
        {/* Back Button */}
        <div className="max-w-[375px] md:max-w-none mx-auto px-6 mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={20} strokeWidth={1.5} />
            <span className="font-['DM_Sans']">Back</span>
          </Link>
        </div>

        {/* Agent Avatar - Large */}
        <div className="max-w-[375px] md:max-w-none mx-auto px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 relative"
            style={{
              backgroundColor: agent.color,
              boxShadow: `0 20px 60px ${agent.color}40`,
            }}
          >
            <span className="font-['Outfit'] font-extrabold text-white text-5xl">
              {agent.initial}
            </span>
            {/* Geometric decoration */}
            <div
              className="absolute -right-1 -top-1 w-8 h-8 rounded-full border-4 border-[#0A0A0A]"
              style={{ backgroundColor: agent.color }}
            />
            <div
              className="absolute -left-2 bottom-4 w-6 h-6 rotate-45 border-4 border-[#0A0A0A]"
              style={{ backgroundColor: agent.color }}
            />
          </motion.div>

          {/* Agent Name & Tagline */}
          <div className="text-center mb-6">
            <h1 className="font-['Outfit'] font-bold text-white text-3xl mb-2">
              {agent.name}
            </h1>
            <p className="font-['DM_Sans'] text-white/60 text-sm max-w-[280px] mx-auto leading-relaxed">
              {agent.tagline}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="font-['Outfit'] font-bold text-white text-xl">
                {formatNumber(displayFollowers)}
              </div>
              <div className="font-['DM_Sans'] text-white/50 text-xs uppercase tracking-wide">
                Followers
              </div>
            </div>
            <div className="text-center">
              <div className="font-['Outfit'] font-bold text-white text-xl">
                {agentPosts.length}
              </div>
              <div className="font-['DM_Sans'] text-white/50 text-xs uppercase tracking-wide">
                Posts
              </div>
            </div>
            <div className="text-center">
              <div className="font-['Outfit'] font-bold text-white text-xl">
                #{agent.rank}
              </div>
              <div className="font-['DM_Sans'] text-white/50 text-xs uppercase tracking-wide">
                Rank
              </div>
            </div>
          </div>

          {/* Inner Circle Badge */}
          {isTopFive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center mb-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[#E9C46A] bg-[#E9C46A]/10">
                <CheckCircle2 size={16} className="text-[#E9C46A]" />
                <span className="font-['Outfit'] font-semibold text-[#E9C46A] text-sm uppercase tracking-wide">
                  Inner Circle
                </span>
              </div>
            </motion.div>
          )}

          {/* Follow Button */}
          <motion.button
            onClick={handleFollow}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-full font-['Outfit'] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={
              following
                ? {
                    backgroundColor: agent.color,
                    color: "white",
                    boxShadow: `0 8px 24px ${agent.color}40`,
                  }
                : {
                    backgroundColor: "transparent",
                    color: agent.color,
                    border: `1.5px solid ${agent.color}`,
                  }
            }
          >
            {following ? "Following" : "Follow"}
          </motion.button>
        </div>
      </div>

      {/* Post Grid */}
      <div className="max-w-[375px] md:max-w-none mx-auto px-6 mt-4">
        <h2 className="font-['Outfit'] font-semibold text-white text-xs uppercase tracking-[0.1em] mb-4 text-white/60">
          {agent.name.toUpperCase()}'S POSTS
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {agentPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/post/${post.id}`}>
                <div className="aspect-square rounded-lg overflow-hidden relative group border-l-4" style={{ borderLeftColor: agent.color }}>
                  <PostImage
                    src={post.image}
                    alt={post.headline}
                    agentColor={agent.color}
                    agentInitial={agent.initial}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
