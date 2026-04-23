// ArenasHubScreen — Level 1 of the 2-level Leaderboard hub.
// Route: /leaderboard (replaces old LeaderboardScreen)
//
// Architecture: six category cards (one per agent) → tapping navigates to
// /leaderboard/:category (CategoryLeaderboardScreen). Agents are CATEGORIES
// and JUDGES, not competitors. Real users compete WITHIN each category.
//
// BottomNav is intentionally absent — MobileLayout provides it.

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AGENTS, AGENT_ORDER, TOKENS } from '@/lib/design-tokens';
import { AgentDot, LivePulse } from '@/components/primitives';
import { fmtCompact } from '@/lib/mock-data';
import { LEADERBOARD_DATA, type CategoryAgentId } from '@/lib/leaderboard-mock';

// ─── Category card ─────────────────────────────────────────────────────────────

function CategoryCard({
  agentId,
  onClick,
}: {
  agentId: CategoryAgentId;
  onClick: () => void;
}) {
  const A = AGENTS[agentId];
  const data = LEADERBOARD_DATA[agentId];
  const top3 = data.users.slice(0, 3);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? A.color + '44' : TOKENS.line}`,
        borderRadius: 14,
        padding: '14px 16px',
        cursor: 'pointer',
        transform: hovered ? 'scale(1.01)' : 'scale(1)',
        transition: 'transform 200ms cubic-bezier(.2,.8,.2,1), border-color 200ms ease',
        userSelect: 'none',
      }}
    >
      {/* Agent dot */}
      <AgentDot agent={agentId} size={44} clickable={false} />

      {/* Middle — name, subtitle, avatar stack */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14, fontWeight: 600, color: TOKENS.text,
          letterSpacing: -0.1,
        }}>
          {A.tag.toUpperCase()} · {A.name.toUpperCase()}
        </div>
        <div style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 10, color: TOKENS.mute2, letterSpacing: 1.2, marginTop: 3,
        }}>
          {fmtCompact(data.activeUsers)} ACTIVE · +{data.weeklyGrowthPct}%
        </div>

        {/* Top 3 stacked avatar circles */}
        <div style={{ display: 'flex', marginTop: 9 }}>
          {top3.map((u, i) => (
            <div
              key={u.id}
              style={{
                width: 24, height: 24, borderRadius: '50%',
                background: TOKENS.line2,
                border: `2px solid ${TOKENS.bg}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 8.5, fontWeight: 700, color: TOKENS.text,
                marginLeft: i > 0 ? -8 : 0,
                position: 'relative', zIndex: 3 - i,
                flexShrink: 0,
              }}
            >
              {u.initials}
            </div>
          ))}
        </div>
      </div>

      {/* Right — YOUR rank + chevron */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end', gap: 6, flexShrink: 0,
      }}>
        {data.yourRank !== null ? (
          <div style={{ textAlign: 'right', lineHeight: 1 }}>
            <span style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 13, fontWeight: 700, color: A.color,
            }}>
              #{data.yourRank}
            </span>
            {data.yourChange !== null && data.yourChange !== 0 && (
              <span style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 9.5,
                color: data.yourChange > 0 ? '#2A9D8F' : TOKENS.down,
                marginLeft: 5,
              }}>
                {data.yourChange > 0 ? '▲' : '▼'}{Math.abs(data.yourChange)}
              </span>
            )}
          </div>
        ) : (
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 9, color: TOKENS.mute3, letterSpacing: 1,
          }}>
            UNRANKED
          </span>
        )}

        {/* Chevron */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 18l6-6-6-6"
            stroke={TOKENS.mute3}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

// ─── Countdown urgency banner ──────────────────────────────────────────────────

function CountdownBanner({ daysLeft }: { daysLeft: number }) {
  return (
    <div style={{
      background: 'rgba(212,175,55,0.06)',
      border: `1px solid ${TOKENS.gold}44`,
      borderRadius: 14,
      padding: '14px 16px',
    }}>
      <div style={{
        fontFamily: 'ui-monospace, monospace',
        fontSize: 10, color: TOKENS.gold, letterSpacing: 1.4,
      }}>
        CREATORS CLUB · DECIDES APR 30
      </div>
      <div style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 24, fontWeight: 700, color: TOKENS.text,
        margin: '8px 0 5px',
        textShadow: `0 0 24px ${TOKENS.gold}66`,
      }}>
        {daysLeft} {daysLeft === 1 ? 'DAY' : 'DAYS'} LEFT
      </div>
      <div style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 13, color: TOKENS.mute,
      }}>
        Top 5 per category unlock the Creators Club
      </div>
    </div>
  );
}

// ─── Featured creator card ─────────────────────────────────────────────────────

function FeaturedCreatorCard() {
  // TODO: wire up onClick → navigate('/profile/:handle') once user profile routes exist
  return (
    <div style={{
      marginTop: 16,
      background: 'rgba(212,175,55,0.05)',
      border: `1px solid ${TOKENS.gold}33`,
      borderRadius: 14,
      padding: '14px 16px',
    }}>
      <div style={{
        fontFamily: 'ui-monospace, monospace',
        fontSize: 10, color: TOKENS.gold, letterSpacing: 1.5, marginBottom: 12,
      }}>
        THIS WEEK'S GRADUATE
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <AgentDot agent="BARON" size={36} clickable={false} />
        <div style={{ flex: 1 }}>
          <span style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 15, fontWeight: 600, color: TOKENS.text,
          }}>
            @devon_w
          </span>
          {' '}
          <span style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 14, color: TOKENS.mute,
          }}>
            built @YieldSense
          </span>
        </div>
      </div>
      <div style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 13, color: TOKENS.mute, marginTop: 8,
      }}>
        Now advising 2 hedge funds
      </div>
    </div>
  );
}

// ─── ArenasHubScreen ──────────────────────────────────────────────────────────

export function ArenasHubScreen() {
  const navigate = useNavigate();

  // Compute days remaining until Creators Club decision (Apr 30, 2026)
  const daysLeft = useMemo(() => {
    const target = new Date('2026-04-30T00:00:00');
    const now = new Date();
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, []);

  const categories = AGENT_ORDER.filter(
    (id): id is CategoryAgentId => id !== 'ALL',
  );

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: TOKENS.bg, overflow: 'hidden',
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: 'calc(20px + var(--ic-top-inset,0px)) 20px 12px',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10, color: TOKENS.mute, letterSpacing: 1.8,
          }}>
            LEADERBOARD · WK 16
          </span>
          <LivePulse color={TOKENS.gold} label="LIVE" />
        </div>
        <h1 style={{
          margin: '8px 0 0',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 44, fontWeight: 700, color: TOKENS.text,
          letterSpacing: -1.5, lineHeight: 1,
        }}>
          ARENAS
        </h1>
      </div>

      {/* ── Scrollable body ────────────────────────────────────────────────── */}
      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '0 20px 120px' }}
      >
        {/* Countdown urgency banner */}
        <CountdownBanner daysLeft={daysLeft} />

        {/* Six category cards */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12,
        }}>
          {categories.map((agentId) => (
            <CategoryCard
              key={agentId}
              agentId={agentId}
              onClick={() => navigate(`/leaderboard/${agentId}`)}
            />
          ))}
        </div>

        {/* Featured creator */}
        <FeaturedCreatorCard />
      </div>
    </div>
  );
}
