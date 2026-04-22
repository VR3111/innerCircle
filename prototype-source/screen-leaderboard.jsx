// screen-leaderboard.jsx

function LeaderRow({ entry, first = false, sparkPoints }) {
  const A = AGENTS[entry.agent];
  const up = entry.change > 0;
  return (
    <div style={{
      position: 'relative',
      display: 'flex', alignItems: 'center', gap: 14,
      padding: first ? '20px 18px' : '14px 18px',
      background: first ? `linear-gradient(90deg, ${A.color}18 0%, ${A.color}00 80%)` : 'transparent',
      border: first ? `1px solid ${A.color}44` : `1px solid ${TOKENS.line}`,
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {first && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 14, pointerEvents: 'none',
          boxShadow: `inset 0 0 60px ${A.color}22`,
          animation: 'ic-rank-glow 3s ease-in-out infinite',
        }} />
      )}
      {/* rank */}
      <div style={{
        width: 32, textAlign: 'left',
        fontFamily: 'Geist, system-ui', fontSize: first ? 32 : 24, fontWeight: 700,
        color: first ? A.color : TOKENS.mute3,
        letterSpacing: -1,
        textShadow: first ? `0 0 20px ${A.color}66` : 'none',
      }}>{String(entry.rank).padStart(2, '0')}</div>

      <AgentDot agent={entry.agent} size={first ? 44 : 36} active={first} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Geist, system-ui', fontSize: first ? 17 : 15, fontWeight: 600,
          color: TOKENS.text, letterSpacing: -0.2,
        }}>{A.name}</div>
        <div style={{
          fontFamily: 'Geist Mono, monospace', fontSize: 9.5,
          color: TOKENS.mute2, letterSpacing: 1.2, marginTop: 2,
        }}>{A.tag.toUpperCase()}</div>
      </div>

      <Sparkline
        points={sparkPoints}
        color={up ? A.color : TOKENS.mute}
        width={48} height={22}
      />

      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: 'Geist, system-ui', fontSize: 15, fontWeight: 600,
          color: TOKENS.text, letterSpacing: -0.2, fontVariantNumeric: 'tabular-nums',
        }}>
          <Odometer value={entry.followers} format={fmtCompact} />
        </div>
        <div style={{
          fontFamily: 'Geist Mono, monospace', fontSize: 10,
          color: up ? '#2A9D8F' : '#E63946',
          letterSpacing: 0.5, marginTop: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3,
        }}>
          <span>{up ? '▲' : '▼'}</span>
          <span>{Math.abs(entry.change).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

function LeaderboardScreen({ state, setState }) {
  const [filter, setFilter] = React.useState('ALL');
  const accent = filter === 'ALL' ? TOKENS.gold : AGENTS[filter].color;

  const makeSpark = (seed, up) => Array.from({ length: 14 }).map((_, i) => {
    const v = Math.sin(i * 0.7 + seed) * 5 + i * (up ? 0.8 : -0.2) + 10;
    return v;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: TOKENS.bg }}>
      {/* header */}
      <div style={{ padding: 'calc(20px + var(--ic-top-inset, 0px)) 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              fontFamily: 'Geist Mono, monospace', fontSize: 10, color: TOKENS.mute,
              letterSpacing: 1.8, marginBottom: 6,
            }}>LEADERBOARD · WK 16</div>
            <h1 style={{
              margin: 0, fontFamily: 'Geist, system-ui', fontSize: 44, fontWeight: 700,
              color: TOKENS.text, letterSpacing: -1.5, lineHeight: 1,
            }}>TOP 06</h1>
          </div>
          <LivePulse color={accent} label="LIVE" />
        </div>
      </div>

      {/* filter */}
      <AgentStrip selected={filter} onSelect={setFilter} />

      {/* rows */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '0 20px 24px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }} className="ic-no-scrollbar">
        {LEADERBOARD.map((e, i) => (
          <LeaderRow key={e.agent} entry={e} first={i === 0}
                     sparkPoints={makeSpark(i * 3, e.change > 0)} />
        ))}

        <div style={{ height: 80 }} />
      </div>

      {/* your rank pinned */}
      <div style={{
        margin: '0 20px 18px', padding: '12px 16px',
        background: 'rgba(233,196,106,0.06)', border: `1px solid ${TOKENS.gold}44`,
        borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          fontFamily: 'Geist Mono, monospace', fontSize: 10, color: TOKENS.gold,
          letterSpacing: 1.5,
        }}>YOUR RANK</div>
        <div style={{ flex: 1, textAlign: 'right', fontFamily: 'Geist, system-ui', color: TOKENS.text, fontSize: 14 }}>
          <span style={{ color: TOKENS.gold, fontWeight: 700 }}>#12</span>
          <span style={{ color: TOKENS.mute2, marginLeft: 8, fontFamily: 'Geist Mono, monospace', fontSize: 10 }}>
            ▲ 3 from yesterday
          </span>
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

Object.assign(window, { LeaderboardScreen });
