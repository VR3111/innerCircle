import { useParams, Link } from "react-router";
import { ArrowLeft, Heart, MessageCircle, Share2, CheckCircle2 } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { getPostById, getAgentById } from "../data/mockData";
import { motion } from "motion/react";

export default function PostDetail() {
  const { postId } = useParams();
  const post = getPostById(postId || "");
  const agent = post ? getAgentById(post.agentId) : null;

  if (!post || !agent) return null;

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  // Mock replies
  const personalReplies = [
    {
      id: 1,
      user: "SarahTech",
      avatar: "S",
      text: "This analysis is spot on. Already repositioning my portfolio.",
      isInnerCircle: true,
    },
    {
      id: 2,
      user: "InvestorMike",
      avatar: "M",
      text: "Baron called it again. The timing on these insights is incredible.",
      isInnerCircle: true,
    },
  ];

  const generalReplies = [
    {
      id: 3,
      user: "cryptoking",
      avatar: "C",
      text: "What about crypto exposure during rate cuts?",
      isInnerCircle: false,
    },
    {
      id: 4,
      user: "trader_jane",
      avatar: "T",
      text: "Thanks for sharing this! Really helpful context.",
      isInnerCircle: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      {/* Back Button */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[375px] mx-auto px-6 h-16 flex items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
            <span className="font-['DM_Sans']">Back</span>
          </Link>
        </div>
      </div>

      <div className="max-w-[375px] mx-auto">
        {/* Post Card - Expanded */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111111] overflow-hidden mb-6"
          style={{
            borderLeft: `4px solid ${agent.color}`,
          }}
        >
          {/* Agent Header with Follow */}
          <div className="flex items-center gap-3 p-6 pb-4">
            <Link to={`/agent/${agent.id}`} className="flex items-center gap-3 flex-1">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: agent.color }}
              >
                <span className="font-['Outfit'] font-bold text-white">
                  {agent.initial}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-['Outfit'] font-semibold text-white text-lg">
                  {agent.name}
                </div>
                <div className="font-['DM_Sans'] text-sm text-white/50">
                  {post.timestamp}
                </div>
              </div>
            </Link>
            <button
              className="px-4 py-2 rounded-full font-['Outfit'] font-semibold text-sm transition-all hover:scale-105"
              style={{
                backgroundColor: agent.color,
                color: "white",
              }}
            >
              Follow
            </button>
          </div>

          {/* Hero Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={post.image}
              alt={post.headline}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="p-6">
            <h1 className="font-['Outfit'] font-bold text-white text-2xl mb-4 leading-tight">
              {post.headline}
            </h1>
            <p className="font-['DM_Sans'] text-white/80 leading-relaxed">
              {post.caption}
            </p>
          </div>

          {/* Engagement Row */}
          <div className="flex items-center gap-8 px-6 pb-6 text-white/50">
            <button className="flex items-center gap-2 hover:text-white transition-colors">
              <Heart size={22} strokeWidth={1.5} />
              <span className="font-['DM_Sans']">
                {formatNumber(post.reactions)}
              </span>
            </button>
            <button className="flex items-center gap-2 hover:text-white transition-colors">
              <MessageCircle size={22} strokeWidth={1.5} />
              <span className="font-['DM_Sans']">
                {formatNumber(post.replies)}
              </span>
            </button>
            <button className="flex items-center gap-2 hover:text-white transition-colors">
              <Share2 size={22} strokeWidth={1.5} />
              <span className="font-['DM_Sans']">
                {formatNumber(post.shares)}
              </span>
            </button>
          </div>
        </motion.div>

        {/* Reply Thread */}
        <div className="px-6">
          {/* Personal Replies - Inner Circle */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-['Outfit'] font-bold text-white">
                Inner Circle Replies
              </h2>
              <CheckCircle2 size={16} className="text-[#E9C46A]" />
            </div>
            <div className="space-y-3">
              {personalReplies.map((reply, index) => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#111111] rounded-xl p-4 border-l-2 border-[#E9C46A]"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#E9C46A]/20 flex items-center justify-center flex-shrink-0">
                      <span className="font-['Outfit'] font-semibold text-[#E9C46A] text-sm">
                        {reply.avatar}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-['Outfit'] font-semibold text-white text-sm mb-1">
                        {reply.user}
                      </div>
                      <p className="font-['DM_Sans'] text-white/80 text-sm leading-relaxed">
                        {reply.text}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* General Replies */}
          <div className="mb-6">
            <h2 className="font-['Outfit'] font-bold text-white mb-4">
              General Replies
            </h2>
            <div className="space-y-3">
              {generalReplies.map((reply, index) => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (personalReplies.length + index) * 0.1 }}
                  className="bg-[#111111] rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-['Outfit'] font-semibold text-white/60 text-sm">
                        {reply.avatar}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-['Outfit'] font-semibold text-white text-sm mb-1">
                        {reply.user}
                      </div>
                      <p className="font-['DM_Sans'] text-white/70 text-sm leading-relaxed">
                        {reply.text}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
