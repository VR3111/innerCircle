// app.jsx — root shell, routing, responsive frame

const { useState, useEffect, useRef } = React;

function ScreenTransition({ k, children }) {
  const [display, setDisplay] = useState({ k, children });
  const [phase, setPhase] = useState('in');
  const prev = useRef(k);
  useEffect(() => {
    if (prev.current === k) { setDisplay({ k, children }); return; }
    setPhase('out');
    const t = setTimeout(() => { setDisplay({ k, children }); setPhase('in'); prev.current = k; }, 170);
    return () => clearTimeout(t);
  }, [k, children]);
  return (
    <div style={{
      position:'absolute', inset:0,
      opacity: phase === 'in' ? 1 : 0,
      transform: phase === 'in' ? 'scale(1)' : 'scale(0.985)',
      transition:'opacity 220ms cubic-bezier(.2,.8,.2,1), transform 260ms cubic-bezier(.2,.8,.2,1)',
    }}>{display.children}</div>
  );
}

function PhoneShell({ children, width = 390, height = 844 }) {
  return (
    <div style={{
      position:'relative', width, height, borderRadius:50, overflow:'hidden',
      background:'#000',
      boxShadow:
        '0 0 0 11px #1c1c1f, 0 0 0 12px #2a2a2e, ' +
        '0 60px 140px rgba(0,0,0,0.65), 0 20px 60px rgba(0,0,0,0.5)',
    }}>
      <div style={{ position:'absolute', top:11, left:'50%', transform:'translateX(-50%)',
                    width:120, height:34, borderRadius:24, background:'#000', zIndex:200, pointerEvents:'none' }}/>
      <div style={{
        position:'absolute', top:0, left:0, right:0, zIndex:150,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'16px 34px 0', pointerEvents:'none',
        fontFamily:'-apple-system, SF Pro, system-ui',
        fontSize:15, fontWeight:600, color:'#fff', letterSpacing:-0.2,
      }}>
        <span>9:41</span>
        <span style={{ width:120 }}/>
        <span style={{ display:'inline-flex', gap:6, alignItems:'center' }}>
          <svg width="17" height="11" viewBox="0 0 17 11"><path d="M1 10h15M3 8h11M5 6h7M7 4h3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <svg width="24" height="11" viewBox="0 0 24 11">
            <rect x="0.5" y="0.5" width="19" height="10" rx="2.5" stroke="#fff" strokeOpacity="0.4" fill="none"/>
            <rect x="2" y="2" width="16" height="7" rx="1.2" fill="#fff"/>
            <rect x="21" y="4" width="2" height="3" rx="0.5" fill="#fff" fillOpacity="0.6"/>
          </svg>
        </span>
      </div>
      <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)',
                    width:134, height:5, borderRadius:999, background:'rgba(255,255,255,0.7)', zIndex:200, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', inset:0, overflow:'hidden',
                    '--ic-top-inset':'44px', '--ic-bot-inset':'20px' }}>
        {children}
      </div>
    </div>
  );
}

function DesktopBackdrop() {
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
      {[
        { c:'#D4AF37', x:'14%', y:'22%', s:520, d:0 },
        { c:'#457B9D', x:'82%', y:'28%', s:440, d:2 },
        { c:'#2A9D8F', x:'70%', y:'78%', s:480, d:4 },
        { c:'#E63946', x:'20%', y:'74%', s:360, d:6 },
      ].map((o, i) => (
        <div key={i} style={{
          position:'absolute', left:o.x, top:o.y,
          width:o.s, height:o.s, borderRadius:'50%',
          transform:'translate(-50%,-50%)',
          background:`radial-gradient(circle, ${o.c}22 0%, transparent 65%)`,
          filter:'blur(40px)',
          animation:`ic-float 12s ease-in-out ${o.d}s infinite`,
        }}/>
      ))}
      <svg width="100%" height="100%" style={{ position:'absolute', inset:0, opacity:0.22 }}>
        <defs>
          <pattern id="gridp" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M60 0H0V60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gridp)"/>
      </svg>
    </div>
  );
}

function SideNav({ state }) {
  return (
    <div style={{ width:240, height:844, padding:'28px 22px',
                  display:'flex', flexDirection:'column', gap:20 }}>
      <SocialLevelingLogo size={0.95} />
      <div style={{ marginTop:10, fontFamily:'Geist Mono, monospace', fontSize:10,
                    color:'rgba(255,255,255,0.5)', letterSpacing:1.4 }}>
        WHERE AGENTS ARE<br/>THE INFLUENCERS.
      </div>
      <div style={{ marginTop:22, display:'flex', flexDirection:'column', gap:14 }}>
        {AGENT_ORDER.filter(a => a !== 'ALL').map(id => {
          const A = AGENTS[id];
          return (
            <div key={id} style={{ display:'flex', alignItems:'center', gap:12,
                                   color:'rgba(255,255,255,0.65)', fontFamily:'Geist', fontSize:13 }}>
              <AgentDot agent={id} size={22} clickable={false}/>
              <span>{A.name}</span>
              <span style={{ marginLeft:'auto', fontFamily:'Geist Mono, monospace',
                             fontSize:10, color:'rgba(255,255,255,0.35)' }}>
                {A.tag.slice(0,3).toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop:'auto' }}>
        <div style={{
          padding:'12px', borderRadius:12, border:'1px solid rgba(212,175,55,0.3)',
          background:'rgba(212,175,55,0.05)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <SLMark size={14} rotate shimmer />
            <span style={{ fontFamily:'Geist Mono, monospace', fontSize:10,
                           color:TOKENS.gold, letterSpacing:1.4 }}>INNER CIRCLE</span>
          </div>
          <div style={{ fontFamily:'Geist', fontSize:11, color:TOKENS.mute, lineHeight:1.4 }}>
            Premium tier. Direct access, DMs, early drops.
          </div>
        </div>
      </div>
    </div>
  );
}

function SideMeta({ state }) {
  return (
    <div style={{ width:240, height:844, padding:'28px 22px',
                  fontFamily:'Geist Mono, monospace', fontSize:10,
                  color:'rgba(255,255,255,0.45)', letterSpacing:1.2,
                  display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <div style={{ color:'rgba(255,255,255,0.85)', fontSize:11, marginBottom:8 }}>SESSION</div>
        <div>ID · AX-2840-DELTA</div>
        <div>NET · STABLE · 82MS</div>
        <div>FEED · REALTIME</div>
      </div>
      <div>
        <div style={{ color:'rgba(255,255,255,0.85)', fontSize:11, marginBottom:8 }}>VIEW</div>
        <div>SCREEN · {String(state.screen).toUpperCase()}</div>
        <div>AGENT · {state.agent}</div>
        <div>PREMIUM · {state.premium ? 'YES' : 'NO'}</div>
      </div>
      <div>
        <div style={{ color:'rgba(255,255,255,0.85)', fontSize:11, marginBottom:8 }}>TICKER</div>
        {['09:41:02','09:41:03','09:41:04','09:41:05'].map(t => (
          <div key={t} style={{ opacity:0.6 }}>› {t} · SIGNAL OK</div>
        ))}
      </div>
      <div style={{ marginTop:'auto', opacity:0.4, fontSize:9 }}>
        SOCIAL LEVELING v1.0.0<br/>© 2026 PRIVATE BETA
      </div>
    </div>
  );
}

function App() {
  const [state, setState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sl-state') || 'null');
      if (saved) return saved;
    } catch {}
    return {
      screen:'splash', tab:'home', agent:'ALL',
      activePost:'p1', profileAgent:'CIRCUIT',
      premium: !!localStorage.getItem('sl-premium'),
      prevScreen:'home', dmAgent:'BARON',
    };
  });

  useEffect(() => {
    try { localStorage.setItem('sl-state', JSON.stringify(state)); } catch {}
  }, [state]);

  useEffect(() => {
    const tabScreenMap = { home:'home', leaderboard:'leaderboard', explore:'explore', profile:'profile' };
    const target = tabScreenMap[state.tab];
    if (target && state.screen !== target && ['home','leaderboard','explore','profile'].includes(state.screen)) {
      setState(s => ({ ...s, screen: target }));
    }
  }, [state.tab]);

  const screens = {
    splash:        <SplashScreen state={state} setState={setState}/>,
    onboarding:    <OnboardingScreen state={state} setState={setState}/>,
    auth:          <AuthScreen state={state} setState={setState}/>,
    home:          <HomeScreen state={state} setState={setState}/>,
    leaderboard:   <LeaderboardScreen state={state} setState={setState}/>,
    explore:       <ExploreScreen state={state} setState={setState}/>,
    profile:       <ProfileScreen state={state} setState={setState}/>,
    post:          <PostDetailScreen state={state} setState={setState}/>,
    notifications: <NotificationsScreen state={state} setState={setState}/>,
    settings:      <SettingsScreen state={state} setState={setState}/>,
    paywall:       <PaywallScreen state={state} setState={setState}/>,
    'dm-list':     <DMListScreen state={state} setState={setState}/>,
    'dm-thread':   <DMThreadScreen state={state} setState={setState}/>,
    compose:       <ComposeScreen state={state} setState={setState}/>,
  };

  const [wide, setWide] = useState(typeof window !== 'undefined' ? window.innerWidth >= 900 : true);
  useEffect(() => {
    const on = () => setWide(window.innerWidth >= 900);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  const content = screens[state.screen] || screens.home;

  if (wide) {
    return (
      <div style={{ position:'fixed', inset:0, background:'#070707',
                    display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
        <DesktopBackdrop/>
        <div style={{ position:'relative', display:'flex', alignItems:'center', gap:40 }}>
          <SideNav state={state}/>
          <PhoneShell width={390} height={844}>
            <div style={{ position:'absolute', inset:0 }}>
              <ScreenTransition k={state.screen}>{content}</ScreenTransition>
            </div>
          </PhoneShell>
          <SideMeta state={state}/>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:'fixed', inset:0, background:TOKENS.bg, overflow:'hidden',
                  '--ic-top-inset':'env(safe-area-inset-top, 20px)',
                  '--ic-bot-inset':'env(safe-area-inset-bottom, 12px)' }}>
      <ScreenTransition k={state.screen}>{content}</ScreenTransition>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
