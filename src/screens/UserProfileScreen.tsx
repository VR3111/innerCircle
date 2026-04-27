// UserProfileScreen — view another user's or agent's profile
//
// Routes:
//   /profile/:handle  → user mode (lookup mock user by handle)
//   /agent/:agentId   → agent mode (lookup agent by id)
//
// Both render the same "viewing someone else's profile" layout.
// Agent mode differs only where specified: avatar, subtitle, stats, etc.

import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useMatch, Navigate } from 'react-router';
import { TOKENS, AGENTS as DESIGN_AGENTS, type AgentId } from '@/lib/design-tokens';
import { AgentDot } from '@/components/primitives';
import { SLMark } from '@/components/Logo';
import {
  MOCK_USERS, CURRENT_USER, DM_THREADS,
  getPostsForUser, fmtCompact,
} from '@/lib/mock-data';
import { isFollowing, setFollowing as persistFollowing } from '@/lib/follow-preferences';
import { useAgent } from '@/hooks/useAgent';
import { useAgentPosts } from '@/hooks/useAgentPosts';

const FONT = 'Inter, system-ui, sans-serif';
const MONO = 'ui-monospace, monospace';

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

export function UserProfileScreen() {
  const navigate = useNavigate();

  // ── Route detection ────────────────────────────────────────────────────────
  const agentMatch = useMatch('/agent/:agentId');
  const { handle: rawHandle } = useParams<{ handle: string }>();
  const isAgentMode = agentMatch !== null;
  const agentId = (agentMatch?.params.agentId ?? '').toUpperCase() as AgentId;
  const agentIdLower = agentId.toLowerCase();
  const handle = rawHandle ?? '';

  // ── All hooks unconditionally ──────────────────────────────────────────────
  const [isPremium] = useState(() => localStorage.getItem('sl-premium') === '1');
  const [following, setFollowState] = useState(() =>
    isAgentMode ? false : isFollowing(handle),
  );
  const [followHovered, setFollowHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const signalCardRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [showSignalInfo, setShowSignalInfo] = useState(false);

  // ── User-mode data ─────────────────────────────────────────────────────────
  const user = isAgentMode ? null : MOCK_USERS[handle];
  const userPosts = useMemo(
    () => (user ? getPostsForUser(user) : []),
    [user?.handle],
  );

  // ── Agent-mode data ────────────────────────────────────────────────────────
  const designAgent = isAgentMode ? DESIGN_AGENTS[agentId] : null;
  const { agent: agentData, loading: agentLoading } = useAgent(agentIdLower);
  const { posts: agentPosts, loading: agentPostsLoading } = useAgentPosts(isAgentMode ? agentIdLower : null);

  // Close three-dot menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  // Close signal info popover on outside click
  useEffect(() => {
    if (!showSignalInfo) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !(popoverRef.current?.contains(target)) &&
        !(signalCardRef.current?.contains(target))
      ) setShowSignalInfo(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSignalInfo]);

  // ── Own-profile redirect (user mode only) ──────────────────────────────────
  if (!isAgentMode && handle === CURRENT_USER.handle) {
    return <Navigate to="/profile" replace />;
  }

  // ── 404: agent not found ───────────────────────────────────────────────────
  if (isAgentMode && !designAgent) {
    return (
      <div style={{
        position: 'absolute', inset: 0, background: TOKENS.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', fontFamily: FONT,
      }}>
        <div style={{
          fontFamily: MONO, fontSize: 12, letterSpacing: 1.4, color: TOKENS.mute,
        }}>AGENT NOT FOUND</div>
        <div style={{ fontSize: 14, color: TOKENS.mute2, marginTop: 8, textAlign: 'center' }}>
          {agentIdLower}
        </div>
        <button type="button" onClick={() => navigate(-1)} style={{
          marginTop: 16, background: 'none', border: 'none', color: TOKENS.mute2,
          cursor: 'pointer', fontFamily: FONT, fontSize: 14,
          textDecoration: 'underline', padding: 0,
        }}>Go back</button>
      </div>
    );
  }

  // ── 404: user not found ────────────────────────────────────────────────────
  if (!isAgentMode && !user) {
    return (
      <div style={{
        position: 'absolute', inset: 0, background: TOKENS.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', fontFamily: FONT,
      }}>
        <div style={{
          fontFamily: MONO, fontSize: 12, letterSpacing: 1.4, color: TOKENS.mute,
        }}>USER NOT FOUND</div>
        <div style={{ fontSize: 14, color: TOKENS.mute2, marginTop: 8, textAlign: 'center' }}>
          @{handle}
        </div>
        <button type="button" onClick={() => navigate(-1)} style={{
          marginTop: 16, background: 'none', border: 'none', color: TOKENS.mute2,
          cursor: 'pointer', fontFamily: FONT, fontSize: 14,
          textDecoration: 'underline', padding: 0,
        }}>Go back</button>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  // User-mode values (safe: user is non-null here in user mode)
  const displayedFollowers = user ? user.followers + (following ? 1 : 0) : 0;
  const visibleBadges = user
    ? user.arenaBadges.filter(b => b.rank <= 100).slice(0, 3)
    : [];

  // Find DM thread for this handle (only relevant when premium, user mode)
  const dmThread = (!isAgentMode && isPremium)
    ? DM_THREADS.find(t => t.kind === 'user' && t.userHandle === handle)
    : undefined;
  const hasThread = dmThread !== undefined;

  // Avatar ring style (user mode)
  const avatarRingStyle: React.CSSProperties = user?.creatorsClub
    ? { boxShadow: `0 0 0 2.5px ${TOKENS.gold}, 0 0 20px rgba(212,175,55,0.3)` }
    : user?.isPremium
      ? { boxShadow: `0 0 0 2px ${TOKENS.gold}` }
      : { boxShadow: '0 0 0 1.5px rgba(255,255,255,0.10)' };

  // Agent-mode values — live from Supabase
  const agentFollowers = agentData?.followers ?? 0;
  const agentPostCount = agentPosts.length;
  const agentDataReady = isAgentMode ? !agentLoading && !agentPostsLoading : true;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleFollow = () => {
    const next = !following;
    setFollowState(next);
    if (!isAgentMode) {
      persistFollowing(handle, next);
    }
  };

  const handleMessage = () => {
    if (!isPremium) {
      navigate('/paywall');
      return;
    }
    if (dmThread) {
      navigate('/dm/' + dmThread.id);
    }
  };

  // ── Follow button style ───────────────────────────────────────────────────
  const followBtnStyle: React.CSSProperties = following
    ? {
        flex: 1, height: 42, borderRadius: 12,
        background: followHovered
          ? 'linear-gradient(135deg, #F9DC8F 0%, #C9A227 100%)'
          : 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)',
        border: 'none',
        color: '#0A0A0A',
        fontFamily: FONT, fontSize: 14, fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 0 12px rgba(212,175,55,0.25)',
        transition: 'background 150ms ease',
      }
    : {
        flex: 1, height: 42, borderRadius: 12,
        background: followHovered ? 'rgba(212,175,55,0.08)' : 'transparent',
        border: `1.5px solid ${TOKENS.gold}`,
        color: TOKENS.gold,
        fontFamily: FONT, fontSize: 14, fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 150ms ease',
      };

  // Header title
  const headerTitle = isAgentMode ? designAgent!.name : 'Profile';

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: TOKENS.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: FONT,
    }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 'calc(18px + var(--ic-top-inset,0px)) 20px 8px',
        borderBottom: `1px solid ${TOKENS.line}`,
        flexShrink: 0,
      }}>
        <button type="button" onClick={() => navigate(-1)} style={iconBtnStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <span style={{
          flex: 1, textAlign: 'center',
          fontFamily: FONT, fontSize: 17, fontWeight: 600, color: TOKENS.text,
        }}>
          {headerTitle}
        </span>

        {/* Three-dot menu — Block + Report (non-functional) */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button type="button" onClick={() => setShowMenu(v => !v)} style={iconBtnStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="5"  cy="12" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
            </svg>
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute', top: 42, right: 0,
              background: TOKENS.bg1,
              border: `1px solid ${TOKENS.line}`,
              borderRadius: 10, padding: 6, minWidth: 160, zIndex: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}>
              <MenuRow label="Block" danger onClick={() => setShowMenu(false)} />
              <MenuRow label="Report" onClick={() => setShowMenu(false)} />
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}
      >

        {/* ── Identity block ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '28px 20px 16px',
        }}>
          {/* Avatar */}
          {isAgentMode ? (
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 0 2.5px ${designAgent!.color}, 0 0 20px ${designAgent!.color}4d`,
            }}>
              <AgentDot agent={agentId} size={96} clickable={false} />
            </div>
          ) : (
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2a2a2a, #121212)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...avatarRingStyle,
            }}>
              <span style={{
                fontFamily: FONT, fontSize: 36, fontWeight: 700, color: TOKENS.text,
              }}>
                {user!.avatarInitials}
              </span>
            </div>
          )}

          {/* Display name */}
          <div style={{
            marginTop: 12,
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: FONT, fontSize: 22, fontWeight: 700, color: TOKENS.text,
            textAlign: 'center',
          }}>
            {isAgentMode ? designAgent!.name : user!.displayName}
            {/* Gold star for agents */}
            {isAgentMode && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill={TOKENS.gold}>
                <path d="M12 2l2.5 4.5 5 .8-3.5 3.5.8 5L12 13.5l-4.8 2.3.8-5L4.5 7.3l5-.8L12 2z"/>
              </svg>
            )}
          </div>

          {/* Subtitle */}
          {isAgentMode ? (
            <div style={{
              marginTop: 2,
              fontFamily: FONT, fontSize: 13, color: TOKENS.mute2,
              textAlign: 'center',
            }}>
              AGENT · {designAgent!.tag.toUpperCase()}
            </div>
          ) : (
            <div style={{
              marginTop: 2,
              fontFamily: FONT, fontSize: 13, color: TOKENS.mute2,
              textAlign: 'center',
            }}>
              @{user!.handle}
            </div>
          )}

          {/* Inner Circle label — user mode only */}
          {!isAgentMode && user!.isPremium && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <SLMark size={14} color={TOKENS.gold} />
              <span style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: 1.4, color: TOKENS.gold,
              }}>INNER CIRCLE</span>
            </div>
          )}

          {/* Creators Club label — user mode only */}
          {!isAgentMode && user!.creatorsClub && (
            <div style={{
              marginTop: 3,
              fontFamily: MONO, fontSize: 9, letterSpacing: 1.4, color: TOKENS.gold,
              textAlign: 'center',
            }}>
              CREATORS CLUB · {user!.creatorsClub.category}
            </div>
          )}

          {/* Bio */}
          <div style={{
            marginTop: 10,
            fontFamily: FONT, fontSize: 14, color: TOKENS.mute,
            lineHeight: 1.5, textAlign: 'center',
            maxWidth: 320,
          }}>
            {isAgentMode ? designAgent!.tagline : user!.bio}
          </div>
        </div>

        {/* ── Action buttons ──────────────────────────────────────────────────── */}
        <div style={{ marginTop: 16, padding: '0 20px' }}>
          <div style={{ display: 'flex', gap: 10 }}>

            {/* Follow / Following toggle */}
            <button
              type="button"
              onClick={toggleFollow}
              onMouseEnter={() => setFollowHovered(true)}
              onMouseLeave={() => setFollowHovered(false)}
              style={followBtnStyle}
            >
              {following ? 'Following' : 'Follow'}
            </button>

            {/* Message button */}
            {isAgentMode ? (
              <div style={{
                flex: 1, height: 42, borderRadius: 12,
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.3)',
                color: TOKENS.gold,
                fontFamily: FONT, fontSize: 14, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2"
                    stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Message
              </div>
            ) : isPremium && !hasThread ? (
              <div style={{
                flex: 1, height: 42, borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${TOKENS.line}`,
                color: TOKENS.mute2,
                fontFamily: FONT, fontSize: 14, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'not-allowed', userSelect: 'none',
              }}>
                Message unavailable
              </div>
            ) : (
              <button
                type="button"
                onClick={handleMessage}
                style={{
                  flex: 1, height: 42, borderRadius: 12,
                  background: isPremium ? 'rgba(255,255,255,0.04)' : 'rgba(212,175,55,0.08)',
                  border: `1px solid ${isPremium ? TOKENS.line : 'rgba(212,175,55,0.3)'}`,
                  color: isPremium ? TOKENS.text : TOKENS.gold,
                  fontFamily: FONT, fontSize: 14, fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {!isPremium && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2"
                      stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
                Message
              </button>
            )}
          </div>
        </div>

        {/* ── Signal score — user mode only ───────────────────────────────────── */}
        {!isAgentMode && (
          <div style={{ marginTop: 18, padding: '0 20px', position: 'relative' }}>
            <div
              ref={signalCardRef}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${TOKENS.line}`,
                borderRadius: 14,
                padding: '14px 18px',
              }}
            >
              <div>
                <div style={{
                  fontFamily: MONO, fontSize: 10, letterSpacing: 1.4, color: TOKENS.mute2,
                }}>SIGNAL SCORE</div>
                <div style={{
                  fontFamily: FONT, fontSize: 28, fontWeight: 700, color: TOKENS.gold,
                  marginTop: 2,
                }}>
                  {user!.signalScore.toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSignalInfo(v => !v)}
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${TOKENS.line2}`,
                  cursor: 'pointer', color: TOKENS.mute2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: MONO, fontSize: 12, fontWeight: 700,
                  flexShrink: 0,
                }}
              >?</button>
            </div>

            {showSignalInfo && (
              <div
                ref={popoverRef}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)', left: 0, right: 0,
                  zIndex: 10,
                  background: TOKENS.bg1,
                  border: `1px solid ${TOKENS.line2}`,
                  borderRadius: 12,
                  padding: '12px 14px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
              >
                <div style={{
                  fontFamily: FONT, fontSize: 13, color: TOKENS.mute, lineHeight: 1.5,
                }}>
                  signalScore reflects activity across agent categories: posts, engagement, streaks, and retention. Updated daily.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Stats row ──────────────────────────────────────────────────────── */}
        <div style={{ marginTop: isAgentMode ? 18 : 8, padding: '0 20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isAgentMode ? '1fr 1fr' : '1fr 1fr 1fr',
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${TOKENS.line}`,
            borderRadius: 14,
            padding: '14px 0',
          }}>
            {(isAgentMode
              ? [
                  { label: 'FOLLOWERS', value: agentDataReady ? fmtCompact(agentFollowers) : '—' },
                  { label: 'POSTS',     value: agentDataReady ? fmtCompact(agentPostCount) : '—' },
                ]
              : [
                  { label: 'FOLLOWING', value: user!.following.toLocaleString() },
                  { label: 'FOLLOWERS', value: displayedFollowers.toLocaleString() },
                  { label: 'POSTS',     value: user!.postCount.toLocaleString() },
                ]
            ).map(({ label, value }, i) => (
              <div
                key={label}
                style={{
                  textAlign: 'center',
                  borderLeft: i > 0 ? `1px solid ${TOKENS.line}` : 'none',
                }}
              >
                <div style={{
                  fontFamily: FONT, fontSize: 18, fontWeight: 700, color: TOKENS.text,
                }}>
                  {value}
                </div>
                <div style={{
                  fontFamily: MONO, fontSize: 10, letterSpacing: 1.2, color: TOKENS.mute2,
                  marginTop: 2,
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Arenas ─────────────────────────────────────────────────────────── */}
        {isAgentMode ? (
          // Agent mode: single arena card — the agent's own category
          <div style={{ marginTop: 20, padding: '0 20px' }}>
            <div style={{
              fontFamily: MONO, fontSize: 10, letterSpacing: 1.4, color: TOKENS.mute2,
              marginBottom: 8,
            }}>ARENAS</div>

            <div
              onClick={() => navigate(`/leaderboard/${agentIdLower}`)}
              style={{
                padding: '12px 14px', borderRadius: 12,
                background: designAgent!.color + '10',
                border: `1px solid ${designAgent!.color}33`,
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer',
              }}
            >
              <AgentDot agent={agentId} size={32} clickable={false} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: FONT, fontSize: 14, fontWeight: 600, color: TOKENS.text,
                }}>
                  {designAgent!.tag}
                </div>
                <div style={{
                  fontFamily: FONT, fontSize: 11, color: TOKENS.mute, marginTop: 2,
                }}>
                  {fmtCompact(agentFollowers)} followers
                </div>
              </div>
              <svg width="8" height="14" viewBox="0 0 8 14">
                <path d="M1 1l6 6-6 6" stroke={TOKENS.mute3} strokeWidth="2" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        ) : (
          // User mode: top 3 arena badges (rank ≤ 100)
          visibleBadges.length > 0 && (
            <div style={{ marginTop: 20, padding: '0 20px' }}>
              <div style={{
                fontFamily: MONO, fontSize: 10, letterSpacing: 1.4, color: TOKENS.mute2,
                marginBottom: 8,
              }}>ARENAS</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {visibleBadges.map(badge => {
                  const A = DESIGN_AGENTS[badge.agent];
                  return (
                    <div
                      key={badge.agent}
                      style={{
                        padding: '12px 14px', borderRadius: 12,
                        background: A.color + '10',
                        border: `1px solid ${A.color + '33'}`,
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}
                    >
                      <AgentDot agent={badge.agent} size={32} clickable={false} />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: FONT, fontSize: 14, fontWeight: 600, color: TOKENS.text,
                        }}>
                          {badge.categoryName}
                        </div>
                        <div style={{
                          fontFamily: FONT, fontSize: 11, color: TOKENS.mute, marginTop: 2,
                        }}>
                          Rank #{badge.rank} of {badge.total.toLocaleString()}
                        </div>
                      </div>
                      {badge.rank <= 5 && (
                        <span style={{
                          padding: '3px 8px', borderRadius: 4,
                          background: A.color + '26',
                          color: A.color,
                          fontFamily: MONO, fontSize: 8, letterSpacing: 1.2, fontWeight: 700,
                        }}>
                          CREATORS
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* ── Post grid ──────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 24 }}>
          <div style={{
            fontFamily: MONO, fontSize: 10, letterSpacing: 1.4, color: TOKENS.mute2,
            padding: '0 20px', marginBottom: 10,
          }}>
            POSTS
          </div>

          {isAgentMode ? (
            agentPostsLoading ? (
              <div style={{
                padding: '40px 20px', textAlign: 'center',
                fontFamily: MONO, fontSize: 11, color: TOKENS.mute2, letterSpacing: 1.4,
              }}>
                LOADING…
              </div>
            ) : agentPosts.length === 0 ? (
              <div style={{
                padding: '40px 20px', textAlign: 'center',
                fontFamily: MONO, fontSize: 11, color: TOKENS.mute2, letterSpacing: 1.4,
              }}>
                NO POSTS YET
              </div>
            ) : (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2,
              }}>
                {agentPosts.map((post, i) => (
                  <div
                    key={post.id}
                    onClick={() => navigate('/post/' + post.id)}
                    style={{ aspectRatio: '1 / 1', cursor: 'pointer', overflow: 'hidden' }}
                  >
                    <img
                      src={post.imageUrl}
                      alt=""
                      loading={i < 6 ? 'eager' : 'lazy'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                ))}
              </div>
            )
          ) : (
            user!.postCount === 0 ? (
              <div style={{
                padding: '40px 20px', textAlign: 'center',
                fontFamily: MONO, fontSize: 11, color: TOKENS.mute2, letterSpacing: 1.4,
              }}>
                NO POSTS YET
              </div>
            ) : (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2,
              }}>
                {userPosts.map(post => (
                  <div
                    key={post.id}
                    onClick={() => navigate('/post/' + post.id)}
                    style={{
                      aspectRatio: '1 / 1',
                      backgroundImage: `url(${post.thumbnailUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}

// ── MenuRow ── small helper for the three-dot dropdown ────────────────────────

function MenuRow({ label, onClick, danger }: {
  label: string; onClick: () => void; danger?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center',
        width: '100%', height: 36, padding: '8px 12px',
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: 'none', borderRadius: 6,
        cursor: 'pointer', textAlign: 'left',
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13,
        color: danger ? TOKENS.down : TOKENS.text,
        transition: 'background 100ms',
      }}
    >
      {label}
    </button>
  );
}
