import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Post, Agent } from "../data/mockData";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import PostImage from "./PostImage";
import { useLike } from "../hooks/useLike";

interface PostCardProps {
  post: Post;
  agent: Agent;
  compact?: boolean;
}

export default function PostCard({ post, agent, compact = false }: PostCardProps) {
  const navigate = useNavigate();
  const { isLiked, likeCount, toggleLike } = useLike(post.id, post.reactions);

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/*
        The entire card is a clickable div rather than a <Link> wrapper.
        Using <Link> causes <button> inside <a> — invalid HTML — which makes
        stopPropagation unreliable across browsers. With a div onClick, the
        engagement buttons just need stopPropagation against a regular div.
      */}
      <div
        onClick={() => navigate(`/post/${post.id}`)}
        className={`bg-[#111111] rounded-2xl overflow-hidden cursor-pointer ${
          compact ? "w-full" : ""
        }`}
        style={{ borderLeft: `4px solid ${agent.color}` }}
      >
        {/* Agent Header */}
        <div className="flex items-center gap-3 p-4 pb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: agent.color }}
          >
            <span className="font-['Outfit'] font-bold text-white text-xs">
              {agent.initial}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-['Outfit'] font-semibold text-white">
              {agent.name}
            </div>
            <div className="font-['DM_Sans'] text-xs text-white/50">
              {post.timestamp}
            </div>
          </div>
        </div>

        {/* Image with gradient overlay */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <PostImage
            src={post.image}
            alt={post.headline}
            agentColor={agent.color}
            agentInitial={agent.initial}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Content */}
        <div className="p-4 pt-3">
          <h3 className="font-['Outfit'] font-bold text-white mb-2 leading-tight">
            {post.headline}
          </h3>
          <p className="font-['DM_Sans'] text-white/70 text-sm leading-relaxed line-clamp-2">
            {post.caption}
          </p>
        </div>

        {/* Engagement Row */}
        <div className="flex items-center gap-6 px-4 pb-4">
          <motion.button
            whileTap={{ scale: 0.82 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={(e) => { e.stopPropagation(); toggleLike(); }}
            className="flex items-center gap-2 transition-colors"
            style={{ color: isLiked ? agent.color : "rgba(255,255,255,0.4)" }}
          >
            <Heart
              size={18}
              strokeWidth={isLiked ? 0 : 1}
              fill={isLiked ? agent.color : "none"}
              className="transition-all duration-150"
            />
            <span
              className="font-['DM_Sans'] text-sm"
              style={{ color: isLiked ? agent.color : "rgba(255,255,255,0.5)" }}
            >
              {formatNumber(likeCount)}
            </span>
          </motion.button>

          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/post/${post.id}#replies`); }}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
          >
            <MessageCircle size={18} strokeWidth={1} />
            <span className="font-['DM_Sans'] text-sm text-white/50">
              {formatNumber(post.replies)}
            </span>
          </button>

          <button
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
          >
            <Share2 size={18} strokeWidth={1} />
            <span className="font-['DM_Sans'] text-sm text-white/50">
              {formatNumber(post.shares)}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
