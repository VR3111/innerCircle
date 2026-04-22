// screen-settings.jsx — end-to-end settings

function SettingsScreen({ state, setState }) {
  const [dark, setDark] = React.useState(true);
  const [haptics, setHaptics] = React.useState(true);
  const [notifs, setNotifs] = React.useState(true);
  const back = () => setState(s => ({ ...s, screen: s.prevScreen || 'profile' }));

  const premium = state.premium;

  return (
    <div style={{ position:'absolute', inset:0, background:TOKENS.bg, display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'calc(18px + var(--ic-top-inset,0px)) 20px 8px' }}>
        <button onClick={back} style={iconBtnStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontFamily:'Geist', fontSize:17, fontWeight:600 }}>Settings</span>
        <div style={{ width:36 }}/>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'14px 18px 40px' }} className="ic-no-scrollbar">
        {/* profile summary */}
        <div style={{
          display:'flex', gap:14, alignItems:'center',
          padding:'16px 16px', borderRadius:14, marginBottom:18,
          background:'rgba(255,255,255,0.02)', border:`1px solid ${TOKENS.line}`,
        }}>
          <div style={{
            width:52, height:52, borderRadius:'50%',
            background:'linear-gradient(135deg, #2a2a2a, #121212)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'Geist', fontSize:20, fontWeight:700, color:TOKENS.text,
            border: premium ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.line2}`,
            boxShadow: premium ? `0 0 16px ${TOKENS.gold}55` : 'none',
          }}>T</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontFamily:'Geist', fontSize:15, fontWeight:600 }}>taylor.alpha</span>
              {premium && (
                <span style={{
                  display:'inline-flex', alignItems:'center', gap:4,
                  padding:'2px 7px', borderRadius:999,
                  background:'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)',
                  fontFamily:'Geist Mono, monospace', fontSize:8.5, color:'#0A0A0A', letterSpacing:1,
                }}>
                  <SLMark size={8} color="#0A0A0A" /> INNER CIRCLE
                </span>
              )}
            </div>
            <div style={{ fontFamily:'Geist Mono, monospace', fontSize:10,
                          color:TOKENS.mute2, letterSpacing:1.2, marginTop:3 }}>
              LEVEL 07 · SIGNAL
            </div>
          </div>
        </div>

        {!premium && (
          <button onClick={() => setState(s => ({ ...s, prevScreen:'settings', screen:'paywall' }))} style={{
            width:'100%', padding:'14px 16px', borderRadius:14, cursor:'pointer',
            background:'linear-gradient(135deg, rgba(244,212,124,0.14) 0%, rgba(140,109,26,0.14) 100%)',
            border:`1px solid ${TOKENS.gold}66`,
            display:'flex', alignItems:'center', gap:12, marginBottom:18, textAlign:'left',
          }}>
            <SLMark size={26} rotate shimmer />
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'Geist', fontSize:14, fontWeight:600, color:TOKENS.gold }}>Join Inner Circle</div>
              <div style={{ fontFamily:'Geist', fontSize:12, color:TOKENS.mute, marginTop:2 }}>
                Direct replies, DMs, and early drops.
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke={TOKENS.gold} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        <SettingsGroup title="ACCOUNT">
          <Row label="Email"      value="taylor@alpha.co"    chevron />
          <Row label="Username"   value="@taylor.alpha"      chevron />
          <Row label="Display name" value="Taylor A."         chevron />
          <Row label="Level"      value="07 · SIGNAL"         chevron last />
        </SettingsGroup>

        <SettingsGroup title="SUBSCRIPTION">
          {premium ? (
            <>
              <Row label="Plan" value="Annual · $79/yr" chevron />
              <Row label="Renews" value="Apr 20, 2027" chevron />
              <Row label="Cancel subscription" danger chevron last />
            </>
          ) : (
            <Row
              label="Inner Circle"
              value="FREE TRIAL"
              gold chevron last
              onClick={() => setState(s => ({ ...s, prevScreen:'settings', screen:'paywall' }))}
            />
          )}
        </SettingsGroup>

        <SettingsGroup title="NOTIFICATIONS">
          <Toggle label="Push notifications" on={notifs}  onChange={setNotifs}/>
          <Toggle label="Haptic feedback"   on={haptics} onChange={setHaptics}/>
          <Row label="Notification types" chevron last />
        </SettingsGroup>

        <SettingsGroup title="APPEARANCE">
          <Toggle label="Dark mode" on={dark} onChange={setDark} last/>
        </SettingsGroup>

        <SettingsGroup title="PRIVACY">
          <Row label="Who can DM me" value="Everyone" chevron />
          <Row label="Blocked accounts" chevron />
          <Row label="Data &amp; permissions" chevron last />
        </SettingsGroup>

        <SettingsGroup title="SUPPORT">
          <Row label="Help center" chevron />
          <Row label="Contact support" chevron />
          <Row label="Terms of service" chevron />
          <Row label="Privacy policy" chevron last />
        </SettingsGroup>

        <button
          onClick={() => { localStorage.clear(); setState(s => ({ ...s, screen:'splash', premium:false })); }}
          style={{
            width:'100%', padding:'14px', borderRadius:12, cursor:'pointer',
            background:'rgba(255,90,95,0.06)', border:`1px solid rgba(255,90,95,0.25)`,
            color:TOKENS.down, fontFamily:'Geist', fontSize:14, fontWeight:600, letterSpacing:0.2,
          }}>Sign out</button>

        <div style={{ textAlign:'center', padding:'18px 0 4px',
                      fontFamily:'Geist Mono, monospace', fontSize:9.5, color:TOKENS.mute3, letterSpacing:1.2 }}>
          SOCIAL LEVELING v1.0.0 · BUILD 1024
        </div>
      </div>
    </div>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{
        fontFamily:'Geist Mono, monospace', fontSize:10, color:TOKENS.mute,
        letterSpacing:1.5, padding:'0 4px 8px',
      }}>{title}</div>
      <div style={{
        borderRadius:14, overflow:'hidden',
        background:'rgba(255,255,255,0.02)', border:`1px solid ${TOKENS.line}`,
      }}>{children}</div>
    </div>
  );
}

function Row({ label, value, chevron, last, danger, gold, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display:'flex', alignItems:'center', padding:'13px 14px',
        borderBottom: last ? 'none' : `1px solid ${TOKENS.line}`,
        cursor: onClick ? 'pointer' : 'default',
      }}>
      <span style={{ flex:1, fontFamily:'Geist', fontSize:14,
                     color: danger ? TOKENS.down : TOKENS.text }}>{label}</span>
      {value && (
        <span style={{
          fontFamily: gold ? 'Geist Mono, monospace' : 'Geist',
          fontSize: gold ? 10 : 13,
          color: gold ? TOKENS.gold : TOKENS.mute, marginRight: chevron ? 6 : 0,
          letterSpacing: gold ? 1.4 : 0,
        }}>{value}</span>
      )}
      {chevron && (
        <svg width="8" height="14" viewBox="0 0 8 14">
          <path d="M1 1l6 6-6 6" stroke={TOKENS.mute3} strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );
}

function Toggle({ label, on, onChange, last }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', padding:'12px 14px',
      borderBottom: last ? 'none' : `1px solid ${TOKENS.line}`,
    }}>
      <span style={{ flex:1, fontFamily:'Geist', fontSize:14, color:TOKENS.text }}>{label}</span>
      <button
        onClick={() => onChange(!on)}
        style={{
          width:44, height:26, borderRadius:999, padding:2, cursor:'pointer',
          background: on ? TOKENS.gold : 'rgba(255,255,255,0.14)',
          border:'none', position:'relative',
          transition:'background-color 220ms cubic-bezier(.2,.8,.2,1)',
          boxShadow: on ? '0 0 12px rgba(212,175,55,0.35)' : 'none',
        }}>
        <div style={{
          width:22, height:22, borderRadius:'50%', background:'#fff',
          transform: on ? 'translateX(18px)' : 'translateX(0)',
          transition:'transform 260ms cubic-bezier(.2,.8,.2,1.1)',
          boxShadow:'0 2px 4px rgba(0,0,0,0.3)',
        }}/>
      </button>
    </div>
  );
}

Object.assign(window, { SettingsScreen });
