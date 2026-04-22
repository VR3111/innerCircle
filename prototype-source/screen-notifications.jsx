// screen-notifications.jsx

function NotificationsScreen({ state, setState }) {
  const [items, setItems] = React.useState(NOTIFICATIONS);
  const back = () => setState(s => ({ ...s, screen: s.prevScreen || 'home' }));
  const markAll = () => setItems(items.map(i => ({ ...i, unread:false })));

  const iconFor = (n) => {
    if (n.agent) return <AgentDot agent={n.agent} size={32} clickable={false}/>;
    return (
      <div style={{
        width:32, height:32, borderRadius:'50%',
        background:'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <SLMark size={16} color="#0A0A0A" />
      </div>
    );
  };

  return (
    <div style={{ position:'absolute', inset:0, background:TOKENS.bg,
                  display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'calc(18px + var(--ic-top-inset,0px)) 20px 8px' }}>
        <button onClick={back} style={iconBtnStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontFamily:'Geist', fontSize:17, fontWeight:600 }}>Notifications</span>
        <button onClick={markAll} style={{
          background:'none', border:'none', cursor:'pointer',
          color:TOKENS.gold, fontFamily:'Geist Mono, monospace', fontSize:10, letterSpacing:1.4,
        }}>MARK ALL</button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'14px 20px 40px' }} className="ic-no-scrollbar">
        {items.map((n, i) => (
          <div key={n.id} style={{
            display:'flex', gap:12, padding:'14px 14px',
            marginBottom:8, borderRadius:12,
            background: n.unread ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${n.unread ? 'rgba(212,175,55,0.2)' : TOKENS.line}`,
            animation:`sl-fade-in 400ms ease ${i*40}ms both`,
            position:'relative',
          }}>
            {iconFor(n)}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'Geist', fontSize:13, color:TOKENS.text, lineHeight:1.45, textWrap:'pretty' }}>
                {n.text}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                <span style={{ fontFamily:'Geist Mono, monospace', fontSize:9.5,
                               color:TOKENS.mute2, letterSpacing:1.2 }}>
                  {n.kind.toUpperCase()} · {n.time}
                </span>
              </div>
            </div>
            {n.unread && (
              <div style={{
                width:7, height:7, borderRadius:'50%', background:TOKENS.gold,
                boxShadow:`0 0 8px ${TOKENS.gold}`, marginTop:6,
                animation:'ic-pulse 1.8s ease-out infinite',
              }}/>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { NotificationsScreen });
