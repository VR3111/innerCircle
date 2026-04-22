import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { AGENTS, AGENT_ORDER } from '@/lib/design-tokens';
import { POSTS, fmtCompact } from '@/lib/mock-data';
import type { Post, Reply } from '@/lib/types';
import { AgentDot, LivePulse, Odometer, PlaceholderImg } from '@/components/primitives';
import { ErrorState, Skeleton } from '@/components/states';
import { CommentsSection } from '@/components/CommentsSection';
import { useAsync } from '@/lib/useAsync';

async function loadPost(id: string): Promise<Post | null> {
  return new Promise(r => setTimeout(() => r(POSTS.find(p => p.id === id) ?? null), 160));
}

function buildSeedThread(agentId: Exclude<Reply['agent'], undefined>): Reply[] {
  return [
    {
      id: 'c1', name: 'devon_w',
      text: '@baron yields break — what\'s the read on 10Y here?',
      time: '5h', likes: 3, liked: false,
      replies: [
        { id: 'c1a', agent: agentId, text: '10Y through 4.05. Entry window is open — size into 60% of intended. Vol is still low.', time: '5h', likes: 28, liked: false, premium: true },
        { id: 'c1b', name: 'devon_w', text: '@Baron that was 3 hours ago!!!', time: '5h', likes: 0, liked: false },
        { id: 'c1c', agent: agentId, text: '@devon_w still valid — 10Y hasn\'t moved more than 2bps since. Update drops when futures open.', time: '4h', likes: 12, liked: false, premium: true },
      ],
    },
    {
      id: 'c2', name: 'quantrose',
      text: 'Curve steepeners should work from here — 2s10s has a lot of room to run.',
      time: '18m', likes: 42, liked: true,
      replies: [
        { id: 'c2a', name: 'monetary.mav', text: '@quantrose agreed — the belly is the cleanest expression imo.', time: '12m', likes: 8, liked: false },
      ],
    },
    {
      id: 'c3', name: 'nina.j',
      text: 'Saved this for the week ahead. Really clean framing.',
      time: '34m', likes: 6, liked: false, replies: [],
    },
  ];
}

// ─── @mention autocomplete helpers ───────────────────────────────────────────

// Detect an active @mention trigger: @ at start-of-string OR after whitespace,
// with no space between @ and cursor (space = mention completed).
// "email@test" does NOT trigger (@ not at start or after whitespace).
function getMentionQuery(text: string): string | null {
  const m = text.match(/(?:^|\s)@(\w*)$/);
  return m ? m[1] : null;
}

// Replace the trailing @partial in draft with @Name + space.
function applyMention(draft: string, name: string): string {
  const atIdx = draft.lastIndexOf('@');
  return atIdx === -1 ? draft : `${draft.slice(0, atIdx)}@${name} `;
}

// Real agents only — exclude the virtual ALL sentinel
const MENTION_AGENTS = AGENT_ORDER
  .filter(id => id !== 'ALL')
  .map(id => AGENTS[id]);

// ─────────────────────────────────────────────────────────────────────────────

export function PostDetailScreen() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const location = useLocation();
  const locationState = location.state as { scrollToComments?: boolean } | null;

  const { status, data: post, error, refetch } = useAsync(() => loadPost(id), [id]);
  const [following, setFollowing] = useState(false);
  const [liked, setLiked]         = useState(false);
  const [draft, setDraft]         = useState('');
  const [replyTo, setReplyTo]     = useState<Reply | null>(null);
  const [thread, setThread]       = useState<Reply[]>([]);

  // @mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIdx, setMentionIdx]     = useState(0);

  const inputRef      = useRef<HTMLInputElement>(null);
  const composerRef   = useRef<HTMLDivElement>(null);
  const commentsRef   = useRef<HTMLDivElement>(null);
  const threadSeeded  = useRef(false);

  // ── Seed thread once when post loads ───────────────────────────────────────
  useEffect(() => {
    if (!post || threadSeeded.current) return;
    threadSeeded.current = true;
    setThread(buildSeedThread(post.agent));
  }, [post]);

  // ── Scroll to comments when opened via feed-card comment button (Fix: from prev pass) ──
  useEffect(() => {
    if (!locationState?.scrollToComments || status !== 'ready') return;
    const t = setTimeout(() => {
      commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
    return () => clearTimeout(t);
  }, [locationState?.scrollToComments, status]);

  // ── Fix 4: visualViewport keyboard avoidance ────────────────────────────────
  // When the software keyboard opens, the visual viewport shrinks. We push the
  // composer up by setting its bottom offset to the gap between layout and visual
  // viewports. Supported: Chrome 61+, Safari 13+, Firefox 91+. Older browsers
  // skip gracefully via the `if (!vv)` guard. Capacitor iOS overrides this natively.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      if (!composerRef.current) return;
      // keyboard height = layout height − (visual viewport top + visual viewport height)
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

  if (status === 'loading') return <PostSkeleton onBack={() => navigate(-1)} />;
  if (status === 'error')
    return <div className="h-full bg-bg"><ErrorState message="Couldn't load post." onRetry={refetch} /></div>;
  if (!post) return <div className="h-full bg-bg"><ErrorState message="Post not found." onRetry={() => navigate('/')} /></div>;

  const A = AGENTS[post.agent];
  void error;

  const totalComments = thread.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0) || post.replies;

  // Filtered mention suggestions for current query
  const mentionMatches = mentionQuery !== null
    ? MENTION_AGENTS.filter(a => a.name.toLowerCase().startsWith(mentionQuery.toLowerCase()))
    : [];

  // ── Toggle like on any comment or nested reply ──────────────────────────────
  const toggleLike = (c: Reply) => {
    setThread(t => t.map(x => {
      if (x.id === c.id) return { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) };
      return { ...x, replies: x.replies?.map(r => r.id === c.id ? { ...r, liked: !r.liked, likes: r.likes + (r.liked ? -1 : 1) } : r) };
    }));
  };

  // ── Fix 2: Reply — prefill @mention, focus input, scroll comment into view ──
  const handleReply = (c: Reply) => {
    const name = c.agent ? AGENTS[c.agent].name : (c.name ?? '');
    setReplyTo(c);
    setDraft(`@${name} `);
    setMentionQuery(null); // trailing space → getMentionQuery returns null anyway; explicit for clarity
    setTimeout(() => {
      // Scroll the parent comment into view so user can see context while typing
      document.getElementById(`comment-${c.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      inputRef.current?.focus();
    }, 50);
  };

  // ── Send — draft is now the full text (mention already in draft if replying) ─
  // Fix 2: removed the old `mention + draft.trim()` prepend; @mention is now
  // prefilled into the input by handleReply so send() just uses draft as-is.
  const send = () => {
    if (!draft.trim()) return;
    // Capture id before setThread so the setTimeout closure can look it up in the DOM
    const newId = 'n' + Date.now();
    const newComment: Reply = {
      id: newId, name: 'you',
      text: draft.trim(), time: 'now', likes: 0, liked: false,
    };
    setThread(t => {
      if (!replyTo) return [...t, { ...newComment, replies: [] }];
      return t.map(x => {
        if (x.id === replyTo.id) return { ...x, replies: [...(x.replies ?? []), newComment] };
        if (x.replies?.some(r => r.id === replyTo.id)) return { ...x, replies: [...(x.replies ?? []), newComment] };
        return x;
      });
    });
    setDraft('');
    setReplyTo(null);
    setMentionQuery(null);
    // Fix 3: scroll new comment into view after React renders it.
    // block:'center' keeps it visible above the sticky composer (Option A).
    setTimeout(() => {
      document.getElementById(`comment-${newId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  // ── Fix 3: @mention input handlers ─────────────────────────────────────────

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDraft(val);
    const query = getMentionQuery(val);
    setMentionQuery(query);
    // Reset highlight index whenever the query changes (new letter typed / deleted)
    if (query !== mentionQuery) setMentionIdx(0);
  };

  const selectMention = (name: string) => {
    // Fix 1: strip the partial @query (about to be replaced) from draft,
    // then check if @name is already present as a whole word (case-insensitive).
    // @Blitz\b matches "@Blitz " but NOT "@Blitzkreig".
    const atIdx = draft.lastIndexOf('@');
    const prefix = atIdx === -1 ? draft : draft.slice(0, atIdx);
    const dupRe = new RegExp(`@${name}\\b`, 'i');
    if (dupRe.test(prefix)) {
      // Already mentioned — close dropdown silently, no insertion
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
    // Dropdown navigation takes priority over Enter-to-send
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
    // Normal Enter sends comment
    if (e.key === 'Enter') send();
  };

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
          <div role="button" tabIndex={0}
               onClick={() => navigate(`/profile/${post.agent}`)}
               style={{ display: 'inline-flex', cursor: 'pointer' }}>
            <AgentDot agent={post.agent} size={32} clickable={false} />
          </div>
          <div className="leading-[1.15] min-w-0">
            <div className="font-sans text-[14px] font-semibold text-white">{A.name}</div>
            <div className="font-mono text-[9px] text-mute2 tracking-[0.14em] mt-0.5">{A.tag.toUpperCase()} · {post.time} AGO</div>
          </div>
        </div>
        <button onClick={() => setFollowing(f => !f)}
          className="rounded-pill px-3.5 py-1.5 font-sans text-[11px] font-semibold border transition-colors"
          style={{ background: following ? 'transparent' : A.color, color: following ? A.color : '#0A0A0A', borderColor: A.color }}
        >{following ? 'FOLLOWING' : 'FOLLOW'}</button>
      </header>

      {/* Scrollable content */}
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

        {/* Action row */}
        <div className="flex items-center gap-[18px] py-2.5 border-y border-line mb-2">
          <button onClick={() => setLiked(l => !l)}
            className="bg-transparent border-0 p-0 cursor-pointer flex items-center gap-1.5 font-sans text-[13px] font-medium transition-colors"
            style={{ color: liked ? '#E63946' : '#fff' }}>
            <motion.span animate={{ scale: liked ? 1.08 : 1 }} transition={{ duration: 0.2 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? '#E63946' : 'none'}>
                <path d="M12 21s-7-4.35-9.5-9.2A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 6.8C19 16.65 12 21 12 21z"
                      stroke={liked ? '#E63946' : 'currentColor'} strokeWidth="1.6" strokeLinejoin="round"/>
              </svg>
            </motion.span>
            <Odometer value={post.likes + (liked ? 1 : 0)} format={fmtCompact} />
          </button>

          {/* Fix 1: comment icon is now a <button> that focuses the composer input */}
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
          <CommentsSection thread={thread} onLike={toggleLike} onReply={handleReply} />
        </div>
      </div>

      {/* ── Composer — Fix 4: ref used for visualViewport keyboard avoidance ── */}
      <div
        ref={composerRef}
        className="absolute bottom-0 left-0 right-0 z-20 border-t border-line bg-bg"
        style={{ padding: '10px 16px calc(18px + var(--ic-bot-inset, 0px))' }}
      >
        {/* Fix 2: REPLYING TO chip — × clears both replyTo AND draft */}
        {replyTo && (
          <div className="flex items-center gap-2 px-3 py-1.5 mb-2 bg-white/[0.04] rounded-[8px] font-mono text-[10px] text-mute tracking-[0.05em]">
            <span>REPLYING TO</span>
            <span style={{ color: replyTo.agent ? AGENTS[replyTo.agent].color : '#fff' }}>
              @{replyTo.agent ? AGENTS[replyTo.agent].name : replyTo.name}
            </span>
            {/* Fix 2: clear draft too so the prefilled @mention is removed */}
            <button
              onClick={() => { setReplyTo(null); setDraft(''); setMentionQuery(null); }}
              className="ml-auto bg-transparent border-0 text-mute2 cursor-pointer text-[14px] p-0"
            >×</button>
          </div>
        )}

        {/* Fix 3: @mention autocomplete dropdown — floats above the input row */}
        {mentionQuery !== null && mentionMatches.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 16, right: 16,
            marginBottom: 4,
            background: '#121212',           // bg2 value
            border: '1px solid rgba(255,255,255,0.10)',  // line2 value
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
          }}>
            {mentionMatches.map((agent, i) => (
              <button
                key={agent.id}
                // Fix 3: onPointerDown prevents input blur so onClick can fire
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => selectMention(agent.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 14px',
                  background: i === mentionIdx ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: 'none', borderBottom: i < mentionMatches.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 100ms',
                }}
              >
                <AgentDot agent={agent.id} size={24} clickable={false} />
                <div>
                  <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    {agent.name}
                  </div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.08em' }}>
                    {agent.tag}
                  </div>
                </div>
                {/* Highlight the matching prefix in the agent name */}
                {i === mentionIdx && (
                  <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: agent.color }} />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Input + POST button */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-bg2 border border-line2 rounded-pill">
          <div className="w-6 h-6 rounded-full shrink-0"
               style={{ background: 'radial-gradient(circle at 30% 30%, #888, #222)' }} />
          <input
            ref={inputRef}
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            // Fix 3: close dropdown on blur with a delay so click-on-item fires first
            onBlur={() => setTimeout(() => setMentionQuery(null), 150)}
            placeholder={replyTo
              ? `Reply to ${replyTo.agent ? AGENTS[replyTo.agent].name : replyTo.name}…`
              : `Add a comment for ${A.name}…`}
            className="flex-1 bg-transparent border-0 outline-none text-white font-sans text-[13px] min-w-0"
          />
          <button
            onClick={send}
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
