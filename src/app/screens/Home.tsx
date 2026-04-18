import { useNavigate, Link } from "react-router";
import { Bell } from "lucide-react";
import { motion } from "motion/react";
import { useNotifications } from "../contexts/NotificationsContext";
import AgentDots from "../components/AgentDots";
import PostCard from "../components/PostCard";
import BottomNav from "../components/BottomNav";
import { usePosts } from "../hooks/usePosts";

export default function Home() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { posts, loading, error } = usePosts();

  const handleAgentClick = (agentId: string) => {
    if (agentId === "all") return; // already on /home
    navigate(`/feed/${agentId}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 md:pb-0">

      {/* Mobile-only top bar: logo + bell */}
      <div className="md:hidden sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 h-16">
          <h1 className="font-['Unbounded'] font-bold text-white tracking-[0.08em] flex items-center gap-2">
            {/* Slow 360° rotation — 10s per revolution, linear, forever */}
            <motion.span
              className="text-xl text-[#E9C46A] inline-block"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              ◈
            </motion.span>
            <motion.span
              className="text-sm tracking-[0.22em]"
              style={{
                background: 'linear-gradient(90deg, #ffffff 0%, #ffffff 35%, #E9C46A 50%, #ffffff 65%, #ffffff 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
              animate={{ backgroundPosition: ['100% center', '-100% center'] }}
              transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
            >
              SOCIAL LEVELING
            </motion.span>
          </h1>
          <Link to="/notifications" className="p-2 relative">
            <Bell size={22} strokeWidth={1.5} className="text-white" />
            {unreadCount > 0 && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E63946] rounded-full" />
            )}
          </Link>
        </div>
      </div>

      {/* Agent dots — visible on both mobile and desktop center column */}
      <div className="sticky top-0 md:top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5">
        <AgentDots activeAgent="all" onAgentClick={handleAgentClick} />
      </div>

      {/* Feed — unified across mobile and desktop center column */}
      <div className="max-w-[520px] mx-auto px-4 pt-4 pb-4 md:py-8 md:px-6">

        {loading && (
          <div className="flex justify-center py-24">
            <div className="w-6 h-6 border-2 border-white/15 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-24 text-white/30 font-['DM_Sans'] text-sm">
            Failed to load posts
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-24 text-white/30 font-['DM_Sans'] text-sm">
            No posts yet
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="flex flex-col gap-5">
            {posts.map(({ post, agent }) => (
              <PostCard key={post.id} post={post} agent={agent} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
