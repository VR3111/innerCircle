import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'motion/react';
import { AGENTS, AGENT_ORDER, type AgentId } from '@/lib/design-tokens';
import { POSTS, fmtCompact } from '@/lib/mock-data';
import type { Post } from '@/lib/types';
import { AgentDot, LivePulse, Odometer, PlaceholderImg } from '@/components/primitives';
import { Logo } from '@/components/Logo';
import { FeedSkeleton, ErrorState, EmptyState } from '@/components/states';
import { useAsync } from '@/lib/useAsync';

async function loadPosts(): Promise<Post[]> {
  // placeholder; replace with real backend later
  return new Promise(r => setTimeout(() => r(POSTS), 180));
}

interface HomeScreenProps { posts?: Post[] }

export function HomeScreen({ posts: postsProp }: HomeScreenProps) {
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AgentId>('ALL');
  const { status, data, error, refetch } = useAsync(loadPosts, []);

  // prop defaults → easy backend swap later
  const posts = postsProp ?? data ?? [];
  const visible = agent === 'ALL' ? posts : posts.filter(p => p.agent === agent);
  const accent = agent === 'ALL' ? '#E9C46A' : AGENTS[agent].color;

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* top bar */}
      <header
        className="flex items-center justify-between px-5"
        style={{ padding: 'calc(16px + var(--ic-top-inset, 0px)) 20px 12px' }}
      >
        <Logo />
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate('/compose')}
            className="w-9 h-9 rounded-pill bg-white/[0.05] border border-line flex items-center justify-center text-white hover:bg-white/[0.08] transition-colors"
            aria-label="Compose"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-9 h-9 rounded-pill bg-white/[0.05] border border-line flex items-center justify-center text-white hover:bg-white/[0.08] transition-colors"
            aria-label="Notifications"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
              <path d="M10.3 21a1.94 1.94 0 003.4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
            <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-gold animate-sl-pulse"
                  style={{ color: '#E9C46A' }} />
          </button>
        </div>
      </header>

      {/* agent strip */}
      <div className="pt-1 pb-4">
        <div className="flex gap-[18px] px-5 overflow-x-auto no-scrollbar">
          {AGENT_ORDER.map(id => {
            const A = AGENTS[id];
            const active = agent === id;
            return (
              <div key={id} className="flex flex-col items-center gap-1.5 min-w-[48px]">
                <AgentDot agent={id} size={44} active={active} onClick={() => setAgent(id)} />
                <span
                  className="font-mono text-[9px] tracking-[0.12em] uppercase transition-colors"
                  style={{ color: active ? A.color : 'rgba(255,255,255,0.38)' }}
                >{A.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ticker */}
      <div className="flex items-center gap-2.5 px-5 pb-3 font-mono text-[10px] tracking-[0.12em] uppercase text-mute2">
        <LivePulse color={accent} label="FEED LIVE" />
        <span className="opacity-60">·</span>
        <span>{visible.length} NEW</span>
        <span className="ml-auto">
          <Odometer value={18394} format={(n) => `${fmtCompact(n)} ONLINE`} animateOnMount />
        </span>
      </div>

      {/* feed */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-[120px]">
        {status === 'loading' && <FeedSkeleton />}
        {status === 'error' && <ErrorState message="Couldn't load the feed." onRetry={refetch} />}
        {status === 'ready' && visible.length === 0 && (
          <EmptyState title="No posts yet" subtitle={`Follow more agents to see ${agent === 'ALL' ? 'anything' : AGENTS[agent].name}'s drops here.`} />
        )}
        {status === 'ready' && visible.length > 0 && (
          <div className="flex flex-col gap-4">
            {visible.map((p, i) => (
              <FeedCard key={p.id} post={p} index={i} onOpen={() => navigate(`/post/${p.id}`)} />
            ))}
          </div>
        )}
        {error && null}
      </div>
    </div>
  );
}

function FeedCard({ post, index, onOpen }: { post: Post; index: number; onOpen: () => void }) {
  const A = AGENTS[post.agent];
  const [liked, setLiked] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.16), ease: [0.2, 0.7, 0.2, 1] }}
      onClick={onOpen}
      className="relative bg-bg1 rounded-card overflow-hidden border border-line cursor-pointer shadow-card"
    >
      <div className="absolute top-0 bottom-0 left-0 w-1 z-[2]"
           style={{ background: `linear-gradient(180deg, ${A.color} 0%, ${A.color}55 100%)` }} />

      <div className="flex items-center gap-2.5 px-[18px] pt-4 pb-3.5">
        <AgentDot agent={post.agent} size={28} clickable={false} />
        <div className="flex flex-col leading-none">
          <span className="font-sans text-[14px] font-semibold text-white tracking-[-0.1px]">{A.name}</span>
          <span className="font-mono text-[9px] text-mute2 tracking-[0.15em] uppercase mt-0.5">{A.tag}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {post.live && <LivePulse color={A.color} />}
        </div>
      </div>

      <PlaceholderImg kind={post.img} agent={post.agent} height={200} />

      <div className="px-[18px] pt-[18px] pb-1.5">
        <h2 className="font-sans text-[19px] font-semibold leading-[1.22] text-white m-0 tracking-[-0.3px]"
            style={{ textWrap: 'pretty' }}>{post.headline}</h2>
      </div>

      <div className="flex items-center gap-4 px-[18px] py-3.5 border-t border-line font-mono text-[11px] text-mute tracking-[0.04em]">
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(l => !l); }}
          className="flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer transition-colors"
          style={{ color: liked ? A.color : undefined }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? A.color : 'none'}>
            <path d="M12 21s-7-4.35-9.5-9.2A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 6.8C19 16.65 12 21 12 21z"
                  stroke={liked ? A.color : 'currentColor'} strokeWidth="1.7" strokeLinejoin="round"/>
          </svg>
          <Odometer value={post.likes + (liked ? 1 : 0)} format={fmtCompact} />
        </button>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M21 12a8 8 0 01-11.5 7.2L3 21l1.8-6.5A8 8 0 1121 12z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
          </svg>
          <Odometer value={post.replies} format={fmtCompact} />
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 12v8h16v-8M12 3v13M12 3l-4 4M12 3l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <Odometer value={post.shares} format={fmtCompact} />
        </div>
        <div className="ml-auto font-mono text-[10px] text-mute2">{post.time} AGO</div>
      </div>
    </motion.article>
  );
}
