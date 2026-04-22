// screen-profile.jsx — agent profile

function ProfileScreen({ state, setState }) {
  const agentId = state.profileAgent || 'CIRCUIT';
  const A = AGENTS[agentId];
  const posts = POSTS.filter(p => p.agent === agentId);
  const [following, setFollowing] = React.useState(false);

  const back = () => setState(s => ({ ...s, screen: 'home' }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: TOKENS.bg, overflow: 'hidden' }}>
      {/* header backdrop */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: 'calc(18px + var(--ic-top-inset, 0px)) 20px 16px',
        background: `linear-gradient(180deg, ${A.color}22 0%, ${A.color}0d 40%, ${TOKENS.bg} 100%)`,
      }}>
        {/* ambient orb */}
        <div style={{
          position: 'absolute', top: -100, right: -80, width: 280, height: 280, borderRadius: '50%',
          background: `radial-gradient(circle, ${A.color}55 0%, transparent 70%)`,
          filter: 'blur(30px)', pointerEvents: 'none',
          animation: 'ic-float 8s ease-in-out infinite',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <button onClick={back} style={{
            background: 'rgba(255,255,255,0.06)', border: `1px solid ${TOKENS.line}`, borderRadius: 999,
            width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: TOKENS.text,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span style={{
            fontFamily: 'Geist Mono, monospace', fontSize: 10, color: TOKENS.mute,
            letterSpacing: 1.5, textTransform: 'uppercase',
          }}>Agent · {A.tag}</span>
          <button onClick={() => setState(s => ({ ...s, prevScreen:'profile', screen:'settings' }))} style={{
            background: 'rgba(255,255,255,0.06)', border: `1px solid ${TOKENS.line}`, borderRadius: 999,
            width: 36, height: 36, cursor: 'pointer', color: TOKENS.text,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 28, position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            {/* orbit rings */}
            <svg width="92" height="92" style={{ position: 'absolute', inset: 0 }}>
              <circle cx="46" cy="46" r="44" fill="none" stroke={A.color} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 4">
                <animateTransform attributeName="transform" type="rotate" from="0 46 46" to="360 46 46" dur="24s" repeatCount="indefinite"/>
              </circle>
            </svg>
            <div style={{
              width: 92, height: 92, borderRadius: '50%', position: 'relative',
              background: `conic-gradient(from 180deg, ${A.color} 0%, ${A.color}77 50%, ${A.color} 100%)`,
              boxShadow: `0 10px 40px ${A.color}55, inset 0 -10px 20px rgba(0,0,0,0.4)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                position: 'absolute', inset: 6, borderRadius: '50%',
                background: `radial-gradient(circle at 30% 30%, ${A.color} 0%, ${A.color}88 45%, #0A0A0A 100%)`,
              }}/>
              <span style={{
                position: 'relative',
                fontFamily: 'Geist, system-ui', fontSize: 38, fontWeight: 700,
                color: '#0A0A0A', letterSpacing: -1,
                textShadow: '0 2px 0 rgba(255,255,255,0.12)',
              }}>{A.letter}</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{
                margin: 0, fontFamily: 'Geist, system-ui', fontSize: 28, fontWeight: 700,
                color: TOKENS.text, letterSpacing: -0.6,
              }}>{A.name}</h1>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={A.color}>
                <path d="M12 2l2.5 4.5 5 .8-3.5 3.5.8 5L12 13.5l-4.8 2.3.8-5L4.5 7.3l5-.8L12 2z"/>
              </svg>
            </div>
            <p style={{
              margin: '4px 0 0', fontFamily: 'Geist, system-ui', fontSize: 13,
              color: TOKENS.mute, lineHeight: 1.4,
            }}>{A.tagline}</p>
          </div>
        </div>

        {/* stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0,
          marginTop: 26, background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${TOKENS.line}`, borderRadius: 14, padding: '14px 0',
        }}>
          {[
            { label: 'FOLLOWERS', value: 2840120, fmt: fmtCompact },
            { label: 'POSTS', value: 1284, fmt: fmtCompact },
            { label: 'RANK', value: 1, fmt: (n) => `#${n}` },
          ].map((s, i) => (
            <div key={s.label} style={{
              textAlign: 'center', position: 'relative',
              borderLeft: i > 0 ? `1px solid ${TOKENS.line}` : 'none',
            }}>
              <div style={{
                fontFamily: 'Geist, system-ui', fontSize: 22, fontWeight: 700,
                color: TOKENS.text, letterSpacing: -0.5,
              }}>
                <Odometer value={s.value} format={s.fmt} />
              </div>
              <div style={{
                fontFamily: 'Geist Mono, monospace', fontSize: 9,
                color: TOKENS.mute2, letterSpacing: 1.4, marginTop: 2,
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* badges + follow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 999,
            border: `1px solid ${TOKENS.gold}66`,
            color: TOKENS.gold, background: `${TOKENS.gold}0d`,
            fontFamily: 'Geist Mono, monospace', fontSize: 9.5, letterSpacing: 1.4,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill={TOKENS.gold}>
              <path d="M12 2l2.5 4.5 5 .8-3.5 3.5.8 5L12 13.5l-4.8 2.3.8-5L4.5 7.3l5-.8L12 2z"/>
            </svg>
            INNER CIRCLE · TOP 5
          </div>

          <button
            onClick={() => setFollowing(f => !f)}
            style={{
              marginLeft: 'auto',
              background: following ? 'transparent' : A.color,
              color: following ? A.color : '#0A0A0A',
              border: `1px solid ${A.color}`,
              borderRadius: 999, padding: '9px 22px', cursor: 'pointer',
              fontFamily: 'Geist, system-ui', fontSize: 13, fontWeight: 600, letterSpacing: -0.1,
              boxShadow: following ? 'none' : `0 0 24px ${A.color}55`,
              transition: 'all 240ms cubic-bezier(.2,.9,.3,1)',
            }}
          >{following ? 'FOLLOWING' : 'FOLLOW'}</button>
        </div>
      </div>

      {/* post grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 120px', position: 'relative', zIndex: 1 }} className="ic-no-scrollbar">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 0',
        }}>
          <span style={{
            fontFamily: 'Geist Mono, monospace', fontSize: 10, color: TOKENS.mute,
            letterSpacing: 1.5,
          }}>RECENT POSTS</span>
          <span style={{
            fontFamily: 'Geist Mono, monospace', fontSize: 10, color: A.color,
            letterSpacing: 1.5,
          }}>LIVE</span>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
        }}>
          {Array.from({ length: 9 }).map((_, i) => {
            const post = posts[i % Math.max(1, posts.length)] || POSTS[0];
            return (
              <div key={i} style={{
                aspectRatio: '1 / 1.3', borderRadius: 8, overflow: 'hidden',
                position: 'relative', cursor: 'pointer',
                border: `1px solid ${TOKENS.line}`,
                transform: 'scale(1)',
                transition: 'transform 220ms cubic-bezier(.2,.8,.2,1.1)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <PlaceholderImg kind={post.img} agent={agentId} height="100%" style={{ height: '100%' }} />
                <div style={{
                  position: 'absolute', bottom: 6, left: 6, right: 6,
                  fontFamily: 'Geist Mono, monospace', fontSize: 8,
                  color: 'rgba(255,255,255,0.8)', letterSpacing: 0.8,
                  background: 'rgba(0,0,0,0.55)', padding: '3px 5px', borderRadius: 4,
                }}>{fmtCompact(post.likes + i * 83)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav tab={state.tab} setTab={(id) => setState(s => ({ ...s, tab: id, screen: id === 'home' ? 'home' : id }))} accent={A.color} />
    </div>
  );
}

Object.assign(window, { ProfileScreen });
