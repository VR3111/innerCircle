// screen-dm.jsx — DM list + chat

function DMListScreen({ state, setState }) {
  const back = () => setState(s => ({ ...s, screen: s.prevScreen || 'home' }));
  const open = (agent, locked) => {
    if (locked && !state.premium) {
      setState(s => ({ ...s, prevScreen:'dm-list', screen:'paywall' }));
    } else {
      setState(s => ({ ...s, screen:'dm-thread', dmAgent:agent }));
    }
  };
  return (
    <div style={{ position:'absolute', inset:0, background:TOKENS.bg, display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'calc(18px + var(--ic-top-inset,0px)) 20px 8px' }}>
        <button onClick={back} style={iconBtnStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontFamily:'Geist', fontSize:17, fontWeight:600 }}>Messages</span>
        <div style={{ width:36 }}/>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 18px 40px' }} className="ic-no-scrollbar">
        {DM_THREADS.map((t, i) => {
          const A = AGENTS[t.agent];
          const locked = t.locked && !state.premium;
          return (
            <button key={t.id} onClick={() => open(t.agent, t.locked)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:12,
              padding:'12px 14px', marginBottom:8, borderRadius:14,
              background: locked ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.02)',
              border:`1px solid ${locked ? 'rgba(212,175,55,0.2)' : TOKENS.line}`,
              cursor:'pointer', textAlign:'left',
              animation:`sl-fade-in 400ms ease ${i*50}ms both`,
            }}>
              <AgentDot agent={t.agent} size={44} clickable={false}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontFamily:'Geist', fontSize:14, fontWeight:600 }}>{A.name}</span>
                  {locked && <SLMark size={11} color={TOKENS.gold} />}
                </div>
                <div style={{ fontFamily:'Geist', fontSize:12.5, color:TOKENS.mute,
                              marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {locked ? 'Inner Circle only — tap to unlock' : t.last}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                <span style={{ fontFamily:'Geist Mono, monospace', fontSize:10, color:TOKENS.mute2 }}>{t.time}</span>
                {t.unread > 0 && !locked && (
                  <span style={{
                    minWidth:18, height:18, borderRadius:999, padding:'0 6px',
                    background:TOKENS.gold, color:'#0A0A0A',
                    fontFamily:'Geist', fontSize:10, fontWeight:700,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>{t.unread}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DMThreadScreen({ state, setState }) {
  const agent = state.dmAgent || 'BARON';
  const A = AGENTS[agent];
  const initial = DM_MESSAGES[agent] || DM_MESSAGES.BARON;
  const [msgs, setMsgs] = React.useState(initial);
  const [text, setText] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs.length, typing]);

  const send = () => {
    if (!text.trim()) return;
    const out = text.trim();
    setMsgs(m => [...m, { from:'me', text:out, time:'now' }]);
    setText('');
    setTimeout(() => setTyping(true), 500);
    setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m, { from:'agent', text: `Heard. Let me think on it for a sec.`, time:'now' }]);
    }, 2200);
  };

  const back = () => setState(s => ({ ...s, screen:'dm-list' }));

  return (
    <div style={{ position:'absolute', inset:0, background:TOKENS.bg, display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10,
                    padding:'calc(16px + var(--ic-top-inset,0px)) 18px 10px',
                    borderBottom:`1px solid ${TOKENS.line}` }}>
        <button onClick={back} style={iconBtnStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <AgentDot agent={agent} size={32} clickable={false}/>
        <div style={{ flex:1, lineHeight:1.1 }}>
          <div style={{ fontFamily:'Geist', fontSize:14, fontWeight:600 }}>{A.name}</div>
          <div style={{ fontFamily:'Geist Mono, monospace', fontSize:9.5,
                        color:A.color, letterSpacing:1.2, marginTop:3,
                        display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:A.color,
                           animation:'ic-pulse 1.6s ease-out infinite' }}/>
            ONLINE · {A.tag.toUpperCase()}
          </div>
        </div>
      </div>

      <div ref={scrollRef} style={{ flex:1, overflowY:'auto', padding:'16px 16px 20px',
                                    display:'flex', flexDirection:'column', gap:8 }} className="ic-no-scrollbar">
        {msgs.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start',
            maxWidth:'78%',
            animation:`sl-fade-in 300ms ease both`,
          }}>
            <div style={{
              padding:'10px 14px', borderRadius: m.from === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.from === 'me'
                ? 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)'
                : 'rgba(255,255,255,0.05)',
              color: m.from === 'me' ? '#0A0A0A' : TOKENS.text,
              border: m.from === 'me' ? 'none' : `1px solid ${TOKENS.line}`,
              fontFamily:'Geist', fontSize:14, lineHeight:1.45,
              boxShadow: m.from === 'me' ? '0 6px 18px rgba(212,175,55,0.2)' : 'none',
            }}>{m.text}</div>
            <div style={{
              fontFamily:'Geist Mono, monospace', fontSize:9, color:TOKENS.mute3,
              marginTop:3, textAlign: m.from === 'me' ? 'right' : 'left',
              padding: m.from === 'me' ? '0 4px 0 0' : '0 0 0 4px',
            }}>{m.time}</div>
          </div>
        ))}
        {typing && (
          <div style={{ alignSelf:'flex-start', padding:'12px 14px',
                        borderRadius:'16px 16px 16px 4px',
                        background:'rgba(255,255,255,0.05)', border:`1px solid ${TOKENS.line}`,
                        display:'flex', gap:4 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                width:6, height:6, borderRadius:'50%', background:TOKENS.mute,
                animation:`sl-typing 1.2s ease-in-out ${i*180}ms infinite`,
              }}/>
            ))}
          </div>
        )}
      </div>

      {/* composer */}
      <div style={{ padding:'10px 14px calc(16px + var(--ic-bot-inset,0px))',
                    background:'rgba(10,10,10,0.95)', borderTop:`1px solid ${TOKENS.line}` }}>
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          background:TOKENS.bg2, border:`1px solid ${TOKENS.line2}`,
          borderRadius:999, padding:'8px 8px 8px 14px',
        }}>
          <input
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={`Message ${A.name}…`}
            style={{ flex:1, background:'none', border:'none', outline:'none',
                     color:TOKENS.text, fontFamily:'Geist', fontSize:14 }}/>
          <button onClick={send} disabled={!text.trim()} style={{
            width:34, height:34, borderRadius:'50%', border:'none', cursor:'pointer',
            background: text.trim() ? 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)' : 'rgba(255,255,255,0.08)',
            color:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center',
            transition:'background 200ms', boxShadow: text.trim() ? '0 4px 12px rgba(212,175,55,0.35)' : 'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DMListScreen, DMThreadScreen });
