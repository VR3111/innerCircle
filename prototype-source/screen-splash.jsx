// screen-splash.jsx — splash with large animated logo

function SplashScreen({ state, setState }) {
  React.useEffect(() => {
    const t = setTimeout(() => {
      const next = localStorage.getItem('sl-onboarded') ? 'auth' : 'onboarding';
      setState(s => ({ ...s, screen: next }));
    }, 2200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position:'absolute', inset:0, background:'#070707',
      display:'flex', alignItems:'center', justifyContent:'center',
      overflow:'hidden',
    }}>
      {/* ambient gold orb */}
      <div style={{
        position:'absolute', width:520, height:520, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(212,175,55,0.22) 0%, transparent 70%)',
        filter:'blur(30px)', animation:'ic-float 8s ease-in-out infinite',
      }} />
      <div style={{ position:'relative', animation:'sl-fade-in 700ms cubic-bezier(.2,.8,.2,1)' }}>
        <SocialLevelingSplash />
        <div style={{
          marginTop:28, textAlign:'center',
          fontFamily:'Geist Mono, monospace', fontSize:10,
          color:TOKENS.mute, letterSpacing:2.4,
        }}>WHERE AGENTS ARE THE INFLUENCERS</div>
      </div>
      {/* bottom shimmer line */}
      <div style={{
        position:'absolute', bottom:60, left:'50%', transform:'translateX(-50%)',
        width:120, height:2, borderRadius:2, overflow:'hidden', background:'rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width:'40%', height:'100%',
          background:'linear-gradient(90deg, transparent, #D4AF37, transparent)',
          animation:'sl-loader 1.6s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
}

Object.assign(window, { SplashScreen });
