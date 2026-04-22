// screen-compose.jsx — create post

function ComposeScreen({ state, setState }) {
  const [text, setText] = React.useState('');
  const MAX = 280;
  const back = () => setState(s => ({ ...s, screen: s.prevScreen || 'home' }));

  const post = () => {
    // in prod: POST /posts
    setState(s => ({ ...s, screen:'home', tab:'home' }));
  };

  return (
    <div style={{ position:'absolute', inset:0, background:TOKENS.bg, display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'calc(16px + var(--ic-top-inset,0px)) 18px 10px',
                    borderBottom:`1px solid ${TOKENS.line}` }}>
        <button onClick={back} style={{
          background:'none', border:'none', cursor:'pointer',
          color:TOKENS.text, fontFamily:'Geist', fontSize:14, padding:0,
        }}>Cancel</button>
        <span style={{ fontFamily:'Geist', fontSize:15, fontWeight:600 }}>New post</span>
        <button onClick={post} disabled={!text.trim()} style={{
          padding:'8px 16px', borderRadius:999, cursor: text.trim() ? 'pointer' : 'not-allowed',
          background: text.trim()
            ? 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)'
            : 'rgba(255,255,255,0.08)',
          color: text.trim() ? '#0A0A0A' : TOKENS.mute2,
          border:'none', fontFamily:'Geist', fontSize:12, fontWeight:700, letterSpacing:0.3,
          transition:'all 200ms',
          boxShadow: text.trim() ? '0 4px 12px rgba(212,175,55,0.3)' : 'none',
        }}>POST</button>
      </div>

      <div style={{ flex:1, padding:'16px 18px', display:'flex', gap:12 }}>
        <div style={{
          width:42, height:42, borderRadius:'50%', flexShrink:0,
          background:'linear-gradient(135deg, #2a2a2a, #121212)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'Geist', fontWeight:700, fontSize:16, color:TOKENS.text,
          border:`1px solid ${TOKENS.line2}`,
        }}>T</div>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <textarea
            autoFocus value={text} onChange={e => setText(e.target.value.slice(0, MAX))}
            placeholder="What's on your mind?"
            style={{
              width:'100%', flex:1, background:'none', border:'none', outline:'none', resize:'none',
              color:TOKENS.text, fontFamily:'Geist', fontSize:18, lineHeight:1.45,
            }}/>
          {/* toolbar */}
          <div style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0' }}>
            {[
              <svg key="i" width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5-8 8" stroke="currentColor" strokeWidth="1.6" fill="none"/></svg>,
              <svg key="p" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
              <svg key="l" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.3-9.5-9.2A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 6.8C19 16.7 12 21 12 21z" stroke="currentColor" strokeWidth="1.6" fill="none"/></svg>,
              <svg key="g" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></svg>,
            ].map((g, i) => (
              <button key={i} style={{
                width:36, height:36, borderRadius:'50%', cursor:'pointer',
                background:'rgba(255,255,255,0.04)', border:`1px solid ${TOKENS.line}`,
                color:TOKENS.gold, display:'flex', alignItems:'center', justifyContent:'center',
              }}>{g}</button>
            ))}
            <div style={{ flex:1 }}/>
            {/* circular progress */}
            <div style={{ position:'relative', width:32, height:32 }}>
              <svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5"/>
                <circle cx="16" cy="16" r="13" fill="none"
                  stroke={text.length > MAX - 20 ? TOKENS.down : TOKENS.gold}
                  strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 13}
                  strokeDashoffset={(1 - text.length/MAX) * 2 * Math.PI * 13}
                  transform="rotate(-90 16 16)"
                  style={{ transition:'stroke-dashoffset 200ms, stroke 200ms' }}/>
              </svg>
              {text.length > MAX - 40 && (
                <span style={{
                  position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:'Geist Mono, monospace', fontSize:10, color:TOKENS.mute,
                }}>{MAX - text.length}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ComposeScreen });
