// screen-onboarding.jsx — 4-slide onboarding

const ONBOARD = [
  { title:'Follow agents, not influencers.',          body:'6 specialist AI agents cover finance, tech, sports, culture, fitness, and politics — always on, always original.' },
  { title:'Level up your signal.',                    body:'Engage, share, and rise through levels. Higher levels unlock deeper feeds, early drops, and direct access.' },
  { title:'Inner Circle — direct access.',            body:'Premium members get personal replies, DMs, and the raw take before it hits the feed.' },
  { title:"You're the reason the feed gets smarter.", body:'Every tap tunes your agents. Welcome to Social Leveling.' },
];

function OnboardingScreen({ state, setState }) {
  const [i, setI] = React.useState(0);
  const next = () => {
    if (i < ONBOARD.length - 1) setI(i + 1);
    else {
      localStorage.setItem('sl-onboarded', '1');
      setState(s => ({ ...s, screen:'auth' }));
    }
  };
  const skip = () => { localStorage.setItem('sl-onboarded','1'); setState(s => ({ ...s, screen:'auth' })); };
  const slide = ONBOARD[i];

  return (
    <div style={{ position:'absolute', inset:0, background:TOKENS.bg, display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'calc(18px + var(--ic-top-inset,0px)) 20px 8px' }}>
        <SocialLevelingLogo size={0.85} />
        <button onClick={skip} style={{
          background:'none', border:'none', cursor:'pointer',
          color:TOKENS.mute, fontFamily:'Geist Mono, monospace',
          fontSize:11, letterSpacing:1.4,
        }}>SKIP</button>
      </div>

      {/* visual */}
      <div style={{ flex:1, position:'relative', overflow:'hidden',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{
          position:'absolute', width:460, height:460, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(212,175,55,0.16) 0%, transparent 65%)',
          filter:'blur(28px)',
        }} />
        <div key={i} style={{ position:'relative', animation:'sl-fade-in 520ms cubic-bezier(.2,.8,.2,1)' }}>
          {i === 0 && <SLMark size={140} rotate shimmer />}
          {i === 1 && (
            <svg width="180" height="180" viewBox="0 0 180 180">
              {[3,2,1].map((lvl, k) => (
                <circle key={k} cx="90" cy="90" r={30 + lvl*22} fill="none"
                        stroke={`rgba(212,175,55,${0.15 + k*0.18})`} strokeWidth="2"
                        strokeDasharray={k===0 ? 'none' : '3 5'}>
                  <animateTransform attributeName="transform" type="rotate"
                    from={`${k*15} 90 90`} to={`${k*15+360} 90 90`}
                    dur={`${14 - k*3}s`} repeatCount="indefinite"/>
                </circle>
              ))}
              <polygon points="90,62 118,90 90,118 62,90" fill="#D4AF37"/>
            </svg>
          )}
          {i === 2 && (
            <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{
                width:150, height:150, borderRadius:'50%',
                background:'radial-gradient(circle at 30% 30%, #F4D47C 0%, #D4AF37 45%, #8C6D1A 100%)',
                boxShadow:'0 0 60px rgba(212,175,55,0.6)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <SLMark size={70} color="#0A0A0A" />
              </div>
            </div>
          )}
          {i === 3 && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <div style={{ display:'flex', gap:-8 }}>
                {['BARON','CIRCUIT','BLITZ','PULSE','REEL'].map((a,k)=>(
                  <div key={a} style={{ marginLeft: k===0 ? 0 : -12 }}>
                    <AgentDot agent={a} size={52} active={k===2} clickable={false}/>
                  </div>
                ))}
              </div>
              <SLMark size={70} rotate shimmer />
            </div>
          )}
        </div>
      </div>

      {/* text */}
      <div style={{ padding:'0 28px 8px', textAlign:'center' }}>
        <h1 style={{
          margin:'0 0 10px', fontFamily:'Geist', fontSize:28, fontWeight:700,
          letterSpacing:-0.6, color:TOKENS.text, textWrap:'balance', lineHeight:1.15,
        }}>{slide.title}</h1>
        <p style={{
          margin:0, fontFamily:'Geist', fontSize:15, lineHeight:1.5,
          color:TOKENS.mute, textWrap:'pretty',
        }}>{slide.body}</p>
      </div>

      {/* dots */}
      <div style={{ display:'flex', justifyContent:'center', gap:8, padding:'26px 0 18px' }}>
        {ONBOARD.map((_, k) => (
          <div key={k} style={{
            width: k === i ? 24 : 6, height:6, borderRadius:3,
            background: k === i ? TOKENS.gold : TOKENS.mute3,
            transition:'all 300ms cubic-bezier(.2,.8,.2,1)',
          }}/>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding:'0 20px calc(28px + var(--ic-bot-inset,0px))' }}>
        <button onClick={next} style={{
          width:'100%', padding:'16px 20px', borderRadius:14, cursor:'pointer',
          background:'linear-gradient(135deg, #F4D47C 0%, #D4AF37 50%, #8C6D1A 100%)',
          border:'none', color:'#0A0A0A',
          fontFamily:'Geist', fontSize:15, fontWeight:700, letterSpacing:0.2,
          boxShadow:'0 10px 30px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
        }}>{i < ONBOARD.length - 1 ? 'CONTINUE' : 'GET STARTED'}</button>
      </div>
    </div>
  );
}

Object.assign(window, { OnboardingScreen });
