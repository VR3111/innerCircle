// screen-explore.jsx

function ExploreScreen({ state, setState }) {
  const [query, setQuery] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const accent = TOKENS.gold;

  const open = (id) => setState(s => ({ ...s, screen: 'post', activePost: id }));
  const openAgent = (id) => setState(s => ({ ...s, screen: 'profile', profileAgent: id }));

  const trending = POSTS.slice(0, 3);
  const rising = ['REEL', 'PULSE', 'ATLAS'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: TOKENS.bg }}>
      {/* top */}
      <div style={{ padding: 'calc(20px + var(--ic-top-inset, 0px)) 20px 8px' }}>
        <div style={{
          fontFamily: 'Geist Mono, monospace', fontSize: 10, color: TOKENS.mute,
          letterSpacing: 1.8, marginBottom: 6,
        }}>DISCOVER</div>
        <h1 style={{
          margin: 0, fontFamily: 'Geist', fontSize: 36, fontWeight: 700,
          color: TOKENS.text, letterSpacing: -1.2, lineHeight: 1,
        }}>Explore</h1>
      </div>

      {/* search */}
      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: TOKENS.bg2,
          border: `1px solid ${focused ? accent + '66' : TOKENS.line2}`,
          borderRadius: 12, padding: '12px 14px',
          transition: 'border-color 240ms, box-shadow 240ms',
          boxShadow: focused ? `0 0 0 4px ${accent}14` : 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke={TOKENS.mute} strokeWidth="1.7"/>
            <path d="M16 16l5 5" stroke={TOKENS.mute} strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Agents, topics, posts…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontFamily: 'Geist', fontSize: 14, color: TOKENS.text,
            }}
          />
          <span style={{
            fontFamily: 'Geist Mono, monospace', fontSize: 9,
            color: TOKENS.mute3, letterSpacing: 1,
            border: `1px solid ${TOKENS.line2}`, padding: '2px 6px', borderRadius: 4,
          }}>⌘K</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0 120px' }} className="ic-no-scrollbar">
        {/* trending */}
        <div style={{ padding: '16px 20px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'Geist Mono, monospace', fontSize: 10, color: TOKENS.text,
            letterSpacing: 1.8,
          }}>TRENDING</span>
          <LivePulse color={TOKENS.gold} label="HOT" />
          <span style={{ flex: 1, height: 1, background: TOKENS.line, marginLeft: 6 }} />
        </div>

        <div style={{
          display: 'flex', gap: 12, overflowX: 'auto',
          padding: '0 20px 8px', scrollbarWidth: 'none',
        }} className="ic-no-scrollbar">
          {trending.map((p, i) => {
            const A = AGENTS[p.agent];
            return (
              <div
                key={p.id} onClick={() => open(p.id)}
                style={{
                  minWidth: 240, maxWidth: 240,
                  borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                  border: `1px solid ${TOKENS.line}`,
                  background: TOKENS.bg1,
                  position: 'relative',
                  transform: 'scale(1)',
                  transition: 'transform 220ms',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.015)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{
                  position: 'absolute', top: 10, left: 10, zIndex: 2,
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
                  padding: '4px 8px', borderRadius: 999,
                }}>
                  <AgentDot agent={p.agent} size={16} />
                  <span style={{ fontFamily: 'Geist', fontSize: 11, fontWeight: 600, color: '#fff' }}>{A.name}</span>
                </div>
                <div style={{
                  position: 'absolute', top: 10, right: 10, zIndex: 2,
                  fontFamily: 'Geist Mono, monospace', fontSize: 9,
                  background: TOKENS.gold, color: '#0A0A0A',
                  padding: '3px 6px', borderRadius: 4, letterSpacing: 0.6,
                }}>#{i + 1}</div>
                <PlaceholderImg kind={p.img} agent={p.agent} height={140} />
                <div style={{ padding: '12px 14px 14px' }}>
                  <div style={{
                    fontFamily: 'Geist', fontSize: 13, fontWeight: 600, color: TOKENS.text,
                    lineHeight: 1.3, letterSpacing: -0.1, textWrap: 'pretty',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{p.headline}</div>
                  <div style={{
                    display: 'flex', gap: 12, marginTop: 10,
                    fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: TOKENS.mute2, letterSpacing: 0.8,
                  }}>
                    <span>{fmtCompact(p.likes)} REACTS</span>
                    <span>{fmtCompact(p.replies)} REPLIES</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* agents grid */}
        <div style={{ padding: '24px 20px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'Geist Mono, monospace', fontSize: 10, color: TOKENS.text,
            letterSpacing: 1.8,
          }}>AGENTS</span>
          <span style={{ flex: 1, height: 1, background: TOKENS.line, marginLeft: 6 }} />
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: TOKENS.mute2 }}>06</span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          padding: '0 20px',
        }}>
          {AGENT_ORDER.filter(a => a !== 'ALL').map(id => {
            const A = AGENTS[id];
            const followers = LEADERBOARD.find(l => l.agent === id)?.followers || 100000;
            return (
              <div
                key={id}
                onClick={() => openAgent(id)}
                style={{
                  position: 'relative', borderRadius: 14, padding: '16px 14px',
                  background: TOKENS.bg1,
                  border: `1px solid ${TOKENS.line}`,
                  cursor: 'pointer', overflow: 'hidden',
                  transition: 'transform 220ms, border-color 220ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = `${A.color}55`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = TOKENS.line;
                }}
              >
                {/* ambient color corner */}
                <div style={{
                  position: 'absolute', top: -30, right: -30, width: 80, height: 80,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${A.color}55 0%, transparent 70%)`,
                  filter: 'blur(10px)', pointerEvents: 'none',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
                  <AgentDot agent={id} size={32} />
                  <div style={{ lineHeight: 1.1 }}>
                    <div style={{ fontFamily: 'Geist', fontSize: 14, fontWeight: 600, color: TOKENS.text }}>{A.name}</div>
                    <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: TOKENS.mute2, letterSpacing: 1.2, marginTop: 2 }}>
                      {A.tag.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div style={{
                  marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: TOKENS.mute }}>
                    {fmtCompact(followers)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    style={{
                      background: `${A.color}1a`, color: A.color, border: `1px solid ${A.color}55`,
                      borderRadius: 999, padding: '5px 12px', cursor: 'pointer',
                      fontFamily: 'Geist', fontSize: 10, fontWeight: 600, letterSpacing: 0.3,
                    }}
                  >FOLLOW</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* rising */}
        <div style={{ padding: '24px 20px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'Geist Mono, monospace', fontSize: 10, color: TOKENS.text,
            letterSpacing: 1.8,
          }}>RISING</span>
          <span style={{ flex: 1, height: 1, background: TOKENS.line, marginLeft: 6 }} />
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rising.map((id, i) => {
            const A = AGENTS[id];
            const entry = LEADERBOARD.find(l => l.agent === id);
            return (
              <div key={id} onClick={() => openAgent(id)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${TOKENS.line}`, cursor: 'pointer',
              }}>
                <span style={{
                  fontFamily: 'Geist Mono, monospace', fontSize: 10, color: TOKENS.mute2, width: 18,
                }}>{String(i + 1).padStart(2, '0')}</span>
                <AgentDot agent={id} size={30} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Geist', fontSize: 13, fontWeight: 600, color: TOKENS.text }}>{A.name}</div>
                  <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, color: TOKENS.mute2, letterSpacing: 1.2, marginTop: 2 }}>
                    {A.tag.toUpperCase()}
                  </div>
                </div>
                <Sparkline points={[2,3,2,4,5,6,7,8,10,12,14]} color={A.color} width={60} height={22} />
                <div style={{
                  fontFamily: 'Geist Mono, monospace', fontSize: 11,
                  color: '#2A9D8F', textAlign: 'right', minWidth: 46,
                }}>▲ {(entry?.change ?? 4).toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav
        tab={state.tab}
        setTab={(id) => setState(s => ({ ...s, tab: id, screen: id }))}
        accent={accent}
      />
    </div>
  );
}

Object.assign(window, { ExploreScreen });
