// CategoryLeaderboardScreen — Level 2 of the 2-level Leaderboard hub.
// Route: /leaderboard/:category  (e.g. /leaderboard/BARON)
//
// :category is the agent ID uppercased. The param is normalised so that
// /leaderboard/baron works the same as /leaderboard/BARON.
// Invalid params redirect to /leaderboard (ArenasHubScreen).
//
// Layout: fixed header → scrollable rankings (top 5 gold + ranks 6+) → pinned
// YOUR RANK card at the bottom (above BottomNav supplied by MobileLayout).
//
// BottomNav is intentionally absent — MobileLayout provides it.

import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { AGENTS, TOKENS } from '@/lib/design-tokens';
// AgentDot is available from '@/components/primitives' if needed for future row enhancements
import {
  LEADERBOARD_DATA,
  type CategoryAgentId,
  type LeaderboardUser,
} from '@/lib/leaderboard-mock';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_CATEGORIES: string[] = ['BARON', 'BLITZ', 'CIRCUIT', 'REEL', 'PULSE', 'ATLAS'];

function isValidCategory(id: string): id is CategoryAgentId {
  return VALID_CATEGORIES.includes(id);
}

// ─── Back button (shared icon button style matching Settings / Profile) ────────

const iconBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${TOKENS.line}`,
  borderRadius: 999,
  width: 36,
  height: 36,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: TOKENS.text,
  flexShrink: 0,
};

// ─── LeaderRow ────────────────────────────────────────────────────────────────
// Shared between the Creators Club section and the general rankings section.

interface LeaderRowProps {
  user: LeaderboardUser;
  rank: number;
  isTop5: boolean;
}

function LeaderRow({ user, rank, isTop5 }: LeaderRowProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 12,
      background: isTop5
        ? 'linear-gradient(90deg, rgba(244,212,124,0.08) 0%, rgba(212,175,55,0.03) 100%)'
        : 'transparent',
      border: isTop5 ? `1px solid ${TOKENS.gold}44` : '1px solid transparent',
    }}>
      {/* Rank number — padded to 2 digits */}
      <span style={{
        fontFamily: 'ui-monospace, monospace',
        fontSize: 20, fontWeight: 700,
        color: isTop5 ? TOKENS.gold : TOKENS.mute3,
        fontVariantNumeric: 'tabular-nums',
        width: 32, flexShrink: 0, lineHeight: 1,
      }}>
        {String(rank).padStart(2, '0')}
      </span>

      {/* Avatar circle — user initials on subtle gradient (not agent-colored) */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)',
        border: `1px solid ${TOKENS.line2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11, fontWeight: 700, color: TOKENS.text,
      }}>
        {user.initials}
      </div>

      {/* Middle — handle + signal score label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 15, fontWeight: 600, color: TOKENS.text,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          @{user.handle}
        </div>
        <div style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 10, color: TOKENS.mute2, letterSpacing: 1.2, marginTop: 2,
        }}>
          SCORE {user.signalScore.toLocaleString()}
        </div>
      </div>

      {/* Right — large score + change delta */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        <span style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 17, fontVariantNumeric: 'tabular-nums',
          color: TOKENS.text, fontWeight: 600,
        }}>
          {user.signalScore.toLocaleString()}
        </span>
        {user.change !== 0 && (
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10, letterSpacing: 0.5,
            color: user.change > 0 ? '#2A9D8F' : '#E63946',
          }}>
            {user.change > 0 ? '▲' : '▼'} {Math.abs(user.change)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Ranked 6+ separator ──────────────────────────────────────────────────────

function RankSeparator() {
  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center', margin: '14px 0',
    }}>
      <div style={{ flex: 1, height: 1, background: TOKENS.line }} />
      <span style={{
        fontFamily: 'ui-monospace, monospace',
        fontSize: 10, color: TOKENS.mute, padding: '0 12px', letterSpacing: 1.2,
      }}>
        RANKED 6+
      </span>
      <div style={{ flex: 1, height: 1, background: TOKENS.line }} />
    </div>
  );
}

// ─── YOUR RANK pinned card ─────────────────────────────────────────────────────

interface YourRankCardProps {
  yourRank: number | null;
  yourScore: number | null;
  yourChange: number | null;
  agentColor: string;
}

function YourRankCard({ yourRank, yourScore, yourChange, agentColor }: YourRankCardProps) {
  const isTop5 = yourRank !== null && yourRank <= 5;
  const isRanked = yourRank !== null;

  const gapToTop5 = isRanked && !isTop5 ? yourRank - 5 : 0;

  const changeParts: string[] = [];
  if (yourChange && yourChange !== 0) {
    changeParts.push(`${yourChange > 0 ? '▲' : '▼'} ${Math.abs(yourChange)} this week`);
  }
  if (!isTop5 && gapToTop5 > 0) {
    changeParts.push(`${gapToTop5} ${gapToTop5 === 1 ? 'rank' : 'ranks'} from Creators Club`);
  }
  const subtitle = changeParts.join(' · ');

  return (
    <div style={{
      borderTop: `1px solid ${TOKENS.line}`,
      background: TOKENS.bg,
      padding: '12px 20px',
      paddingBottom: 'calc(12px + var(--ic-bot-inset, 0px))',
    }}>
      <div style={{
        borderRadius: 14,
        background: isTop5
          ? 'linear-gradient(135deg, rgba(244,212,124,0.12) 0%, rgba(212,175,55,0.04) 100%)'
          : 'rgba(255,255,255,0.03)',
        border: isTop5 ? `1px solid ${TOKENS.gold}44` : `1px solid ${TOKENS.line}`,
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        {/* Label column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10, letterSpacing: 1.4,
            color: isTop5 ? TOKENS.gold : TOKENS.mute,
            marginBottom: 4,
          }}>
            {isTop5 ? "YOU'RE IN THE CREATORS CLUB" : 'YOUR RANK'}
          </div>

          {isRanked ? (
            <>
              <div style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: isTop5 ? 28 : 22, fontWeight: 700,
                color: isTop5 ? TOKENS.gold : TOKENS.text,
                lineHeight: 1,
              }}>
                #{yourRank}
              </div>
              {subtitle && (
                <div style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 10, color: TOKENS.mute, letterSpacing: 0.8, marginTop: 4,
                }}>
                  {subtitle}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 18, fontWeight: 600, color: TOKENS.mute3, lineHeight: 1,
              }}>
                UNRANKED
              </div>
              <div style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 10, color: TOKENS.mute, letterSpacing: 0.8, marginTop: 4,
              }}>
                Start posting to enter the rankings
              </div>
            </>
          )}
        </div>

        {/* Score (when ranked) */}
        {isRanked && yourScore !== null && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 9, color: TOKENS.mute, letterSpacing: 1.2, marginBottom: 3,
            }}>
              SIGNAL
            </div>
            <div style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color: isTop5 ? TOKENS.gold : agentColor,
            }}>
              {yourScore.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CategoryLeaderboardScreen ────────────────────────────────────────────────

export function CategoryLeaderboardScreen() {
  const { category: categoryParam } = useParams<{ category: string }>();
  const navigate = useNavigate();

  // Normalise to uppercase so /leaderboard/baron works as well as /leaderboard/BARON
  const normalised = categoryParam?.toUpperCase() ?? '';

  // Invalid :category → redirect to hub
  if (!isValidCategory(normalised)) {
    return <Navigate to="/leaderboard" replace />;
  }

  const agentId: CategoryAgentId = normalised;
  const A = AGENTS[agentId];
  const data = LEADERBOARD_DATA[agentId];

  const top5 = data.users.slice(0, 5);
  const rest = data.users.slice(5);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: TOKENS.bg, overflow: 'hidden',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: 'calc(18px + var(--ic-top-inset, 0px)) 20px 16px',
        background: `linear-gradient(180deg, ${A.color}22 0%, ${A.color}0d 40%, ${TOKENS.bg} 100%)`,
      }}>
        {/* Ambient orb — top-right; ic-float-corner keyframe from globals */}
        <div style={{
          position: 'absolute', top: -80, right: -60,
          width: 240, height: 240, borderRadius: '50%',
          background: `radial-gradient(circle, ${A.color}44 0%, transparent 70%)`,
          filter: 'blur(30px)', pointerEvents: 'none',
          animation: 'ic-float-corner 8s ease-in-out infinite',
        }} />

        {/* Nav row: ← back · ARENAS · WEEK 16 · spacer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative',
        }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Back to Arenas"
            style={iconBtnStyle}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>

          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10, color: TOKENS.mute, letterSpacing: 1.5,
          }}>
            ARENAS · WEEK 16
          </span>

          {/* Right spacer — matches back button width for optical centering */}
          <div style={{ width: 36 }} />
        </div>

        {/* Category headline */}
        <h1 style={{
          margin: '20px 0 4px',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 28, fontWeight: 700, color: TOKENS.text,
          letterSpacing: -0.6, position: 'relative',
        }}>
          {A.tag.toUpperCase()}
          {' · '}
          <span style={{ color: A.color }}>{A.name.toUpperCase()}</span>
        </h1>

        <div style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 10, color: TOKENS.mute2, letterSpacing: 1.2,
        }}>
          WK 16 · RESETS APR 30
        </div>
      </div>

      {/* ── Scrollable rankings ─────────────────────────────────────────────── */}
      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 8px' }}
      >
        {data.users.length === 0 ? (
          /* Empty state — defensive; shouldn't happen with mock data */
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            paddingTop: 60,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 15, color: TOKENS.mute, textAlign: 'center',
          }}>
            No rankings yet. Be first.
          </div>
        ) : (
          <>
            {/* Creators Club label */}
            <div style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 10, color: TOKENS.gold, letterSpacing: 1.5, marginBottom: 8,
            }}>
              CREATORS CLUB · TOP 5
            </div>

            {/* Top 5 rows — gold backdrop */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {top5.map((user, i) => (
                <LeaderRow key={user.id} user={user} rank={i + 1} isTop5 />
              ))}
            </div>

            {/* Separator */}
            {rest.length > 0 && <RankSeparator />}

            {/* Ranks 6+ — normal backdrop */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {rest.map((user, i) => (
                <LeaderRow key={user.id} user={user} rank={i + 6} isTop5={false} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── YOUR RANK — pinned, non-scrolling ──────────────────────────────── */}
      <YourRankCard
        yourRank={data.yourRank}
        yourScore={data.yourScore}
        yourChange={data.yourChange}
        agentColor={A.color}
      />
    </div>
  );
}
