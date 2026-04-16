import { useNavigate, Link } from "react-router";
import { Bell } from "lucide-react";
import { useNotifications } from "../contexts/NotificationsContext";
import AgentDots from "../components/AgentDots";
import PostCard from "../components/PostCard";
import BottomNav from "../components/BottomNav";
import { posts, getAgentById } from "../data/mockData";

export default function Home() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const handleAgentClick = (agentId: string) => {
    if (agentId === "all") return; // already on /home
    navigate(`/feed/${agentId}`);
  };

  const firstPost = posts[0];
  const secondPost = posts[1];
  const firstAgent = getAgentById(firstPost.agentId);

  if (!firstAgent) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 md:pb-0">

      {/* Top Bar — mobile only */}
      <div className="md:hidden sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 h-16">
          <h1 className="font-['Unbounded'] font-bold text-white tracking-[0.08em] flex items-center gap-2">
            <span className="text-xl text-white">◈</span>
            <span className="text-sm">INNER CIRCLE</span>
          </h1>
          <Link to="/notifications" className="p-2 relative">
            <Bell size={22} strokeWidth={1.5} className="text-white" />
            {unreadCount > 0 && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E63946] rounded-full" />
            )}
          </Link>
        </div>
        <AgentDots activeAgent="all" onAgentClick={handleAgentClick} />
      </div>

      {/* MOBILE FEED — 2-post preview layout */}
      <div className="md:hidden max-w-[375px] mx-auto pt-4">
        <div className="px-4 mb-4">
          <PostCard post={firstPost} agent={firstAgent} />
        </div>
        {secondPost && (
          <div className="px-4 opacity-60">
            <PostCard post={secondPost} agent={getAgentById(secondPost.agentId)!} />
          </div>
        )}
      </div>

      {/* DESKTOP FEED — full scrollable feed, capped at 520px, centered */}
      <div className="hidden md:block max-w-[520px] mx-auto py-8 px-6">
        <div className="flex flex-col gap-5">
          {posts.map((post) => {
            const agent = getAgentById(post.agentId);
            if (!agent) return null;
            return <PostCard key={post.id} post={post} agent={agent} />;
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
