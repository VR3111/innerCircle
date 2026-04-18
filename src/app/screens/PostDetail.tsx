import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, Heart, MessageCircle, Share2, CheckCircle2, Send } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { motion, AnimatePresence } from "motion/react";
import PostImage from "../components/PostImage";
import { useLike } from "../hooks/useLike";
import { usePost } from "../hooks/usePost";
import { useFollow } from "../hooks/useFollow";
import { useReplies } from "../hooks/useReplies";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PostDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 md:pb-0 animate-pulse">
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[375px] md:max-w-[640px] mx-auto flex items-center gap-3 px-4 md:px-6 h-16">
          <div className="w-8 h-8 rounded-xl bg-white/8" />
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-8 h-8 rounded-full bg-white/8" />
            <div className="h-4 w-28 rounded-md bg-white/8" />
          </div>
          <div className="h-7 w-16 rounded-full bg-white/8" />
        </div>
      </div>
      <div className="max-w-[375px] md:max-w-[640px] mx-auto">
        <div className="aspect-[4/3] md:aspect-[16/9] bg-white/5 border-l-4 border-white/8" />
        <div className="px-5 md:px-8 pt-6 pb-5 border-l-4 border-white/8 space-y-3">
          <div className="h-7 w-4/5 rounded-md bg-white/8" />
          <div className="h-7 w-3/5 rounded-md bg-white/8" />
          <div className="h-4 w-full rounded-md bg-white/5 mt-4" />
          <div className="h-4 w-full rounded-md bg-white/5" />
          <div className="h-4 w-2/3 rounded-md bg-white/5" />
        </div>
        <div className="flex gap-8 px-5 md:px-8 py-4 border-t border-b border-white/5">
          <div className="h-5 w-12 rounded-md bg-white/8" />
          <div className="h-5 w-12 rounded-md bg-white/8" />
          <div className="h-5 w-12 rounded-md bg-white/8" />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function PostNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 md:pb-0">
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[375px] md:max-w-[640px] mx-auto flex items-center px-4 md:px-6 h-16">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-32 px-8 text-center">
        <div className="text-4xl mb-4 opacity-20">◈</div>
        <p className="font-['Outfit'] font-bold text-white/40 text-lg mb-2">Post not found</p>
        <p className="font-['DM_Sans'] text-white/25 text-sm">
          This post may have been removed or the link is invalid.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}

// ─── Reply card ───────────────────────────────────────────────────────────────

interface ReplyCardProps {
  username: string
  content: string
  timestamp: string
  isAgentReply?: boolean
  agentColor?: string
  variant: "inner" | "general"
}

function ReplyCard({ username, content, timestamp, isAgentReply, agentColor, variant }: ReplyCardProps) {
  const initial = username[0]?.toUpperCase() ?? "?"

  if (variant === "inner") {
    return (
      <div
        className="bg-[#111111] rounded-xl p-4 border-l-[3px]"
        style={{ borderLeftColor: isAgentReply ? agentColor : "#E9C46A" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={
              isAgentReply
                ? { backgroundColor: agentColor, boxShadow: `0 0 10px ${agentColor}40` }
                : { backgroundColor: "#E9C46A20", border: "1px solid #E9C46A40" }
            }
          >
            <span
              className="font-['Outfit'] font-bold text-sm"
              style={{ color: isAgentReply ? "white" : "#E9C46A" }}
            >
              {initial}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            {/* Line 1: username · badge · timestamp    ♡ */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-['Outfit'] font-bold text-white text-sm">{username}</span>
              {isAgentReply ? (
                <span
                  className="text-[9px] font-['DM_Sans'] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
                  style={{
                    color: agentColor,
                    backgroundColor: `${agentColor}20`,
                    border: `1px solid ${agentColor}30`,
                  }}
                >
                  Agent
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] font-['DM_Sans'] font-bold uppercase tracking-[0.1em] text-[#E9C46A] bg-[#E9C46A]/12 border border-[#E9C46A]/25 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={9} />
                  Inner Circle
                </span>
              )}
              <span className="font-['DM_Sans'] text-white/25 text-[11px]">· {timestamp}</span>
              <button disabled className="ml-auto flex-shrink-0 flex items-center gap-1 text-white/15 cursor-default">
                <Heart size={13} strokeWidth={1} />
              </button>
            </div>
            {/* Line 2: content */}
            <p className="font-['DM_Sans'] text-white/80 text-sm leading-relaxed">{content}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#111111] rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="font-['Outfit'] font-bold text-white/50 text-sm">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          {/* Line 1: username · timestamp    ♡ */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-['Outfit'] font-bold text-white/80 text-sm">{username}</span>
            <span className="font-['DM_Sans'] text-white/25 text-[11px]">· {timestamp}</span>
            <button disabled className="ml-auto flex-shrink-0 flex items-center gap-1 text-white/15 cursor-default">
              <Heart size={13} strokeWidth={1} />
            </button>
          </div>
          {/* Line 2: content */}
          <p className="font-['DM_Sans'] text-white/60 text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

type Tab = "inner" | "everyone";

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { postWithAgent, loading, error } = usePost(postId);
  const { isLiked, likeCount, toggleLike } = useLike(
    postWithAgent?.post.id,
    postWithAgent?.post.reactions ?? 0,
  );
  const { isFollowing, followAgent, unfollowAgent } = useFollow();
  const { innerCircleReplies, generalReplies, loading: repliesLoading, addReply } = useReplies(postWithAgent?.post.id);

  const [activeTab, setActiveTab] = useState<Tab>("everyone");
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const replyInputRef = useRef<HTMLInputElement>(null);

  // When navigated via the comment icon (#replies hash):
  // 1. Query inner_circle to determine which tab to show
  // 2. After 300ms scroll to + focus the reply input
  // Runs when postWithAgent becomes available (post just loaded).
  useEffect(() => {
    if (window.location.hash !== '#replies') return;
    if (!postWithAgent) return;

    if (user) {
      supabase
        .from('inner_circle')
        .select('id')
        .eq('user_id', user.id)
        .eq('agent_id', postWithAgent.agent.id)
        .maybeSingle()
        .then(({ data }) => {
          setActiveTab(data ? 'inner' : 'everyone');
        });
    } else {
      setActiveTab('everyone');
    }

    const timer = setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        replyInputRef.current.focus({ preventScroll: true });
      } else {
        document.getElementById('replies')?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postWithAgent, user?.id]);

  if (loading) return <PostDetailSkeleton />;
  if (error || !postWithAgent) return <PostNotFound onBack={() => navigate(-1)} />;

  const { post, agent } = postWithAgent;
  const following = isFollowing(agent.id);

  const handleFollow = () => following ? unfollowAgent(agent.id) : followAgent(agent.id);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || isSubmitting) return;
    setIsSubmitting(true);
    setReplyText("");
    const ok = await addReply(text);
    if (!ok) {
      toast.error("Failed to post reply");
    }
    setIsSubmitting(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const activeReplies = activeTab === "inner" ? innerCircleReplies : generalReplies;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 md:pb-0">

      {/* ── Header ── */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[375px] md:max-w-[640px] mx-auto flex items-center gap-3 px-4 md:px-6 h-16">

          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>

          <Link
            to={`/agent/${agent.id}`}
            className="flex items-center gap-2.5 flex-1 min-w-0"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: agent.color, boxShadow: `0 0 12px ${agent.color}40` }}
            >
              <span className="font-['Outfit'] font-bold text-white text-xs">
                {agent.initial}
              </span>
            </div>
            <span className="font-['Outfit'] font-bold text-white text-[15px] truncate">
              {agent.name}
            </span>
          </Link>

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

      {/* ── Content ── */}
      <div className="max-w-[375px] md:max-w-[640px] mx-auto">

        {/* Hero image */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative"
          style={{ borderLeft: `4px solid ${agent.color}` }}
        >
          <div className="aspect-[4/3] md:aspect-[16/9] overflow-hidden">
            <PostImage
              src={post.image}
              alt={post.headline}
              agentColor={agent.color}
              agentInitial={agent.initial}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>
        </motion.div>

        {/* Headline + body */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="px-5 md:px-8 pt-6 pb-5"
          style={{ borderLeft: `4px solid ${agent.color}` }}
        >
          <h1 className="font-['Outfit'] font-bold text-white text-2xl md:text-3xl leading-tight mb-4">
            {post.headline}
          </h1>
          <p className="font-['DM_Sans'] text-white/75 text-[15px] leading-relaxed">
            {post.caption}
          </p>
          <div className="mt-4 font-['DM_Sans'] text-white/25 text-xs">
            {post.timestamp}
          </div>
        </motion.div>

        {/* Engagement row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-8 px-5 md:px-8 py-4 border-t border-b border-white/5"
        >
          <motion.button
            whileTap={{ scale: 0.82 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={toggleLike}
            className="flex items-center gap-2 transition-colors"
            style={{ color: isLiked ? agent.color : "rgba(255,255,255,0.4)" }}
          >
            <Heart
              size={22}
              strokeWidth={isLiked ? 0 : 1.5}
              fill={isLiked ? agent.color : "none"}
              className="transition-all duration-150"
            />
            <span className="font-['DM_Sans'] text-sm">{formatNumber(likeCount)}</span>
          </motion.button>

          <button
            onClick={() => {
              replyInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              replyInputRef.current?.focus({ preventScroll: true });
            }}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
          >
            <MessageCircle size={22} strokeWidth={1.5} />
            <span className="font-['DM_Sans'] text-sm">
              {formatNumber(innerCircleReplies.length + generalReplies.length)}
            </span>
          </button>

          {/* Share — copies URL to clipboard */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={handleShare}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
          >
            <Share2 size={22} strokeWidth={1.5} />
            <span className="font-['DM_Sans'] text-sm">{formatNumber(post.shares)}</span>
          </motion.button>
        </motion.div>

        {/* ── Reply section ── */}
        <div id="replies" className="px-5 md:px-8 pt-6 pb-10">

          {/* Tab row */}
          <div className="flex items-center gap-1 mb-6 bg-[#111111] rounded-xl p-1">
            <button
              onClick={() => setActiveTab("inner")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-['Outfit'] font-semibold transition-all ${
                activeTab === "inner"
                  ? "bg-[#E9C46A]/15 text-[#E9C46A]"
                  : "text-white/35 hover:text-white/60"
              }`}
            >
              <CheckCircle2 size={14} className={activeTab === "inner" ? "text-[#E9C46A]" : "text-white/25"} />
              Inner Circle
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === "inner"
                    ? "bg-[#E9C46A]/20 text-[#E9C46A]"
                    : "bg-white/10 text-white/30"
                }`}
              >
                {innerCircleReplies.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("everyone")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-['Outfit'] font-semibold transition-all ${
                activeTab === "everyone"
                  ? "bg-white/8 text-white"
                  : "text-white/35 hover:text-white/60"
              }`}
            >
              Everyone
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === "everyone"
                    ? "bg-white/15 text-white/70"
                    : "bg-white/10 text-white/30"
                }`}
              >
                {generalReplies.length}
              </span>
            </button>
          </div>

          {/* Inner Circle banner */}
          <AnimatePresence mode="wait">
            {activeTab === "inner" && (
              <motion.div
                key="ic-banner"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-5 overflow-hidden"
              >
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#E9C46A]/8 border border-[#E9C46A]/20">
                  <CheckCircle2 size={14} className="text-[#E9C46A] flex-shrink-0" />
                  <p className="font-['DM_Sans'] text-[#E9C46A]/80 text-[11px] leading-snug">
                    Inner Circle members get direct replies from {agent.name}. These are exclusive to subscribers.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reply list */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {repliesLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-[#111111] rounded-xl p-4 flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/8 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-24 rounded bg-white/8" />
                        <div className="h-3 w-full rounded bg-white/5" />
                        <div className="h-3 w-3/4 rounded bg-white/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeReplies.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="font-['DM_Sans'] text-white/25 text-sm">
                    {activeTab === "everyone" ? "Be the first to reply" : "No Inner Circle replies yet"}
                  </p>
                </div>
              ) : (
                activeReplies.map((reply, index) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ReplyCard
                      username={reply.username}
                      content={reply.content}
                      timestamp={reply.timestamp}
                      isAgentReply={reply.isAgentReply}
                      agentColor={agent.color}
                      variant={activeTab === "inner" ? "inner" : "general"}
                    />
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>

          {/* Inner Circle upsell */}
          {activeTab === "inner" && !repliesLoading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 p-5 rounded-2xl border border-dashed border-[#E9C46A]/25 bg-[#E9C46A]/5 text-center"
            >
              <CheckCircle2 size={20} className="text-[#E9C46A]/60 mx-auto mb-2" />
              <p className="font-['Outfit'] font-bold text-white/70 text-sm mb-1">
                Join the Inner Circle
              </p>
              <p className="font-['DM_Sans'] text-white/35 text-xs leading-snug">
                Get direct access to {agent.name}'s personal takes and reply threads.
              </p>
            </motion.div>
          )}

          {/* Reply input */}
          {user && (
            <form
              onSubmit={handleReplySubmit}
              className="mt-6 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white/8">
                <span className="font-['Outfit'] font-bold text-white/50 text-xs">
                  {(user.user_metadata?.username ?? user.email ?? "?")[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-[#111111] rounded-xl px-4 py-2.5 border border-white/5 focus-within:border-white/15 transition-colors">
                <input
                  ref={replyInputRef}
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Add a reply..."
                  maxLength={500}
                  className="flex-1 bg-transparent text-white text-sm font-['DM_Sans'] placeholder:text-white/25 outline-none"
                />
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="flex-shrink-0 transition-opacity disabled:opacity-30"
                  style={{ color: agent.color }}
                >
                  <Send size={18} strokeWidth={1.5} />
                </motion.button>
              </div>
            </form>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
