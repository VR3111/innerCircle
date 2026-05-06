// PostDetailScreen — post detail at /post/:id
//
// Wired to usePost(), useReplies(), useLike() hooks for real Supabase data.
// Visual structure matches scaffold-sandbox pixel-for-pixel.

import { useNavigate, useParams, useLocation } from 'react-router';
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { AGENTS, AGENT_ORDER, TOKENS, type AgentId } from '@/lib/design-tokens';
import { AgentDot, Odometer, PlaceholderImg, fmtCompact } from '@/components/primitives';
import type { Reply as ScaffoldReply } from '@/lib/types';
import { Skeleton } from '@/components/states';
import { CommentsSection } from '@/components/CommentsSection';
import { usePost } from '../hooks/usePost';
import { useReplies, type Reply as ApiReply } from '../hooks/useReplies';
import { useLike } from '../hooks/useLike';
import { AGENT_PROFILE_IDS } from '../lib/agents';

// ─── Build reverse lookup: agent profile UUID → uppercase AgentId ────────────
const PROFILE_ID_TO_AGENT = new Map<string, Exclude<AgentId, 'ALL'>>();
for (const [name, pid] of Object.entries(AGENT_PROFILE_IDS)) {
  PROFILE_ID_TO_AGENT.set(pid, name.toUpperCase() as Exclude<AgentId, 'ALL'>);
}

// ─── Transform flat API replies → nested scaffold Reply[] ────────────────────
// Flattens all descendants to max 2 visual levels (top-level + children).
// Each child carries replyingToHandle so the UI can show "Replying to @user".
function buildThread(
  flat: ApiReply[],
  likedIds: Set<string>,
): ScaffoldReply[] {
  const byId = new Map(flat.map(r => [r.id, r]));

  // Walk up the parent chain to find the root (top-level) ancestor.
  function rootId(r: ApiReply): string {
    let cur = r;
    while (cur.parentReplyId) {
      const parent = byId.get(cur.parentReplyId);
      if (!parent) break;
      cur = parent;
    }
    return cur.id;
  }

  // Display name of the reply's immediate parent (for "Replying to @X").
  function parentHandle(r: ApiReply): string | undefined {
    if (!r.parentReplyId) return undefined;
    const parent = byId.get(r.parentReplyId);
    if (!parent) return undefined;
    if (parent.isAgentReply) {
      const agentKey = PROFILE_ID_TO_AGENT.get(parent.userId);
      return agentKey ? AGENTS[agentKey].name : parent.username;
    }
    return parent.username;
  }

  function toScaffold(r: ApiReply, replyingToHandle?: string): ScaffoldReply {
    const agentKey = r.isAgentReply ? PROFILE_ID_TO_AGENT.get(r.userId) : undefined;
    return {
      id: r.id,
      agent: agentKey,
      name: r.isAgentReply ? undefined : r.username,
      text: r.content,
      time: r.timestamp,
      likes: 0,
      liked: likedIds.has(r.id),
      premium: r.isInnerCircle,
      replyingToHandle,
    };
  }

  const topLevel = flat.filter(r => !r.parentReplyId);
  const nested   = flat.filter(r => r.parentReplyId);

  return topLevel.map(r => ({
    ...toScaffold(r),
    replies: nested
      .filter(c => rootId(c) === r.id)
      .map(c => toScaffold(c, parentHandle(c))),
  }));
}

// ─── @mention autocomplete helpers ───────────────────────────────────────────

function getMentionQuery(text: string): string | null {
  const m = text.match(/(?:^|\s)@(\w*)$/);
  return m ? m[1] : null;
}

function applyMention(draft: string, name: string): string {
  const atIdx = draft.lastIndexOf('@');
  return atIdx === -1 ? draft : `${draft.slice(0, atIdx)}@${name} `;
}

const MENTION_AGENTS = AGENT_ORDER
  .filter(id => id !== 'ALL')
  .map(id => AGENTS[id]);

// ─────────────────────────────────────────────────────────────────────────────

export function PostDetailScreen() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const location = useLocation();
  const locationState = location.state as { scrollToComments?: boolean } | null;

  // ── Data hooks ─────────────────────────────────────────────────
  const { postWithAgent, loading: postLoading, error: postError } = usePost(id);
  const { replies: allReplies, loading: repliesLoading, addReply, pendingAgentReplies } = useReplies(id);

  const post = postWithAgent?.post;
  const agent = postWithAgent?.agent;
  const agentId = agent ? agent.id.toUpperCase() as AgentId : undefined;

  const { isLiked, likeCount, toggleLike: togglePostLike } = useLike(
    post?.id,
    post?.reactions ?? 0,
  );

  // ── Local UI state ─────────────────────────────────────────────
  const [following, setFollowing] = useState(false);
  const [draft, setDraft]         = useState('');
  const [replyTo, setReplyTo]     = useState<ScaffoldReply | null>(null);
  const [likedIds, setLikedIds]   = useState<Set<string>>(new Set());
  const [sending, setSending]     = useState(false);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIdx, setMentionIdx]     = useState(0);

  const inputRef    = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  // ── Build nested thread from flat replies ──────────────────────
  const thread = useMemo(() => {
    const base = buildThread(allReplies, likedIds);

    // Inject pending agent-reply "thinking" indicators
    if (pendingAgentReplies.size > 0) {
      const copy = base.map(t => ({ ...t, replies: [...(t.replies ?? [])] }));
      pendingAgentReplies.forEach((pending) => {
        const agentUpper = pending.agentName.toUpperCase() as Exclude<AgentId, 'ALL'>;
        const thinking: ScaffoldReply = {
          id: `pending-${pending.parentReplyId}`,
          agent: agentUpper,
          text: '…',
          time: '',
          likes: 0,
          liked: false,
        };
        // Attach as child of the parent reply
        const parent = copy.find(t => t.id === pending.parentReplyId);
        if (parent) {
          parent.replies = [...(parent.replies ?? []), thinking];
        } else {
          // Parent might be a nested child — find the grandparent
          for (const top of copy) {
            if (top.replies?.some(r => r.id === pending.parentReplyId)) {
              top.replies.push(thinking);
              break;
            }
          }
        }
      });
      return copy;
    }

    return base;
  }, [allReplies, likedIds, pendingAgentReplies]);

  const totalComments = allReplies.length;

  // Scroll to comments when opened via feed-card comment button
  useEffect(() => {
    if (!locationState?.scrollToComments || postLoading) return;
    const t = setTimeout(() => {
      commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(t);
  }, [locationState?.scrollToComments, postLoading]);

  // Keyboard avoidance: lift composer above the keyboard (web only).
  // On native iOS, resize:'native' shrinks the WKWebView so bottom:0 is
  // automatically above the keyboard — no JS adjustment needed.
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      if (!composerRef.current) return;
      const offset = Math.max(0, window.innerHeight - vv.offsetTop - vv.height);
      composerRef.current.style.bottom = `${offset}px`;
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  // ── Loading state ──────────────────────────────────────────────
  if (postLoading) return <PostSkeleton onBack={() => navigate(-1)} />;

  // ── Error / not-found state ────────────────────────────────────
  if (postError || !post || !agent || !agentId) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: TOKENS.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 12, letterSpacing: 1.4, color: TOKENS.mute,
        }}>
          {postError ? 'ERROR' : 'POST NOT FOUND'}
        </div>
        <div style={{ fontSize: 14, color: TOKENS.mute2, marginTop: 8, textAlign: 'center' }}>
          {postError ?? `/post/${id}`}
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            marginTop: 16, background: 'none', border: 'none',
            color: TOKENS.mute2, cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, textDecoration: 'underline',
            padding: 0,
          }}
        >
          Go back
        </button>
      </div>
    );
  }

  const A = AGENTS[agentId];

  // ── Comment interactions ───────────────────────────────────────
  const toggleCommentLike = (c: ScaffoldReply) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(c.id)) next.delete(c.id);
      else next.add(c.id);
      return next;
    });
  };

  const handleReply = (c: ScaffoldReply) => {
    const name = c.agent ? AGENTS[c.agent].name : (c.name ?? '');
    setReplyTo(c);
    setDraft(`@${name} `);
    setMentionQuery(null);
    setTimeout(() => {
      document.getElementById(`comment-${c.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      inputRef.current?.focus();
    }, 50);
  };

  const send = async () => {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const result = await addReply(
        trimmed,
        false, // isInnerCircle — server enforces based on user status
        replyTo?.id ?? undefined,
        post.headline,
        post.caption,
      );

      setDraft('');
      setReplyTo(null);
      setMentionQuery(null);

      if (result) {
        setTimeout(() => {
          document.getElementById(`comment-${result.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 80);
      }
    } finally {
      setSending(false);
    }
  };

  // ── @mention autocomplete ──────────────────────────────────────
  const mentionMatches = mentionQuery !== null
    ? MENTION_AGENTS.filter(a => a.name.toLowerCase().startsWith(mentionQuery.toLowerCase()))
    : [];

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDraft(val);
    const query = getMentionQuery(val);
    setMentionQuery(query);
    if (query !== mentionQuery) setMentionIdx(0);
  };

  const selectMention = (name: string) => {
    const atIdx = draft.lastIndexOf('@');
    const prefix = atIdx === -1 ? draft : draft.slice(0, atIdx);
    const dupRe = new RegExp(`@${name}\\b`, 'i');
    if (dupRe.test(prefix)) {
      setMentionQuery(null);
      setMentionIdx(0);
      inputRef.current?.focus();
      return;
    }
    const newDraft = applyMention(draft, name);
    setDraft(newDraft);
    setMentionQuery(null);
    setMentionIdx(0);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionQuery !== null && mentionMatches.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIdx(i => (i + 1) % mentionMatches.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIdx(i => (i - 1 + mentionMatches.length) % mentionMatches.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectMention(mentionMatches[mentionIdx].name);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === 'Enter') { void send(); }
  };

  return (
    <div className="relative flex flex-col h-full bg-bg">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header
        className="relative z-10 flex items-center gap-2.5 border-b border-line bg-bg"
        style={{ padding: 'calc(8px + var(--ic-top-inset, 0px)) 20px 10px' }}
      >
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-pill border border-line bg-white/[0.05] flex items-center justify-center text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Post author identity — user or agent */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {post.userId ? (
            <>
              <div
                role="button" tabIndex={0}
                onClick={() => navigate(`/profile/${post.authorUsername ?? ''}`)}
                style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  cursor: 'pointer', overflow: 'hidden',
                  background: 'linear-gradient(135deg, #2a2a2a, #121212)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {post.authorAvatarUrl ? (
                  <img src={post.authorAvatarUrl} alt="" style={{ width: 36, height: 36, objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, fontWeight: 700, color: '#fff' }}>
                    {(post.authorDisplayName ?? post.authorUsername ?? '?')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div
                className="leading-[1.15] min-w-0"
                onClick={() => navigate(`/profile/${post.authorUsername ?? ''}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="font-sans text-[14px] font-semibold text-white">
                  {post.authorDisplayName ?? post.authorUsername}
                </div>
                <div className="font-sans text-[9px] text-mute2 mt-0.5">
                  @{post.authorUsername} · {post.timestamp}
                </div>
              </div>
            </>
          ) : (
            <>
              <div
                role="button" tabIndex={0}
                onClick={() => navigate('/agent/' + agent.id.toLowerCase())}
                style={{ cursor: 'pointer', flexShrink: 0 }}
              >
                <AgentDot agent={agentId} size={36} clickable={false} />
              </div>
              <div
                className="leading-[1.15] min-w-0"
                onClick={() => navigate('/agent/' + agent.id.toLowerCase())}
                style={{ cursor: 'pointer' }}
              >
                <div className="font-sans text-[14px] font-semibold text-white">
                  {agent.name}
                </div>
                <div className="font-mono text-[9px] text-mute2 tracking-[0.14em] mt-0.5">
                  {A.tag.toUpperCase()} · {post.timestamp}
                </div>
              </div>
            </>
          )}
        </div>

        <button onClick={() => setFollowing(f => !f)}
          className="rounded-pill px-3.5 py-1.5 font-sans text-[11px] font-semibold border transition-colors"
          style={{ background: following ? 'transparent' : A.color, color: following ? A.color : '#0A0A0A', borderColor: A.color }}
        >{following ? 'FOLLOWING' : 'FOLLOW'}</button>
      </header>

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-[140px]">

        {/* Hero — real image or placeholder fallback */}
        <div className="relative rounded-card overflow-hidden border border-line mt-4">
          {post.image ? (
            <div style={{
              width: '100%', height: 280,
              backgroundImage: `url(${post.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
          ) : (
            <PlaceholderImg kind="grid" agent={agentId} height={280} />
          )}
          <div className="absolute inset-0"
               style={{ background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.85) 100%)' }} />
          <div className="absolute left-[18px] right-[18px] bottom-[18px]">
            <h1 className="m-0 font-sans text-[22px] font-bold text-white leading-[1.18] tracking-[-0.5px]"
                style={{ textWrap: 'pretty' }}>{post.headline}</h1>
          </div>
        </div>

        {post.caption && (
          <p className="mt-[18px] mb-3.5 font-sans text-[15px] leading-[1.55] text-white/[0.78]"
             style={{ textWrap: 'pretty' }}>{post.caption}</p>
        )}

        {/* Action row */}
        <div className="flex items-center gap-[18px] py-2.5 border-y border-line mb-2">
          <button onClick={togglePostLike}
            className="bg-transparent border-0 p-0 cursor-pointer flex items-center gap-1.5 font-sans text-[13px] font-medium transition-colors"
            style={{ color: isLiked ? '#E63946' : '#fff' }}>
            <motion.span animate={{ scale: isLiked ? 1.08 : 1 }} transition={{ duration: 0.2 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? '#E63946' : 'none'}>
                <path d="M12 21s-7-4.35-9.5-9.2A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 6.8C19 16.65 12 21 12 21z"
                      stroke={isLiked ? '#E63946' : 'currentColor'} strokeWidth="1.6" strokeLinejoin="round"/>
              </svg>
            </motion.span>
            <Odometer value={likeCount} format={fmtCompact} />
          </button>

          <button
            onClick={() => inputRef.current?.focus()}
            className="bg-transparent border-0 p-0 cursor-pointer flex items-center gap-1.5 font-sans text-[13px] font-medium text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 12a8 8 0 01-11.5 7.2L3 21l1.8-6.5A8 8 0 1121 12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
            <Odometer value={totalComments} format={fmtCompact} />
          </button>

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

        {/* Comments section */}
        <div ref={commentsRef}>
          {repliesLoading ? (
            <div style={{ padding: '20px 0' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0' }}>
                  <Skeleton className="w-[34px] h-[34px] rounded-full animate-sl-shimmer" />
                  <div style={{ flex: 1 }}>
                    <Skeleton className="h-3 w-20 animate-sl-shimmer" />
                    <Skeleton className="h-4 w-full mt-2 animate-sl-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <CommentsSection
              thread={thread}
              onLike={toggleCommentLike}
              onReply={handleReply}
              onUserTap={(handle) => navigate('/profile/' + handle)}
            />
          )}
        </div>
      </div>

      {/* ── Composer ────────────────────────────────────────────────────────── */}
      <div
        ref={composerRef}
        className="absolute bottom-0 left-0 right-0 z-20 border-t border-line bg-bg"
        style={{ padding: '10px 16px calc(6px + var(--ic-bot-inset, 0px))' }}
      >
        {replyTo && (
          <div className="flex items-center gap-2 px-3 py-1.5 mb-2 bg-white/[0.04] rounded-[8px] font-mono text-[10px] text-mute tracking-[0.05em]">
            <span>REPLYING TO</span>
            <span style={{ color: replyTo.agent ? AGENTS[replyTo.agent].color : '#fff' }}>
              @{replyTo.agent ? AGENTS[replyTo.agent].name : replyTo.name}
            </span>
            <button
              onClick={() => { setReplyTo(null); setDraft(''); setMentionQuery(null); }}
              className="ml-auto bg-transparent border-0 text-mute2 cursor-pointer text-[14px] p-0"
            >×</button>
          </div>
        )}

        {mentionQuery !== null && mentionMatches.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 16, right: 16,
            marginBottom: 4,
            background: '#121212',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
          }}>
            {mentionMatches.map((mentionAgent, i) => (
              <button
                key={mentionAgent.id}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => selectMention(mentionAgent.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 14px',
                  background: i === mentionIdx ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: 'none', borderBottom: i < mentionMatches.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 100ms',
                }}
              >
                <AgentDot agent={mentionAgent.id} size={24} clickable={false} />
                <div>
                  <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    {mentionAgent.name}
                  </div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.08em' }}>
                    {mentionAgent.tag}
                  </div>
                </div>
                {i === mentionIdx && (
                  <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: mentionAgent.color }} />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-bg2 border border-line2 rounded-pill">
          <div className="w-6 h-6 rounded-full shrink-0"
               style={{ background: 'radial-gradient(circle at 30% 30%, #888, #222)' }} />
          <input
            ref={inputRef}
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setMentionQuery(null), 150)}
            placeholder={replyTo
              ? `Reply to ${replyTo.agent ? AGENTS[replyTo.agent].name : replyTo.name}…`
              : `Add a comment for ${A.name}…`}
            className="flex-1 bg-transparent border-0 outline-none text-white font-sans text-[13px] min-w-0"
          />
          <button
            onClick={() => void send()}
            disabled={!draft.trim() || sending}
            className="rounded-pill px-3.5 py-1.5 font-sans text-[11px] font-semibold border-0 transition-all"
            style={{
              background: draft.trim() && !sending ? A.color : 'rgba(255,255,255,0.06)',
              color: draft.trim() && !sending ? '#0A0A0A' : 'rgba(255,255,255,0.22)',
              cursor: draft.trim() && !sending ? 'pointer' : 'default',
              boxShadow: draft.trim() && !sending ? `0 0 16px ${A.color}55` : 'none',
            }}
          >{sending ? '…' : 'POST'}</button>
        </div>
      </div>
    </div>
  );
}

function PostSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col h-full bg-bg">
      <header className="flex items-center gap-2.5 border-b border-line"
        style={{ padding: 'calc(8px + var(--ic-top-inset, 0px)) 20px 10px' }}>
        <button onClick={onBack}
          className="w-9 h-9 rounded-pill border border-line bg-white/[0.05] flex items-center justify-center text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <Skeleton className="w-9 h-9 rounded-full animate-sl-shimmer" />
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
