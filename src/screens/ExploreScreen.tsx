// ExploreScreen — Discovery hub, business-model-aligned rebuild.
// Route: /explore
//
// Replaces PlaceholderScreen at /explore. Discards the prototype's
// "agents as competitors" AGENTS + RISING sections; replaces with:
//   CATEGORIES — agents as category judges, drive users to Arena rankings
//   RISING     — real users who climbed most this week per category
//   HOT IN TECH— personalised slice for taylor.alpha's strongest category
//   OPPORTUNITY ZONES — unranked/low-rank categories to suggest entry
//
// BottomNav is intentionally absent — MobileLayout provides it.
// Search bar is disabled for v1 (TODO: wire to backend search API).
// Follow buttons persist to follows table via useFollow context.

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { AGENTS, AGENT_ORDER, TOKENS } from '@/lib/design-tokens';
import { AgentDot, LivePulse, Sparkline, PlaceholderImg } from '@/components/primitives';
import { fmtCompact, MOCK_USERS } from '@/lib/mock-data';
import { LEADERBOARD_DATA, type CategoryAgentId } from '@/lib/leaderboard-mock';
import { usePosts, type PostWithAgent } from '../hooks/usePosts';
import { useFollow } from '../hooks/useFollow';
import { Skeleton } from '@/components/states';

// ─── Module-level constants (pure derivations from imported data) ─────────────

const CATEGORY_IDS = AGENT_ORDER.filter(
  (id): id is CategoryAgentId => id !== 'ALL',
);

// One top climber per category — highest positive change value
const TOP_CLIMBERS = CATEGORY_IDS.map((agentId) => {
  const users = LEADERBOARD_DATA[agentId].users;
  const top = users.reduce(
    (best, u) => (u.change > best.change ? u : best),
    users[0],
  );
  return { agentId, user: top };
}).filter(({ user }) => user.change > 0);

// Opportunity zones: categories where taylor.alpha is unranked or has low rank,
// ordered by lowest active user count (easiest to climb).
// v1 hardcoded per mock data: PULSE (unranked, 2,104), ATLAS (#89, 1,567), BLITZ (#47, 3,890).
// Sort by activeUsers ascending so the most accessible comes first.
const OPPORTUNITY_ZONES: CategoryAgentId[] = (['ATLAS', 'PULSE', 'BLITZ'] as CategoryAgentId[]);

// Sparkline shape reused across all RISING rows (static for v1)
const CLIMB_SPARK = [2, 3, 2, 4, 5, 6, 7, 8, 10, 12, 14] as const;

// ─── CategoryCard ─────────────────────────────────────────────────────────────
// File-local; not shared with other screens.

interface CategoryCardProps {
  agentId: CategoryAgentId;
  isFollowed: boolean;
  onToggleFollow: () => void;
  onNavigate: () => void;
}

function CategoryCard({ agentId, isFollowed, onToggleFollow, onNavigate }: CategoryCardProps) {
  const A = AGENTS[agentId];
  const data = LEADERBOARD_DATA[agentId];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onNavigate}
      onKeyDown={(e) => e.key === 'Enter' && onNavigate()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: 14, padding: '16px 14px',
        background: TOKENS.bg1,
        border: `1px solid ${hovered ? A.color + '55' : TOKENS.line}`,
        cursor: 'pointer', overflow: 'hidden',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 220ms cubic-bezier(.2,.8,.2,1), border-color 220ms ease',
        userSelect: 'none',
      }}
    >
      {/* Ambient agent-color corner orb */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${A.color}55 0%, transparent 70%)`,
        filter: 'blur(10px)', pointerEvents: 'none',
      }} />

      {/* Agent identity row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <AgentDot agent={agentId} size={32} clickable={false} />
        <div style={{ lineHeight: 1.15 }}>
          <div style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 14, fontWeight: 600, color: TOKENS.text,
          }}>
            {A.name}
          </div>
          <div style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 9, color: TOKENS.mute2, letterSpacing: 1.2, marginTop: 2,
          }}>
            {A.tag.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats + follow button */}
      <div style={{
        marginTop: 12, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'relative', gap: 8,
      }}>
        <span style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 9.5, color: TOKENS.mute, letterSpacing: 0.4,
          whiteSpace: 'nowrap',
        }}>
          {fmtCompact(data.activeUsers)} · +{data.weeklyGrowthPct}%
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); onToggleFollow(); }}
          style={{
            flexShrink: 0,
            background: isFollowed ? 'transparent' : `${A.color}1a`,
            color: A.color,
            border: `1px solid ${isFollowed ? A.color : A.color + '55'}`,
            borderRadius: 999, padding: '5px 10px', cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 9.5, fontWeight: 600, letterSpacing: 0.3,
            transition: 'background 200ms ease, border-color 200ms ease',
          }}
        >
          {isFollowed ? 'FOLLOWING' : 'FOLLOW'}
        </button>
      </div>
    </div>
  );
}

// ─── ExploreScreen ────────────────────────────────────────────────────────────

// 7-day ISO timestamp for trending window
const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

export function ExploreScreen() {
  const navigate = useNavigate();
  const { isFollowing, followAgent, unfollowAgent } = useFollow();

  // TRENDING: top 3 posts by likes in the last 7 days
  const { posts: trendingRaw, loading: trendingLoading } = usePosts(
    undefined,
    useMemo(() => ({ orderBy: 'likes.desc', limit: 3, since: SEVEN_DAYS_AGO }), []),
  );

  // HOT IN TECH: top 3 Circuit posts by likes
  const { posts: techRaw, loading: techLoading } = usePosts(
    'circuit',
    useMemo(() => ({ orderBy: 'likes.desc', limit: 3 }), []),
  );

  function toggleFollow(id: CategoryAgentId) {
    if (isFollowing(id.toLowerCase())) {
      unfollowAgent(id.toLowerCase());
    } else {
      followAgent(id.toLowerCase());
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: TOKENS.bg, overflow: 'hidden',
    }}>

      {/* ── Section 1: Header ───────────────────────────────────────────────── */}
      <div style={{ padding: 'calc(10px + var(--ic-top-inset,0px)) 20px 8px' }}>
        <div style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: 10, color: TOKENS.mute, letterSpacing: 1.8, marginBottom: 6,
        }}>
          DISCOVER
        </div>
        <h1 style={{
          margin: 0,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 36, fontWeight: 700, color: TOKENS.text,
          letterSpacing: -1.2, lineHeight: 1,
        }}>
          Explore
        </h1>
      </div>

      {/* ── Section 2: Search bar (disabled for v1) ──────────────────────── */}
      <div style={{ padding: '16px 20px 8px', opacity: 0.45, pointerEvents: 'none' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: TOKENS.bg2,
          border: `1px solid ${TOKENS.line2}`,
          borderRadius: 12, padding: '12px 14px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke={TOKENS.mute} strokeWidth="1.7" />
            <path d="M16 16l5 5" stroke={TOKENS.mute} strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <span style={{
            flex: 1,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 14, color: TOKENS.mute2,
          }}>
            Search coming soon
          </span>
          <span style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 9,
            color: TOKENS.mute3, letterSpacing: 1,
            border: `1px solid ${TOKENS.line2}`,
            padding: '2px 6px', borderRadius: 4, flexShrink: 0,
          }}>
            ⌘K
          </span>
        </div>
      </div>

      {/* ── Sections 3–7: Scrollable body ───────────────────────────────────── */}
      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '8px 0 120px' }}
      >

        {/* ── Section 3: TRENDING ───────────────────────────────────────────── */}
        <div style={{ padding: '16px 20px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10, color: TOKENS.text, letterSpacing: 1.8,
          }}>
            TRENDING
          </span>
          <LivePulse color={TOKENS.gold} label="HOT" />
          <span style={{ flex: 1, height: 1, background: TOKENS.line, marginLeft: 6 }} />
        </div>

        {trendingLoading ? (
          <div style={{ display: 'flex', gap: 12, padding: '0 20px 8px' }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="rounded-[14px] min-w-[240px] h-[220px] shrink-0" />
            ))}
          </div>
        ) : trendingRaw.length > 0 ? (
          <div
            className="no-scrollbar"
            style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px 8px', scrollbarWidth: 'none' }}
          >
            {trendingRaw.map((item, i) => (
              <TrendingCard key={item.post.id} item={item} rank={i + 1} onOpen={() => navigate(`/post/${item.post.id}`)} />
            ))}
          </div>
        ) : null}

        {/* ── Section 4: CATEGORIES grid ────────────────────────────────────── */}
        <div style={{ padding: '24px 20px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10, color: TOKENS.text, letterSpacing: 1.8,
          }}>
            CATEGORIES
          </span>
          <span style={{ flex: 1, height: 1, background: TOKENS.line, marginLeft: 6 }} />
          <span style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 10, color: TOKENS.mute2,
          }}>
            06
          </span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          padding: '0 20px',
        }}>
          {CATEGORY_IDS.map((id) => (
            <CategoryCard
              key={id}
              agentId={id}
              isFollowed={isFollowing(id.toLowerCase())}
              onToggleFollow={() => toggleFollow(id)}
              onNavigate={() => navigate(`/leaderboard/${id}`)}
            />
          ))}
        </div>

        {/* ── Section 5: RISING — top climbers this week ────────────────────── */}
        <div style={{ padding: '24px 20px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10, color: TOKENS.text, letterSpacing: 1.8,
          }}>
            RISING · TOP CLIMBERS THIS WEEK
          </span>
          <span style={{ flex: 1, height: 1, background: TOKENS.line, marginLeft: 6 }} />
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TOP_CLIMBERS.map(({ agentId, user }, i) => {
            const A = AGENTS[agentId];
            const hasProfle = Boolean(MOCK_USERS[user.handle]);
            return (
              // Tappable for handles that exist in MOCK_USERS; others are TODO when profiles exist
              <div
                key={`${agentId}-${user.id}`}
                onClick={hasProfle ? () => navigate('/profile/' + user.handle) : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${TOKENS.line}`,
                  cursor: hasProfle ? 'pointer' : 'default',
                }}
              >
                {/* Rank */}
                <span style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 10, color: TOKENS.mute2, width: 18, flexShrink: 0,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* AgentDot — category identity, intentionally not a user avatar */}
                <AgentDot agent={agentId} size={30} clickable={false} />

                {/* Middle: handle + category tag */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 13, fontWeight: 600, color: TOKENS.text,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    @{user.handle}
                  </div>
                  <div style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 9, color: A.color, letterSpacing: 1.2, marginTop: 2,
                  }}>
                    {A.tag.toUpperCase()}
                  </div>
                </div>

                {/* Sparkline */}
                <Sparkline
                  points={[...CLIMB_SPARK]}
                  color={A.color}
                  width={60}
                  height={22}
                />

                {/* Right: score + delta */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 11, color: TOKENS.text,
                  }}>
                    {user.signalScore.toLocaleString()}
                  </div>
                  <div style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 10, color: '#2A9D8F', letterSpacing: 0.5, marginTop: 2,
                  }}>
                    ▲ {user.change}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Section 6: HOT IN TECH — personalised slice ───────────────────── */}
        {/* v1 hardcoded to CIRCUIT (taylor.alpha's strongest category, rank 7).  */}
        {/* TODO: pull user's top category from profile + backend-filtered posts.  */}
        {/* Renders if >= 1 post; spec ideally shows 2-3 but mock has 1 per agent. */}
        {techLoading ? (
          <>
            <div style={{ padding: '24px 20px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 10, color: TOKENS.text, letterSpacing: 1.8,
              }}>
                HOT IN TECH
              </span>
              <span style={{ flex: 1, height: 1, background: TOKENS.line, marginLeft: 6 }} />
              <span style={{
                fontFamily: 'ui-monospace, monospace', fontSize: 9,
                color: AGENTS.CIRCUIT.color, letterSpacing: 1,
              }}>
                CIRCUIT
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '0 20px 8px' }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="rounded-[14px] min-w-[200px] h-[190px] shrink-0" />
              ))}
            </div>
          </>
        ) : techRaw.length > 0 ? (
          <>
            <div style={{ padding: '24px 20px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 10, color: TOKENS.text, letterSpacing: 1.8,
              }}>
                HOT IN TECH
              </span>
              <span style={{ flex: 1, height: 1, background: TOKENS.line, marginLeft: 6 }} />
              <span style={{
                fontFamily: 'ui-monospace, monospace', fontSize: 9,
                color: AGENTS.CIRCUIT.color, letterSpacing: 1,
              }}>
                CIRCUIT
              </span>
            </div>

            <div
              className="no-scrollbar"
              style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 20px 8px', scrollbarWidth: 'none' }}
            >
              {techRaw.map((item, i) => (
                <TechCard key={item.post.id} item={item} rank={i + 1} onOpen={() => navigate(`/post/${item.post.id}`)} />
              ))}
            </div>
          </>
        ) : null}

        {/* ── Section 7: OPPORTUNITY ZONES ─────────────────────────────────── */}
        {/* Surfaces categories where taylor.alpha has no/low rank = easier entry. */}
        {/* v1: ATLAS (1,567 active), PULSE (2,104, unranked), BLITZ (3,890, rank 47). */}
        <div style={{ padding: '24px 20px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10, color: TOKENS.text, letterSpacing: 1.8,
          }}>
            OPPORTUNITY · EASIER TO RANK
          </span>
          <span style={{ flex: 1, height: 1, background: TOKENS.line, marginLeft: 6 }} />
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {OPPORTUNITY_ZONES.map((agentId) => {
            const A = AGENTS[agentId];
            const data = LEADERBOARD_DATA[agentId];
            return (
              <div
                key={agentId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: TOKENS.bg1,
                  border: `1px solid ${TOKENS.line}`,
                  borderRadius: 14, padding: 14,
                }}
              >
                <AgentDot agent={agentId} size={28} clickable={false} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 13, fontWeight: 600, color: TOKENS.text,
                  }}>
                    {A.tag.toUpperCase()} · {A.name.toUpperCase()}
                  </div>
                  <div style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 9.5, color: TOKENS.mute, letterSpacing: 0.6, marginTop: 3,
                  }}>
                    Only {data.activeUsers.toLocaleString()} active users — climb easier
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/leaderboard/${agentId}`)}
                  style={{
                    background: `${A.color}1a`,
                    color: A.color,
                    border: `1px solid ${A.color}55`,
                    borderRadius: 999, padding: '7px 14px', cursor: 'pointer',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                    flexShrink: 0,
                  }}
                >
                  ENTER
                </button>
              </div>
            );
          })}
        </div>

      </div>{/* end scrollable body */}
    </div>
  );
}

// ─── TrendingCard ─────────────────────────────────────────────────────────────
// Renders a single trending post card (240px wide) with real Supabase data.

function TrendingCard({ item, rank, onOpen }: { item: PostWithAgent; rank: number; onOpen: () => void }) {
  const { post, agent } = item;
  const agentId = post.agentId.toUpperCase() as import('@/lib/design-tokens').AgentId;
  return (
    <div
      onClick={onOpen}
      style={{
        minWidth: 240, maxWidth: 240, borderRadius: 14, overflow: 'hidden',
        cursor: 'pointer', border: `1px solid ${TOKENS.line}`,
        background: TOKENS.bg1, position: 'relative',
        transition: 'transform 220ms cubic-bezier(.2,.8,.2,1)',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.015)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <div style={{
        position: 'absolute', top: 10, left: 10, zIndex: 2,
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
        padding: '4px 8px', borderRadius: 999,
      }}>
        <AgentDot agent={agentId} size={16} clickable={false} />
        <span style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 11, fontWeight: 600, color: '#fff',
        }}>
          {agent.name}
        </span>
      </div>

      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 2,
        fontFamily: 'ui-monospace, monospace', fontSize: 9,
        background: TOKENS.gold, color: '#0A0A0A',
        padding: '3px 6px', borderRadius: 4, letterSpacing: 0.6,
        fontWeight: 700,
      }}>
        #{rank}
      </div>

      {post.image ? (
        <img src={post.image} alt={post.headline} loading="lazy"
          style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
      ) : (
        <PlaceholderImg kind="grid" agent={agentId} height={140} />
      )}

      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 13, fontWeight: 600, color: TOKENS.text,
          lineHeight: 1.3, letterSpacing: -0.1,
          display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.headline}
        </div>
        <div style={{
          display: 'flex', gap: 12, marginTop: 10,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 9.5, color: TOKENS.mute2, letterSpacing: 0.8,
        }}>
          <span>{fmtCompact(post.reactions)} REACTS</span>
          <span>{fmtCompact(post.replies)} REPLIES</span>
        </div>
      </div>
    </div>
  );
}

// ─── TechCard ─────────────────────────────────────────────────────────────────
// Renders a single HOT IN TECH card (200px wide) with real Supabase data.

function TechCard({ item, rank, onOpen }: { item: PostWithAgent; rank: number; onOpen: () => void }) {
  const { post, agent } = item;
  const agentId = post.agentId.toUpperCase() as import('@/lib/design-tokens').AgentId;
  return (
    <div
      onClick={onOpen}
      style={{
        minWidth: 200, maxWidth: 200, borderRadius: 14, overflow: 'hidden',
        cursor: 'pointer', border: `1px solid ${TOKENS.line}`,
        background: TOKENS.bg1, position: 'relative',
        transition: 'transform 220ms cubic-bezier(.2,.8,.2,1)',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.015)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <div style={{
        position: 'absolute', top: 10, left: 10, zIndex: 2,
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
        padding: '4px 8px', borderRadius: 999,
      }}>
        <AgentDot agent={agentId} size={14} clickable={false} />
        <span style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 10, fontWeight: 600, color: '#fff',
        }}>
          {agent.name}
        </span>
      </div>

      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 2,
        fontFamily: 'ui-monospace, monospace', fontSize: 8,
        background: AGENTS.CIRCUIT.color, color: '#0A0A0A',
        padding: '3px 5px', borderRadius: 4, letterSpacing: 0.6,
        fontWeight: 700,
      }}>
        #{rank}
      </div>

      {post.image ? (
        <img src={post.image} alt={post.headline} loading="lazy"
          style={{ width: '100%', height: 118, objectFit: 'cover', display: 'block' }} />
      ) : (
        <PlaceholderImg kind="grid" agent={agentId} height={118} />
      )}

      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 12, fontWeight: 600, color: TOKENS.text,
          lineHeight: 1.3, letterSpacing: -0.1,
          display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.headline}
        </div>
        <div style={{
          display: 'flex', gap: 10, marginTop: 8,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 9, color: TOKENS.mute2, letterSpacing: 0.8,
        }}>
          <span>{fmtCompact(post.reactions)} REACTS</span>
          <span>{fmtCompact(post.replies)} REPLIES</span>
        </div>
      </div>
    </div>
  );
}
