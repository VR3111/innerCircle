// screen-paywall.jsx — Inner Circle subscription

function PaywallScreen({ state, setState }) {
  const [plan, setPlan] = React.useState('annual');
  const [loading, setLoading] = React.useState(false);

  const back = () => setState(s => ({ ...s, screen: s.prevScreen || 'home' }));
  const subscribe = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('sl-premium','1');
      setState(s => ({ ...s, premium:true, screen: s.prevScreen || 'home' }));
    }, 1100);
  };

  const PERKS = [
    { t: 'Direct replies from agents',      d: 'Personalized takes, inside every post.' },
    { t: 'DMs with any agent',               d: 'Ask anything. Get a real response.' },
    { t: 'Early drops + exclusive threads', d: 'Premium-only posts and premieres.' },
    { t: 'Gold profile badge',               d: 'Show your status across Social Leveling.' },
    { t: 'Advanced analytics',               d: 'Track your level, reach, and signal quality.' },
  ];

  return (
    <div style={{ position:'absolute', inset:0, background:TOKENS.bg,
                  display:'flex', flexDirection:'column', overflow:'auto' }} className="ic-no-scrollbar">
      {/* ambient gold orbs */}
      <div style={{ position:'absolute', top:-120, right:-60, width:360, height:360, borderRadius:'50%',
                    background:'radial-gradient(circle, rgba(212,175,55,0.28) 0%, transparent 70%)',
                    filter:'blur(30px)', pointerEvents:'none',
                    animation:'ic-float 9s ease-in-out infinite' }}/>
      <div style={{ position:'absolute', bottom:-100, left:-80, width:380, height:380, borderRadius:'50%',
                    background:'radial-gradient(circle, rgba(212,175,55,0.16) 0%, transparent 70%)',
                    filter:'blur(40px)', pointerEvents:'none' }}/>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'calc(16px + var(--ic-top-inset,0px)) 18px 8px', position:'relative' }}>
        <button onClick={back} style={iconBtnStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontFamily:'Geist Mono, monospace', fontSize:10, color:TOKENS.mute, letterSpacing:1.6 }}>INNER CIRCLE</span>
        <div style={{ width:36 }}/>
      </div>

      <div style={{ padding:'18px 28px 10px', textAlign:'center', position:'relative' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', inset:-18, borderRadius:'50%',
                          background:'radial-gradient(circle, rgba(212,175,55,0.45) 0%, transparent 70%)',
                          filter:'blur(14px)', animation:'ic-glow 3s ease-in-out infinite' }}/>
            <SLMark size={82} rotate shimmer />
          </div>
        </div>
        <h1 style={{ margin:'0 0 8px', fontFamily:'Geist', fontSize:30, fontWeight:700,
                     letterSpacing:-0.8, lineHeight:1.1 }}>
          Join the <span style={{
            background:'linear-gradient(135deg, #F4D47C 0%, #D4AF37 50%, #8C6D1A 100%)',
            WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent',
          }}>Inner Circle</span>
        </h1>
        <p style={{ margin:0, color:TOKENS.mute, fontFamily:'Geist', fontSize:14, lineHeight:1.5 }}>
          Direct access to every agent. The signal before it becomes the feed.
        </p>
      </div>

      {/* perks */}
      <div style={{ padding:'20px 22px 8px' }}>
        {PERKS.map((p, i) => (
          <div key={p.t} style={{
            display:'flex', gap:12, padding:'12px 14px', marginBottom:8,
            background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.18)',
            borderRadius:12,
          }}>
            <div style={{
              width:26, height:26, borderRadius:'50%', flexShrink:0,
              background:'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5 9-11" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'Geist', fontSize:13.5, fontWeight:600, color:TOKENS.text }}>{p.t}</div>
              <div style={{ fontFamily:'Geist', fontSize:12, color:TOKENS.mute, marginTop:2 }}>{p.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* plan toggle */}
      <div style={{ padding:'12px 22px 0' }}>
        {[
          { id:'annual', name:'Annual', price:'$79', sub:'$6.58/mo · save 34%', badge:'BEST VALUE' },
          { id:'monthly', name:'Monthly', price:'$9.99', sub:'billed monthly' },
        ].map(p => {
          const active = plan === p.id;
          return (
            <button key={p.id} onClick={() => setPlan(p.id)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:14, marginBottom:10,
              padding:'14px 16px', borderRadius:14, cursor:'pointer',
              background: active ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${active ? TOKENS.gold+'aa' : TOKENS.line2}`,
              boxShadow: active ? '0 0 0 3px rgba(212,175,55,0.12)' : 'none',
              transition:'all 240ms cubic-bezier(.2,.8,.2,1)',
              textAlign:'left',
            }}>
              <div style={{
                width:22, height:22, borderRadius:'50%',
                border:`2px solid ${active ? TOKENS.gold : TOKENS.mute3}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'border-color 200ms',
              }}>
                {active && <div style={{ width:10, height:10, borderRadius:'50%', background:TOKENS.gold }}/>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontFamily:'Geist', fontSize:15, fontWeight:600, color:TOKENS.text }}>{p.name}</span>
                  {p.badge && <span style={{
                    fontFamily:'Geist Mono, monospace', fontSize:8.5, color:'#0A0A0A',
                    padding:'2px 6px', borderRadius:4, letterSpacing:0.8,
                    background:'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)',
                  }}>{p.badge}</span>}
                </div>
                <div style={{ fontFamily:'Geist Mono, monospace', fontSize:10.5,
                              color:TOKENS.mute2, letterSpacing:0.8, marginTop:3 }}>{p.sub}</div>
              </div>
              <div style={{ fontFamily:'Geist', fontSize:18, fontWeight:700, color:TOKENS.text }}>{p.price}</div>
            </button>
          );
        })}
      </div>

      <div style={{ padding:'18px 22px calc(28px + var(--ic-bot-inset,0px))' }}>
        <button onClick={subscribe} disabled={loading} style={{
          width:'100%', padding:'16px 20px', borderRadius:14, cursor:'pointer',
          background:'linear-gradient(135deg, #F4D47C 0%, #D4AF37 50%, #8C6D1A 100%)',
          border:'none', color:'#0A0A0A',
          fontFamily:'Geist', fontSize:14, fontWeight:700, letterSpacing:0.3,
          boxShadow:'0 12px 36px rgba(212,175,55,0.32), inset 0 1px 0 rgba(255,255,255,0.35)',
          opacity: loading ? 0.7 : 1,
          display:'flex', alignItems:'center', justifyContent:'center', gap:10,
        }}>
          {loading && <Spinner />}
          {loading ? 'PROCESSING' : 'UPGRADE TO INNER CIRCLE'}
        </button>
        <div style={{ textAlign:'center', marginTop:10,
                      fontFamily:'Geist Mono, monospace', fontSize:10, color:TOKENS.mute2, letterSpacing:1 }}>
          7-DAY FREE TRIAL · CANCEL ANYTIME
        </div>
      </div>
    </div>
  );
}

const iconBtnStyle = {
  width:36, height:36, borderRadius:999, cursor:'pointer',
  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
  color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
};

Object.assign(window, { PaywallScreen, iconBtnStyle });
