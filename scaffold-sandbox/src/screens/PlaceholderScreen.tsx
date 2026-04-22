import { useNavigate } from 'react-router-dom';

export function PlaceholderScreen({ title, note }: { title: string; note?: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full bg-bg">
      <header className="flex items-center gap-3 px-5 border-b border-line"
        style={{ padding: 'calc(14px + var(--ic-top-inset, 0px)) 20px 14px' }}>
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-pill border border-line bg-white/[0.05] flex items-center justify-center text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="font-sans text-[20px] font-bold text-white tracking-tight">{title}</h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-12 h-12 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center mb-5 text-gold">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="font-sans text-[15px] text-white font-semibold">Scaffold placeholder</div>
        <div className="font-sans text-[13px] text-mute mt-1 max-w-sm">
          {note ?? 'Port this screen from the prototype using the Home, Post, Leaderboard, or Auth patterns.'}
        </div>
      </div>
    </div>
  );
}
