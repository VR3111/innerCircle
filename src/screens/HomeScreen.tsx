import { useNavigate } from 'react-router';
import { useState } from 'react';
import { motion } from 'motion/react';
import { AGENTS, AGENT_ORDER, TOKENS, type AgentId } from '@/lib/design-tokens';
import { AgentDot, LivePulse, Odometer, PlaceholderImg, fmtCompact } from '@/components/primitives';
import { Logo } from '@/components/Logo';
import { FeedSkeleton, ErrorState, EmptyState } from '@/components/states';
import { usePosts, type PostWithAgent } from '../hooks/usePosts';
import { useLike } from '../hooks/useLike';

// Map scaffold AgentId (uppercase) → agent slug for usePosts filter
function agentSlug(id: AgentId): string | undefined {
  return id === 'ALL' ? undefined : id.toLowerCase();
}

// Map lowercase agent slug → scaffold AgentId for AgentDot
function toAgentId(slug: string): AgentId {
  return slug.toUpperCase() as AgentId;
}

export function HomeScreen() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AgentId>('ALL');
  const [scroll, setScroll] = useState(0);

  const { posts, loading, error } = usePosts(agentSlug(agent));

  const accent = agent === 'ALL' ? TOKENS.gold : AGENTS[agent].color;

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* top bar */}
      <header
        className="flex items-center justify-between"
        style={{ padding: 'calc(18px + var(--ic-top-inset, 0px)) 20px 14px' }}
      >
        <Logo />
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/compose')}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: 'rgba(212,175,55,0.1)',
              border: `1px solid ${TOKENS.gold}44`,
              color: TOKENS.gold,
            }}
            aria-label="Compose"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="relative cursor-pointer"
            style={{ background: 'none', border: 'none', padding: 6, color: '#ffffff' }}
            aria-label="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
              <path d="M10.3 21a1.94 1.94 0 003.4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
            <span
              className="absolute rounded-full animate-sl-pulse"
              style={{
                top: 4, right: 4,
                width: 7, height: 7,
                background: TOKENS.gold,
                boxShadow: `0 0 6px ${TOKENS.gold}`,
              }}
            />
          </button>
        </div>
      </header>

      {/* agent strip */}
      <div className="pt-1 pb-[18px]">
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

      {/* live ticker */}
      <div className="flex items-center gap-2.5 px-5 pb-3 font-mono text-[10px] tracking-[0.12em] uppercase text-mute2">
        <LivePulse color={accent} label="FEED LIVE" />
        <span className="opacity-60">·</span>
        <span>{posts.length} NEW</span>
        <span className="ml-auto">
          <Odometer value={18394 + Math.floor(scroll)} format={(n) => `${fmtCompact(n)} ONLINE`} animateOnMount />
        </span>
      </div>

      {/* feed */}
      <div
        className="flex-1 overflow-y-auto no-scrollbar px-5 pb-[120px]"
        onScroll={(e) => setScroll(e.currentTarget.scrollTop)}
      >
        {loading && <FeedSkeleton />}
        {error && !loading && <ErrorState message={error} onRetry={() => window.location.reload()} />}
        {!loading && !error && posts.length === 0 && (
          <EmptyState title="No posts yet" subtitle={`Follow more agents to see ${agent === 'ALL' ? 'anything' : AGENTS[agent].name}'s drops here.`} />
        )}
        {!loading && !error && posts.length > 0 && (
          <div className="flex flex-col gap-4">
            {posts.map((item, i) => {
              const parallax = Math.min(10, Math.max(-10, (scroll - i * 430) * -0.04));
              return (
                <FeedCard
                  key={item.post.id}
                  item={item}
                  index={i}
                  parallax={parallax}
                  onOpen={() => navigate(`/post/${item.post.id}`)}
                  onOpenComments={() => navigate(`/post/${item.post.id}`, { state: { scrollToComments: true } })}
                  onAgent={() => navigate(`/agent/${item.agent.id.toLowerCase()}`)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedCard({
  item,
  index,
  parallax = 0,
  onOpen,
  onOpenComments,
  onAgent,
}: {
  item: PostWithAgent;
  index: number;
  parallax?: number;
  onOpen: () => void;
  onOpenComments?: () => void;
  onAgent?: () => void;
}) {
  const navigate = useNavigate();
  const { post, agent } = item;
  const agentId = toAgentId(post.agentId);
  const { isLiked, likeCount, toggleLike } = useLike(post.id, post.reactions);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.16), ease: [0.2, 0.7, 0.2, 1] }}
      onClick={onOpen}
      className="relative bg-bg1 rounded-card overflow-hidden border border-line cursor-pointer shadow-card"
    >
      <div className="absolute top-0 bottom-0 left-0 w-1 z-[2]"
           style={{ background: `linear-gradient(180deg, ${agent.color} 0%, ${agent.color}55 100%)` }} />

      <div className="flex items-center gap-2.5 px-[18px] pt-4 pb-3.5">
        {post.userId ? (
          <>
            <div
              role="button" tabIndex={0}
              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.authorUsername ?? ''}`); }}
              style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                cursor: 'pointer', overflow: 'hidden',
                background: 'linear-gradient(135deg, #2a2a2a, #121212)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {post.authorAvatarUrl ? (
                <img src={post.authorAvatarUrl} alt="" style={{ width: 28, height: 28, objectFit: 'cover' }} />
              ) : (
                <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {(post.authorDisplayName ?? post.authorUsername ?? '?')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-sans text-[14px] font-semibold text-white tracking-[-0.1px]">
                {post.authorDisplayName ?? post.authorUsername}
              </span>
              <span className="font-sans text-[9px] text-mute2 mt-0.5">
                @{post.authorUsername}
              </span>
            </div>
          </>
        ) : (
          <>
            <div
              role="button" tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onAgent?.(); }}
              style={{ display: 'inline-flex', cursor: 'pointer' }}
            >
              <AgentDot agent={agentId} size={28} clickable={false} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-sans text-[14px] font-semibold text-white tracking-[-0.1px]">{agent.name}</span>
              <span className="font-mono text-[9px] text-mute2 tracking-[0.15em] uppercase mt-0.5">{agent.category}</span>
            </div>
          </>
        )}
      </div>

      {/* Image: real URL or placeholder fallback */}
      <div style={{ overflow: 'hidden' }}>
        <div style={{
          transform: `translateY(${parallax}px) scale(${1 + Math.abs(parallax) * 0.001})`,
          transition: 'transform 60ms linear',
        }}>
          {post.image ? (
            <img
              src={post.image}
              alt={post.headline}
              loading="lazy"
              style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <PlaceholderImg kind="grid" agent={agentId} height={200} />
          )}
        </div>
      </div>

      <div className="px-[18px] pt-[18px] pb-1.5">
        <h2 className="font-sans text-[19px] font-semibold leading-[1.22] text-white m-0 tracking-[-0.3px]"
            style={{ textWrap: 'pretty' }}>{post.headline}</h2>
      </div>

      <div className="flex items-center gap-4 px-[18px] pt-3.5 pb-[18px] border-t border-line font-mono text-[11px] text-mute tracking-[0.04em]">
        <button
          onClick={(e) => { e.stopPropagation(); toggleLike(); }}
          className="flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer transition-colors"
          style={{ color: isLiked ? agent.color : undefined }}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill={isLiked ? agent.color : 'none'}
            style={{
              transition: 'fill 200ms, transform 200ms',
              transform: isLiked ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            <path d="M12 21s-7-4.35-9.5-9.2A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 6.8C19 16.65 12 21 12 21z"
                  stroke={isLiked ? agent.color : 'currentColor'} strokeWidth="1.7" strokeLinejoin="round"/>
          </svg>
          <Odometer value={likeCount} format={fmtCompact} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); (onOpenComments ?? onOpen)(); }}
          className="flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer"
          style={{ color: 'rgba(255,255,255,0.58)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M21 12a8 8 0 01-11.5 7.2L3 21l1.8-6.5A8 8 0 1121 12z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
          </svg>
          <Odometer value={post.replies} format={fmtCompact} />
        </button>
        <button
          className="flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer"
          style={{ color: 'rgba(255,255,255,0.58)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 12v8h16v-8M12 3v13M12 3l-4 4M12 3l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <Odometer value={post.shares} format={fmtCompact} />
        </button>
        <div className="ml-auto font-mono text-[10px] text-mute2">{post.timestamp}</div>
      </div>
    </motion.article>
  );
}
