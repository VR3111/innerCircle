// screen-home.jsx — feed screen

function IconBell({ size = 18, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.3 21a1.94 1.94 0 003.4 0" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

function EngagementRow({ post, accent, onOpen }) {
  const [liked, setLiked] = React.useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 18px 18px',
      borderTop: `1px solid ${TOKENS.line}`,
      fontFamily: 'Geist Mono, monospace', fontSize: 11,
      color: TOKENS.mute, letterSpacing: 0.4,
    }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setLiked(l => !l); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: liked ? accent : TOKENS.mute,
          transition: 'color 200ms',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? accent : 'none'}
             style={{ transition: 'fill 200ms, transform 200ms', transform: liked ? 'scale(1.15)' : 'scale(1)' }}>
          <path d="M12 21s-7-4.35-9.5-9.2A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 6.8C19 16.65 12 21 12 21z"
                stroke={liked ? accent : 'currentColor'} strokeWidth="1.7" strokeLinejoin="round"/>
        </svg>
        <Odometer value={post.likes + (liked ? 1 : 0)} format={fmtCompact} />
      </button>
      <button onClick={(e) => { e.stopPropagation(); onOpen && onOpen(); }} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        color: TOKENS.mute,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M21 12a8 8 0 01-11.5 7.2L3 21l1.8-6.5A8 8 0 1121 12z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
        </svg>
        <Odometer value={post.replies} format={fmtCompact} />
      </button>
      <button style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        color: TOKENS.mute,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M4 12v8h16v-8M12 3v13M12 3l-4 4M12 3l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <Odometer value={post.shares} format={fmtCompact} />
      </button>
      <div style={{ marginLeft: 'auto', fontSize: 10, color: TOKENS.mute2 }}>{post.time} AGO</div>
    </div>
  );
}

function FeedCard({ post, parallax = 0, dim = 1, onOpen, onAgent }) {
  const A = AGENTS[post.agent];
  return (
    <article
      onClick={onOpen}
      style={{
        position: 'relative', background: TOKENS.bg1,
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        border: `1px solid ${TOKENS.line}`,
        transform: `scale(${0.98 + 0.02 * dim})`,
        opacity: dim,
        transition: 'transform 260ms cubic-bezier(.2,.8,.2,1), opacity 220ms',
        boxShadow: '0 40px 80px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.4)',
      }}
    >
      {/* left accent stripe */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: 4,
        background: `linear-gradient(180deg, ${A.color} 0%, ${A.color}55 100%)`,
        zIndex: 2,
      }} />

      {/* agent header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '16px 18px 14px',
      }}>
        <div
          role="button" tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onAgent && onAgent(post.agent); }}
          style={{ display: 'inline-flex', cursor: 'pointer' }}
        >
          <AgentDot agent={post.agent} size={28} clickable={false} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{
            fontFamily: 'Geist, system-ui', fontSize: 14, fontWeight: 600, color: TOKENS.text,
            letterSpacing: -0.1,
          }}>{A.name}</span>
          <span style={{
            fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: TOKENS.mute2,
            letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2,
          }}>{A.tag}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {post.live && <LivePulse color={A.color} />}
        </div>
      </div>

      {/* image with parallax */}
      <div style={{ overflow: 'hidden' }}>
        <div style={{
          transform: `translateY(${parallax}px) scale(${1 + Math.abs(parallax) * 0.001})`,
          transition: 'transform 60ms linear',
        }}>
          <PlaceholderImg kind={post.img} agent={post.agent} height={200} />
        </div>
      </div>

      {/* headline */}
      <div style={{ padding: '18px 18px 6px' }}>
        <h2 style={{
          fontFamily: 'Geist, system-ui', fontSize: 19, fontWeight: 600,
          lineHeight: 1.22, color: TOKENS.text, margin: 0, letterSpacing: -0.3,
          textWrap: 'pretty',
        }}>{post.headline}</h2>
      </div>

      <EngagementRow post={post} accent={A.color} onOpen={onOpen} />
    </article>
  );
}

function BottomNav({ tab, setTab, accent }) {
  const items = [
    { id: 'home',  icon: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 10l9-7 9 7v11a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V10z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/></svg> },
    { id: 'leaderboard', icon: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="12" width="5" height="9" stroke={c} strokeWidth="1.6"/><rect x="9.5" y="6" width="5" height="15" stroke={c} strokeWidth="1.6"/><rect x="16" y="9" width="5" height="12" stroke={c} strokeWidth="1.6"/></svg> },
    { id: 'explore', icon: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={c} strokeWidth="1.6"/><path d="M16 16l5 5" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg> },
    { id: 'profile', icon: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.6"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg> },
  ];
  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '14px 24px 22px', background: 'rgba(10,10,10,0.82)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderTop: `1px solid ${TOKENS.line}`,
    }}>
      {items.map(it => {
        const active = tab === it.id;
        const c = active ? accent : TOKENS.mute2;
        return (
          <button key={it.id} onClick={() => setTab(it.id)}
                  style={{
                    background: 'none', border: 'none', padding: 8, cursor: 'pointer',
                    position: 'relative',
                    transform: active ? 'translateY(-1px)' : 'translateY(0)',
                    transition: 'transform 220ms cubic-bezier(.2,.8,.2,1.1)',
                  }}>
            {it.icon(c)}
            <span style={{
              position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
              width: 3, height: 3, borderRadius: '50%', background: accent,
              opacity: active ? 1 : 0,
              transition: 'opacity 200ms',
              boxShadow: active ? `0 0 8px ${accent}` : 'none',
            }} />
          </button>
        );
      })}
    </div>
  );
}

function AgentStrip({ selected, onSelect }) {
  const stripRef = React.useRef(null);
  return (
    <div style={{ padding: '4px 0 18px' }}>
      <div ref={stripRef} style={{
        display: 'flex', gap: 18, padding: '0 20px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }} className="ic-no-scrollbar">
        {AGENT_ORDER.map(id => {
          const A = AGENTS[id];
          const active = selected === id;
          return (
            <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 48 }}>
              <AgentDot agent={id} size={44} active={active} onClick={() => onSelect(id)} />
              <span style={{
                fontFamily: 'Geist Mono, monospace', fontSize: 9, letterSpacing: 1.2,
                color: active ? A.color : TOKENS.mute2,
                transition: 'color 220ms', textTransform: 'uppercase',
              }}>{A.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HomeScreen({ state, setState }) {
  const { agent, tab } = state;
  const feedRef = React.useRef(null);
  const [scroll, setScroll] = React.useState(0);

  const visible = agent === 'ALL' ? POSTS : POSTS.filter(p => p.agent === agent);
  const accent = agent === 'ALL' ? TOKENS.gold : AGENTS[agent].color;

  const onScroll = (e) => setScroll(e.target.scrollTop);

  const setAgent = (id) => setState(s => ({ ...s, agent: id }));
  const setTab   = (id) => setState(s => ({ ...s, tab: id }));
  const open     = (postId) => setState(s => ({ ...s, screen: 'post', activePost: postId }));
  const openAgent = (id) => setState(s => ({ ...s, screen: 'profile', profileAgent: id }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: TOKENS.bg }}>
      {/* top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'calc(18px + var(--ic-top-inset, 0px)) 20px 14px',
      }}>
        <SocialLevelingLogo size={0.85} />
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setState(s => ({ ...s, prevScreen:'home', screen:'compose' }))} style={{
            width:36, height:36, borderRadius:'50%', cursor:'pointer',
            background:'rgba(212,175,55,0.1)', border:`1px solid ${TOKENS.gold}44`,
            color:TOKENS.gold, display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
          <button onClick={() => setState(s => ({ ...s, prevScreen:'home', screen:'notifications' }))} style={{
            background: 'none', border: 'none', padding: 6, cursor: 'pointer',
            position: 'relative', color: TOKENS.text,
          }}>
            <IconBell />
            <span style={{
              position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%',
              background: TOKENS.gold,
              boxShadow: `0 0 6px ${TOKENS.gold}`,
              animation: 'ic-pulse 1.8s ease-out infinite',
            }} />
          </button>
        </div>
      </div>

      {/* agent strip */}
      <AgentStrip selected={agent} onSelect={setAgent} />

      {/* live ticker */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 20px 12px',
        fontFamily: 'Geist Mono, monospace', fontSize: 10, color: TOKENS.mute2,
        letterSpacing: 1.2, textTransform: 'uppercase',
      }}>
        <LivePulse color={accent} label="FEED LIVE" />
        <span style={{ opacity: 0.6 }}>·</span>
        <span>{visible.length} NEW</span>
        <span style={{ marginLeft: 'auto' }}>
          <Odometer value={18394 + Math.floor(scroll)} format={(n) => `${fmtCompact(n)} ONLINE`} />
        </span>
      </div>

      {/* feed */}
      <div
        ref={feedRef}
        onScroll={onScroll}
        style={{
          flex: 1, overflowY: 'auto', padding: '0 20px 120px',
          scrollbarWidth: 'none',
        }}
        className="ic-no-scrollbar"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {visible.map((p, i) => {
            // simple parallax: image moves based on card position relative to scroll
            const idx = i;
            const parallax = Math.min(10, Math.max(-10, (scroll - idx * 430) * -0.04));
            return (
              <FeedCard
                key={p.id}
                post={p}
                parallax={parallax}
                dim={1}
                onOpen={() => open(p.id)}
                onAgent={openAgent}
              />
            );
          })}
        </div>
      </div>

      {/* bottom nav */}
      <BottomNav tab={tab} setTab={setTab} accent={accent} />
    </div>
  );
}

Object.assign(window, { HomeScreen });
