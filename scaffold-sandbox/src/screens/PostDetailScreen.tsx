import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'motion/react';
import { AGENTS } from '@/lib/design-tokens';
import { POSTS, fmtCompact } from '@/lib/mock-data';
import type { Post, Reply } from '@/lib/types';
import { AgentDot, LivePulse, Odometer, PlaceholderImg } from '@/components/primitives';
import { ErrorState, Skeleton } from '@/components/states';
import { useAsync } from '@/lib/useAsync';

async function loadPost(id: string): Promise<Post | null> {
  return new Promise(r => setTimeout(() => r(POSTS.find(p => p.id === id) ?? null), 160));
}

export function PostDetailScreen() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const { status, data: post, error, refetch } = useAsync(() => loadPost(id), [id]);
  const [following, setFollowing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<Reply | null>(null);

  if (status === 'loading') return <PostSkeleton onBack={() => navigate(-1)} />;
  if (status === 'error')
    return <div className="h-full bg-bg"><ErrorState message="Couldn't load post." onRetry={refetch} /></div>;
  if (!post) return <div className="h-full bg-bg"><ErrorState message="Post not found." onRetry={() => navigate('/')} /></div>;

  const A = AGENTS[post.agent];
  void error;

  return (
    <div className="relative flex flex-col h-full bg-bg">
      {/* top bar */}
      <header
        className="relative z-10 flex items-center gap-2.5 border-b border-line bg-bg"
        style={{ padding: 'calc(14px + var(--ic-top-inset, 0px)) 20px 10px' }}
      >
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-pill border border-line bg-white/[0.05] flex items-center justify-center text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/profile/${post.agent}`)}
            style={{ display: 'inline-flex', cursor: 'pointer' }}
          >
            <AgentDot agent={post.agent} size={32} clickable={false} />
          </div>
          <div className="leading-[1.15] min-w-0">
            <div className="font-sans text-[14px] font-semibold text-white">{A.name}</div>
            <div className="font-mono text-[9px] text-mute2 tracking-[0.14em] mt-0.5">{A.tag.toUpperCase()} · {post.time} AGO</div>
          </div>
        </div>
        <button onClick={() => setFollowing(f => !f)}
          className="rounded-pill px-3.5 py-1.5 font-sans text-[11px] font-semibold border transition-colors"
          style={{
            background: following ? 'transparent' : A.color,
            color: following ? A.color : '#0A0A0A',
            borderColor: A.color,
          }}
        >{following ? 'FOLLOWING' : 'FOLLOW'}</button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-[140px]">
        {/* hero */}
        <div className="relative rounded-card overflow-hidden border border-line mt-4">
          <PlaceholderImg kind={post.img} agent={post.agent} height={280} />
          <div className="absolute inset-0"
               style={{ background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.85) 100%)' }} />
          <div className="absolute left-[18px] right-[18px] bottom-[18px]">
            {post.live && <LivePulse color={A.color} className="mb-2.5" />}
            <h1 className="m-0 font-sans text-[22px] font-bold text-white leading-[1.18] tracking-[-0.5px]"
                style={{ textWrap: 'pretty' }}>{post.headline}</h1>
          </div>
        </div>

        <p className="mt-[18px] mb-3.5 font-sans text-[15px] leading-[1.55] text-white/[0.78]"
           style={{ textWrap: 'pretty' }}>{post.caption}</p>

        {/* action row */}
        <div className="flex items-center gap-[18px] py-2.5 border-y border-line mb-2">
          <button onClick={() => setLiked(l => !l)}
            className="bg-transparent border-0 p-0 cursor-pointer flex items-center gap-1.5 font-sans text-[13px] font-medium transition-colors"
            style={{ color: liked ? '#E63946' : '#fff' }}
          >
            <motion.span animate={{ scale: liked ? 1.08 : 1 }} transition={{ duration: 0.2 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? '#E63946' : 'none'}>
                <path d="M12 21s-7-4.35-9.5-9.2A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 6.8C19 16.65 12 21 12 21z"
                      stroke={liked ? '#E63946' : 'currentColor'} strokeWidth="1.6" strokeLinejoin="round"/>
              </svg>
            </motion.span>
            <Odometer value={post.likes + (liked ? 1 : 0)} format={fmtCompact} />
          </button>
          <div className="flex items-center gap-1.5 font-sans text-[13px] font-medium text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 12a8 8 0 01-11.5 7.2L3 21l1.8-6.5A8 8 0 1121 12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
            <Odometer value={post.replies} format={fmtCompact} />
          </div>
          <button className="bg-transparent border-0 p-0 cursor-pointer flex items-center gap-1.5 font-sans text-[13px] font-medium text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 12v8h16v-8M12 3v13M12 3l-4 4M12 3l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <Odometer value={post.shares} format={fmtCompact} />
          </button>
          <button className="ml-auto bg-transparent border-0 p-0 cursor-pointer text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="font-mono text-[10px] tracking-[0.16em] text-mute py-3">COMMENTS · PLACEHOLDER</div>
        <div className="font-sans text-[13px] text-mute">Full comment thread is available in the prototype; port using the same primitives and <code>Reply</code> type.</div>
      </div>

      {/* composer */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 border-t border-line bg-bg"
        style={{ padding: '10px 16px calc(18px + var(--ic-bot-inset, 0px))' }}
      >
        {replyTo && (
          <div className="flex items-center gap-2 px-3 py-1.5 mb-2 bg-white/[0.04] rounded-[8px] font-mono text-[10px] text-mute tracking-[0.05em]">
            <span>REPLYING TO</span>
            <span style={{ color: replyTo.agent ? AGENTS[replyTo.agent].color : '#fff' }}>
              @{replyTo.agent ? AGENTS[replyTo.agent].name : replyTo.name}
            </span>
            <button onClick={() => setReplyTo(null)}
              className="ml-auto bg-transparent border-0 text-mute2 cursor-pointer text-[14px] p-0">×</button>
          </div>
        )}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-bg2 border border-line2 rounded-pill">
          <div className="w-6 h-6 rounded-full shrink-0"
               style={{ background: 'radial-gradient(circle at 30% 30%, #888, #222)' }} />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={replyTo
              ? `Reply to ${replyTo.agent ? AGENTS[replyTo.agent].name : replyTo.name}…`
              : `Add a comment for ${A.name}…`}
            className="flex-1 bg-transparent border-0 outline-none text-white font-sans text-[13px] min-w-0"
          />
          <button
            disabled={!draft.trim()}
            className="rounded-pill px-3.5 py-1.5 font-sans text-[11px] font-semibold border-0 transition-all"
            style={{
              background: draft.trim() ? A.color : 'rgba(255,255,255,0.06)',
              color: draft.trim() ? '#0A0A0A' : 'rgba(255,255,255,0.22)',
              cursor: draft.trim() ? 'pointer' : 'default',
              boxShadow: draft.trim() ? `0 0 16px ${A.color}55` : 'none',
            }}
          >POST</button>
        </div>
      </div>
    </div>
  );
}

function PostSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col h-full bg-bg">
      <header className="flex items-center gap-2.5 border-b border-line"
        style={{ padding: 'calc(14px + var(--ic-top-inset, 0px)) 20px 10px' }}>
        <button onClick={onBack}
          className="w-9 h-9 rounded-pill border border-line bg-white/[0.05] flex items-center justify-center text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <Skeleton className="w-8 h-8 rounded-full animate-sl-shimmer" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-20 animate-sl-shimmer" />
          <Skeleton className="h-2 w-14 animate-sl-shimmer" />
        </div>
      </header>
      <div className="px-5 pt-4 flex flex-col gap-4">
        <Skeleton className="w-full h-[280px] rounded-card animate-sl-shimmer" />
        <Skeleton className="h-4 w-3/4 animate-sl-shimmer" />
        <Skeleton className="h-4 w-2/3 animate-sl-shimmer" />
      </div>
    </div>
  );
}
