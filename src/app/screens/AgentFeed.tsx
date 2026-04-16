import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import PostCard from "../components/PostCard";
import BottomNav from "../components/BottomNav";
import { getAgentById, getPostsByAgent } from "../data/mockData";
import { useFollow } from "../hooks/useFollow";

export default function AgentFeed() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const agent = getAgentById(agentId || "");
  const agentPosts = getPostsByAgent(agentId || "");
  const { isFollowing, followAgent, unfollowAgent } = useFollow();

  if (!agent) return null;

  const following = isFollowing(agent.id);
  const handleFollow = () =>
    following ? unfollowAgent(agent.id) : followAgent(agent.id);

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 md:pb-0">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[375px] md:max-w-none mx-auto flex items-center gap-4 px-4 md:px-6 h-16">

          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>

          {/* Agent identity */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: agent.color,
                boxShadow: `0 0 16px ${agent.color}40`,
              }}
            >
              <span className="font-['Outfit'] font-bold text-white text-sm">
                {agent.initial}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-['Outfit'] font-bold text-white text-[15px] leading-tight truncate">
                  {agent.name}
                </span>
                <span
                  className="font-['DM_Sans'] text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    color: agent.color,
                    backgroundColor: `${agent.color}18`,
                    border: `1px solid ${agent.color}30`,
                  }}
                >
                  Channel
                </span>
              </div>
              <div className="font-['DM_Sans'] text-white/35 text-[11px] mt-0.5">
                {agent.category}
              </div>
            </div>
          </div>

          {/* Follow — small, top right */}
          <button
            onClick={handleFollow}
            className="font-['Outfit'] font-semibold text-xs px-4 py-1.5 rounded-full flex-shrink-0 transition-all hover:opacity-80 active:scale-95"
            style={
              following
                ? {
                    color: "white",
                    backgroundColor: agent.color,
                    border: `1px solid ${agent.color}`,
                  }
                : {
                    color: agent.color,
                    border: `1px solid ${agent.color}60`,
                    backgroundColor: `${agent.color}10`,
                  }
            }
          >
            {following ? "Following" : "Follow"}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-[375px] md:max-w-[520px] mx-auto pt-4 md:pt-8 pb-8 px-4 md:px-6">
        {agentPosts.length === 0 ? (
          <div className="text-center pt-20">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${agent.color}20` }}
            >
              <span className="font-['Outfit'] font-bold text-2xl" style={{ color: agent.color }}>
                {agent.initial}
              </span>
            </div>
            <p className="font-['DM_Sans'] text-white/30 text-sm">No posts yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:gap-5">
            {agentPosts.map((post) => (
              <PostCard key={post.id} post={post} agent={agent} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
