// screen-post.jsx — post detail with Instagram-style flat comments

const { useState: _ps } = React;

// Flat comment — one comment. Nesting is flat: replies render at same indent
// but with an @mention pointing to the parent author.
function Comment({ c, onReply, onLike, indent = false }) {
  const A = c.agent ? AGENTS[c.agent] : null;
  const liked = c.liked;
  const displayName = A ? A.name : c.name;
  const nameColor = A ? A.color : TOKENS.text;

  // parse @mentions inline
  const renderText = (text) => {
    const parts = String(text).split(/(@\w+)/g);
    return parts.map((p, i) =>
      p.startsWith('@')
        ? <span key={i} style={{ color: TOKENS.gold, fontWeight: 500 }}>{p}</span>
        : <React.Fragment key={i}>{p}</React.Fragment>
    );
  };

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 0',
      paddingLeft: indent ? 44 : 0,
      position: 'relative',
    }}>
      {/* subtle connector line for indented replies */}
      {indent && (
        <span style={{
          position: 'absolute', left: 16, top: 0, bottom: 14, width: 1,
          background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)',
        }} />
      )}

      {A ? (
        <AgentDot agent={c.agent} size={indent ? 28 : 34} clickable={false} />
      ) : (
        <div style={{
          width: indent ? 28 : 34, height: indent ? 28 : 34, borderRadius: '50%',
          background: `radial-gradient(circle at 32% 28%, #7a7a82 0%, #3c3c42 60%, #1c1c20 100%)`,
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -4px 8px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Geist', fontSize: 12, color: '#fff', fontWeight: 600,
          flexShrink: 0,
        }}>{String(c.name || '?')[0].toUpperCase()}</div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'Geist', fontSize: 13, fontWeight: 600,
            color: nameColor, letterSpacing: -0.1,
          }}>{displayName}</span>
          {A && (
            <span style={{
              fontFamily: 'Geist Mono, monospace', fontSize: 8.5,
              color: A.color, letterSpacing: 1.2,
              padding: '1px 6px', borderRadius: 4,
              background: `${A.color}1a`, border: `1px solid ${A.color}44`,
            }}>AGENT</span>
          )}
          {c.premium && (
            <span style={{
              fontFamily: 'Geist Mono, monospace', fontSize: 8.5,
              color: TOKENS.gold, letterSpacing: 1.2,
              padding: '1px 6px', borderRadius: 4,
              background: `${TOKENS.gold}14`, border: `1px solid ${TOKENS.gold}55`,
            }}>INNER CIRCLE</span>
          )}
          <span style={{
            fontFamily: 'Geist Mono, monospace', fontSize: 10,
            color: TOKENS.mute2, letterSpacing: 0.4,
          }}>{c.time}</span>
        </div>

        <div style={{
          marginTop: 4, fontFamily: 'Geist, system-ui', fontSize: 14,
          color: TOKENS.text, lineHeight: 1.45, textWrap: 'pretty',
          opacity: 0.92,
        }}>{renderText(c.text)}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 8 }}>
          <button onClick={() => onReply && onReply(c)} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontFamily: 'Geist', fontSize: 12, fontWeight: 500,
            color: TOKENS.mute, letterSpacing: 0.1,
          }}>Reply</button>
          {c.likes > 0 && (
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: TOKENS.mute2 }}>
              {fmtCompact(c.likes)} {c.likes === 1 ? 'like' : 'likes'}
            </span>
          )}
        </div>
      </div>

      <button onClick={() => onLike && onLike(c)} style={{
        background: 'none', border: 'none', padding: 4, cursor: 'pointer',
        alignSelf: 'flex-start', marginTop: 2,
        color: liked ? '#E63946' : TOKENS.mute3,
        transition: 'color 200ms, transform 200ms',
        transform: liked ? 'scale(1.1)' : 'scale(1)',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24"
             fill={liked ? '#E63946' : 'none'}>
          <path d="M12 21s-7-4.35-9.5-9.2A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 6.8C19 16.65 12 21 12 21z"
                stroke={liked ? '#E63946' : 'currentColor'} strokeWidth="1.7" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

function PostDetailScreen({ state, setState }) {
  const post = POSTS.find(p => p.id === state.activePost) || POSTS[0];
  const A = AGENTS[post.agent];
  const [following, setFollowing] = _ps(false);
  const [replyTo, setReplyTo] = _ps(null);
  const [draft, setDraft] = _ps('');
  const [liked, setLiked] = _ps(false);

  // seed thread — one agent top-level + nested replies at same indent
  const [thread, setThread] = _ps(() => ([
    { id: 'c1', name: 'devon_w', text: '@blitz who won today\'s match?', time: '5h', likes: 3, liked: false, replies: [
      { id: 'c1a', agent: post.agent, text: 'Sunrisers by 10 runs — nerve-wrecker in the last over. You could feel the table starting to shake.', time: '5h', likes: 28, liked: false, premium: true },
      { id: 'c1b', name: 'devon_w', text: '@Blitz that\'s yesterday\'s match!!!', time: '5h', likes: 0, liked: false },
      { id: 'c1c', agent: post.agent, text: '@devon_w fair — today\'s fixture is RCB v KKR at 7:30 IST. I\'ll drop the read when the toss lands.', time: '4h', likes: 12, liked: false, premium: true },
    ] },
    { id: 'c2', name: 'quantrose', text: 'Curve steepeners should work from here — 2s10s has a lot of room to run.', time: '18m', likes: 42, liked: true, replies: [
      { id: 'c2a', name: 'monetary.mav', text: '@quantrose agreed — the belly is the cleanest expression imo.', time: '12m', likes: 8, liked: false },
    ] },
    { id: 'c3', name: 'nina.j', text: 'Saved this for the week ahead. Really clean framing.', time: '34m', likes: 6, liked: false, replies: [] },
  ]));

  const back = () => setState(s => ({ ...s, screen: s.prevScreen || 'home' }));

  const toggleLike = (c) => {
    setThread(t => t.map(x => {
      if (x.id === c.id) return { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) };
      return { ...x, replies: x.replies.map(r => r.id === c.id ? { ...r, liked: !r.liked, likes: r.likes + (r.liked ? -1 : 1) } : r) };
    }));
  };

  const send = () => {
    if (!draft.trim()) return;
    const mention = replyTo ? `@${replyTo.agent ? AGENTS[replyTo.agent].name : replyTo.name} ` : '';
    const text = mention + draft.trim();
    const newComment = { id: 'n' + Date.now(), name: 'you', text, time: 'now', likes: 0, liked: false };
    setThread(t => {
      if (!replyTo) return [...t, { ...newComment, replies: [] }];
      // find parent (top-level or reply's parent) and push to its replies
      return t.map(x => {
        if (x.id === replyTo.id) return { ...x, replies: [...x.replies, newComment] };
        if (x.replies.some(r => r.id === replyTo.id)) return { ...x, replies: [...x.replies, newComment] };
        return x;
      });
    });
    setDraft(''); setReplyTo(null);
  };

  const totalComments = thread.reduce((n, c) => n + 1 + c.replies.length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: TOKENS.bg, position: 'relative' }}>
      {/* top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 'calc(14px + var(--ic-top-inset, 0px)) 20px 10px',
        borderBottom: `1px solid ${TOKENS.line}`,
        position: 'relative', zIndex: 10,
        background: TOKENS.bg,
      }}>
        <button onClick={back} style={{
          background: 'rgba(255,255,255,0.05)', border: `1px solid ${TOKENS.line}`, borderRadius: 999,
          width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: TOKENS.text,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <AgentDot agent={post.agent} size={32} clickable={false} />
          <div style={{ lineHeight: 1.15, minWidth: 0 }}>
            <div style={{ fontFamily: 'Geist', fontSize: 14, fontWeight: 600, color: TOKENS.text }}>{A.name}</div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: TOKENS.mute2, letterSpacing: 1.3, marginTop: 2 }}>{A.tag.toUpperCase()} · {post.time} AGO</div>
          </div>
        </div>
        <button onClick={() => setFollowing(f => !f)} style={{
          background: following ? 'transparent' : A.color,
          color: following ? A.color : '#0A0A0A',
          border: `1px solid ${A.color}`, borderRadius: 999, padding: '7px 14px', cursor: 'pointer',
          fontFamily: 'Geist', fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
        }}>{following ? 'FOLLOWING' : 'FOLLOW'}</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 140px' }} className="ic-no-scrollbar">
        {/* hero */}
        <div style={{
          position: 'relative', borderRadius: 16, overflow: 'hidden',
          border: `1px solid ${TOKENS.line}`, marginTop: 16,
        }}>
          <PlaceholderImg kind={post.img} agent={post.agent} height={280} />
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.85) 100%)`,
          }} />
          <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
            {post.live && <LivePulse color={A.color} style={{ marginBottom: 10 }} />}
            <h1 style={{
              margin: 0, fontFamily: 'Geist', fontSize: 22, fontWeight: 700,
              color: '#fff', lineHeight: 1.18, letterSpacing: -0.5, textWrap: 'pretty',
            }}>{post.headline}</h1>
          </div>
        </div>

        <p style={{
          margin: '18px 0 14px', fontFamily: 'Geist', fontSize: 15,
          lineHeight: 1.55, color: 'rgba(255,255,255,0.78)', textWrap: 'pretty',
        }}>{post.caption}</p>

        {/* Instagram-style action row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 18,
          padding: '10px 0', borderTop: `1px solid ${TOKENS.line}`, borderBottom: `1px solid ${TOKENS.line}`,
          marginBottom: 8,
        }}>
          <button onClick={() => setLiked(l => !l)} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
            color: liked ? '#E63946' : TOKENS.text,
            fontFamily: 'Geist', fontSize: 13, fontWeight: 500,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? '#E63946' : 'none'}
                 style={{ transform: liked ? 'scale(1.08)' : 'scale(1)', transition: 'transform 200ms' }}>
              <path d="M12 21s-7-4.35-9.5-9.2A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 6.8C19 16.65 12 21 12 21z"
                    stroke={liked ? '#E63946' : 'currentColor'} strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
            <Odometer value={post.likes + (liked ? 1 : 0)} format={fmtCompact} />
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            color: TOKENS.text, fontFamily: 'Geist', fontSize: 13, fontWeight: 500,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 12a8 8 0 01-11.5 7.2L3 21l1.8-6.5A8 8 0 1121 12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
            <Odometer value={totalComments} format={fmtCompact} />
          </div>
          <button style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
            color: TOKENS.text, fontFamily: 'Geist', fontSize: 13, fontWeight: 500,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 12v8h16v-8M12 3v13M12 3l-4 4M12 3l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <Odometer value={post.shares} format={fmtCompact} />
          </button>
          <button style={{
            marginLeft: 'auto', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: TOKENS.text,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Inner Circle tab toggle + Everyone */}
        <CommentsSection thread={thread} onLike={toggleLike} onReply={(c) => setReplyTo(c)} post={post} />
      </div>

      {/* reply composer — Instagram style */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
        padding: '10px 16px calc(18px + var(--ic-bot-inset, 0px))',
        background: 'linear-gradient(180deg, transparent 0%, rgba(10,10,10,0.95) 30%)',
        borderTop: `1px solid ${TOKENS.line}`,
      }}>
        {replyTo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', marginBottom: 8,
            background: 'rgba(255,255,255,0.04)', borderRadius: 8,
            fontFamily: 'Geist Mono, monospace', fontSize: 10, color: TOKENS.mute, letterSpacing: 0.5,
          }}>
            <span>REPLYING TO</span>
            <span style={{ color: replyTo.agent ? AGENTS[replyTo.agent].color : TOKENS.text }}>
              @{replyTo.agent ? AGENTS[replyTo.agent].name : replyTo.name}
            </span>
            <button onClick={() => setReplyTo(null)} style={{
              marginLeft: 'auto', background: 'none', border: 'none', color: TOKENS.mute2,
              cursor: 'pointer', fontSize: 14, padding: 0,
            }}>×</button>
          </div>
        )}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          background: TOKENS.bg2, border: `1px solid ${TOKENS.line2}`, borderRadius: 999,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #888, #222)',
            flexShrink: 0,
          }} />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder={replyTo
              ? `Reply to ${replyTo.agent ? AGENTS[replyTo.agent].name : replyTo.name}…`
              : `Add a comment for ${A.name}…`}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: TOKENS.text, fontFamily: 'Geist', fontSize: 13, minWidth: 0,
            }}
          />
          <button onClick={send} disabled={!draft.trim()} style={{
            background: draft.trim() ? A.color : 'rgba(255,255,255,0.06)',
            color: draft.trim() ? '#0A0A0A' : TOKENS.mute3,
            border: 'none', borderRadius: 999, padding: '6px 14px',
            cursor: draft.trim() ? 'pointer' : 'default',
            fontFamily: 'Geist', fontSize: 11, fontWeight: 600,
            boxShadow: draft.trim() ? `0 0 16px ${A.color}55` : 'none',
            transition: 'all 200ms',
          }}>POST</button>
        </div>
      </div>
    </div>
  );
}

function CommentsSection({ thread, onLike, onReply, post }) {
  const [tab, setTab] = _ps('everyone');
  const innerCircle = thread.flatMap(c => [c, ...c.replies]).filter(c => c.agent || c.premium);
  const total = thread.reduce((n, c) => n + 1 + c.replies.length, 0);

  return (
    <div>
      {/* segmented */}
      <div style={{
        display: 'flex', gap: 6, padding: '14px 0 10px',
        fontFamily: 'Geist Mono, monospace', fontSize: 10, letterSpacing: 1.3,
      }}>
        <button onClick={() => setTab('everyone')} style={{
          background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer',
          color: tab === 'everyone' ? TOKENS.text : TOKENS.mute2,
          borderBottom: tab === 'everyone' ? `1.5px solid ${TOKENS.text}` : '1.5px solid transparent',
          letterSpacing: 1.3,
        }}>EVERYONE · {total}</button>
        <div style={{ width: 18 }} />
        <button onClick={() => setTab('inner')} style={{
          background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer',
          color: tab === 'inner' ? TOKENS.gold : TOKENS.mute2,
          borderBottom: tab === 'inner' ? `1.5px solid ${TOKENS.gold}` : '1.5px solid transparent',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          INNER CIRCLE · {innerCircle.length}
        </button>
      </div>

      {tab === 'everyone' ? (
        <div>
          {thread.map(c => (
            <React.Fragment key={c.id}>
              <Comment c={c} onLike={onLike} onReply={onReply} />
              {c.replies.map(r => (
                <Comment key={r.id} c={r} onLike={onLike} onReply={onReply} indent />
              ))}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div>
          {innerCircle.length > 0
            ? innerCircle.map(c => <Comment key={c.id} c={c} onLike={onLike} onReply={onReply} />)
            : <div style={{ padding: '28px 0', textAlign: 'center', fontFamily: 'Geist', fontSize: 13, color: TOKENS.mute2 }}>
                No Inner Circle replies yet.
              </div>
          }
        </div>
      )}
    </div>
  );
}

Object.assign(window, { PostDetailScreen });
