// screen-auth.jsx — sign-in / sign-up

function AuthScreen({ state, setState }) {
  const [mode, setMode] = React.useState('signin'); // signin | signup
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const submit = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('sl-auth', '1');
      setState(s => ({ ...s, screen:'home', tab:'home' }));
    }, 900);
  };

  const SocialBtn = ({ label, icon }) => (
    <button style={{
      flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      padding:'12px', borderRadius:12, cursor:'pointer',
      background:'rgba(255,255,255,0.04)', border:`1px solid ${TOKENS.line2}`,
      color:TOKENS.text, fontFamily:'Geist', fontSize:13, fontWeight:500,
    }}>{icon}{label}</button>
  );

  return (
    <div style={{ position:'absolute', inset:0, background:TOKENS.bg, display:'flex', flexDirection:'column', overflow:'auto' }} className="ic-no-scrollbar">
      {/* ambient */}
      <div style={{ position:'absolute', top:-120, left:'50%', transform:'translateX(-50%)',
                    width:480, height:480, borderRadius:'50%',
                    background:'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)',
                    filter:'blur(40px)', pointerEvents:'none' }}/>

      <div style={{ padding:'calc(36px + var(--ic-top-inset,0px)) 28px 14px', display:'flex', justifyContent:'center' }}>
        <SocialLevelingLogo size={1} />
      </div>

      <div style={{ padding:'22px 28px 0', textAlign:'center' }}>
        <h1 style={{ margin:'0 0 6px', fontFamily:'Geist', fontSize:26, fontWeight:700, letterSpacing:-0.5 }}>
          {mode === 'signin' ? 'Welcome back.' : 'Create your account.'}
        </h1>
        <p style={{ margin:0, color:TOKENS.mute, fontFamily:'Geist', fontSize:14 }}>
          {mode === 'signin' ? 'Pick up where you left off.' : 'Start following the signal.'}
        </p>
      </div>

      {/* toggle */}
      <div style={{ margin:'22px 28px 0', padding:4, display:'flex', borderRadius:999,
                    background:'rgba(255,255,255,0.04)', border:`1px solid ${TOKENS.line}` }}>
        {['signin','signup'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex:1, padding:'10px 0', borderRadius:999, border:'none', cursor:'pointer',
            background: mode===m ? TOKENS.gold : 'transparent',
            color: mode===m ? '#0A0A0A' : TOKENS.mute,
            fontFamily:'Geist', fontSize:12, fontWeight:600, letterSpacing:0.4,
            transition:'all 240ms cubic-bezier(.2,.8,.2,1)',
            boxShadow: mode===m ? '0 2px 12px rgba(212,175,55,0.3)' : 'none',
          }}>{m === 'signin' ? 'SIGN IN' : 'SIGN UP'}</button>
        ))}
      </div>

      {/* form */}
      <div style={{ padding:'22px 28px 0', display:'flex', flexDirection:'column', gap:12 }}>
        <Field label="Email">
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email"
                 placeholder="you@domain.com" style={inputStyle} />
        </Field>
        <Field label="Password">
          <input value={pw} onChange={e=>setPw(e.target.value)} type="password"
                 placeholder="••••••••" style={inputStyle} />
        </Field>
        {mode === 'signin' && (
          <button style={{
            alignSelf:'flex-end', background:'none', border:'none', cursor:'pointer',
            color:TOKENS.gold, fontFamily:'Geist', fontSize:12, padding:0, marginTop:-4,
          }}>Forgot password?</button>
        )}

        <button
          onClick={submit} disabled={loading}
          style={{
            marginTop:10, width:'100%', padding:'16px 20px', borderRadius:14, cursor:'pointer',
            background:'linear-gradient(135deg, #F4D47C 0%, #D4AF37 50%, #8C6D1A 100%)',
            border:'none', color:'#0A0A0A',
            fontFamily:'Geist', fontSize:14, fontWeight:700, letterSpacing:0.3,
            boxShadow:'0 10px 30px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
            opacity: loading ? 0.7 : 1,
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          }}>
          {loading && <Spinner />}
          {mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </button>
      </div>

      {/* divider */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'22px 28px 0' }}>
        <div style={{ flex:1, height:1, background:TOKENS.line }}/>
        <span style={{ fontFamily:'Geist Mono, monospace', fontSize:10, color:TOKENS.mute2, letterSpacing:1.4 }}>OR</span>
        <div style={{ flex:1, height:1, background:TOKENS.line }}/>
      </div>

      <div style={{ padding:'14px 28px 0', display:'flex', gap:10 }}>
        <SocialBtn label="Apple" icon={<svg width="14" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M17.5 12.5c0-3 2.5-4.5 2.6-4.6-1.4-2-3.6-2.3-4.4-2.4-1.9-.2-3.6 1.1-4.6 1.1-.9 0-2.4-1.1-4-1-2 0-3.9 1.2-5 3-2.1 3.7-.5 9.1 1.5 12.1 1 1.5 2.2 3.1 3.8 3 1.5-.1 2.1-1 3.9-1 1.9 0 2.4 1 4 1 1.7 0 2.7-1.5 3.7-3 1.2-1.7 1.7-3.4 1.7-3.5-.1 0-3.3-1.3-3.3-5zM14.9 4.4c.8-.9 1.3-2.3 1.2-3.7-1.1 0-2.6.8-3.4 1.7-.8.8-1.4 2.2-1.2 3.6 1.3.1 2.6-.7 3.4-1.6z"/></svg>}/>
        <SocialBtn label="Google" icon={<svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1.1 2.5-2.3 3.3v2.8h3.7c2.1-2 3.2-4.9 3.2-8.1z"/><path fill="#34A853" d="M12 23c3 0 5.6-1 7.4-2.7l-3.7-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H1.8v2.9C3.6 20.6 7.5 23 12 23z"/><path fill="#FBBC04" d="M5.7 13.9C5.5 13.2 5.3 12.6 5.3 12s.2-1.3.4-1.9V7.2H1.8C1.1 8.7.7 10.3.7 12s.4 3.3 1.1 4.8l3.9-2.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.6 2 14.9 1 12 1 7.5 1 3.6 3.4 1.8 7.2l3.9 2.9C6.6 7.4 9 5.4 12 5.4z"/></svg>}/>
      </div>

      <div style={{ padding:'18px 28px 22px', textAlign:'center',
                    fontFamily:'Geist', fontSize:11, color:TOKENS.mute2 }}>
        By continuing you agree to our <span style={{ color:TOKENS.mute, textDecoration:'underline' }}>Terms</span> &amp; <span style={{ color:TOKENS.mute, textDecoration:'underline' }}>Privacy</span>.
      </div>
    </div>
  );
}

const inputStyle = {
  width:'100%', padding:'13px 14px', borderRadius:12,
  background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)',
  color:'#fff', fontFamily:'Geist', fontSize:14, outline:'none',
  transition:'border-color 200ms, box-shadow 200ms',
};

function Field({ label, children }) {
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <span style={{ fontFamily:'Geist Mono, monospace', fontSize:10,
                     color:'rgba(255,255,255,0.55)', letterSpacing:1.4 }}>
        {label.toUpperCase()}
      </span>
      {children}
    </label>
  );
}

function Spinner({ color = '#0A0A0A', size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation:'sl-spin 0.9s linear infinite' }}>
      <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="3"/>
      <path d="M21 12a9 9 0 00-9-9" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

Object.assign(window, { AuthScreen, Field, inputStyle, Spinner });
