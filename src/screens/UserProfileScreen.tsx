// UserProfileScreen — view another user's profile at /profile/:handle
//
// Part 2a scope:
//   ✅ Identity block (avatar ring, name, handle, IC/CC labels, bio)
//   ✅ Signal score card
//   ✅ Secondary stats (following / followers+1-if-followed / posts)
//   ✅ Arenas badges (same filter/pill logic as ProfileScreen)
//   ✅ Follow button — localStorage persistence, immediate toggle
//   ✅ Message button — premium → DM thread; free → paywall
//   ✅ Post grid — 3-column, non-interactive
//   ✅ Header three-dot menu with Block + Report (non-functional, TODO)
//   ✅ 404 for unknown handles
//   ✅ Redirect /profile/vinay → /profile
//
// Part 2b TODO:
//   - Entry points: DM list rows, Notifications, Post author, Arenas, Explore

import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router';
import { TOKENS, AGENTS } from '@/lib/design-tokens';
import { AgentDot } from '@/components/primitives';
import { SLMark } from '@/components/Logo';
import { MOCK_USERS, CURRENT_USER, DM_THREADS, getPostsForUser } from '@/lib/mock-data';
import { isFollowing, setFollowing as persistFollowing } from '@/lib/follow-preferences';

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
  const { handle = '' } = useParams<{ handle: string }>();

  // ── All hooks unconditionally first ───────────────────────────────────────

  const [isPremium]      = useState(() => localStorage.getItem('sl-premium') === '1');
  const [following, setFollowState] = useState(() => isFollowing(handle));
  const [followHovered, setFollowHovered] = useState(false);
  const [showMenu, setShowMenu]   = useState(false);

  const menuRef       = useRef<HTMLDivElement>(null);
  const signalCardRef = useRef<HTMLDivElement>(null);
  const popoverRef    = useRef<HTMLDivElement>(null);
  const [showSignalInfo, setShowSignalInfo] = useState(false);

  const user  = MOCK_USERS[handle];
  const posts = useMemo(() => (user ? getPostsForUser(user) : []), [user?.handle]);

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

  // ── Guards — after all hooks ───────────────────────────────────────────────

  // Own handle → own profile
  if (handle === CURRENT_USER.handle) return <Navigate to="/profile" replace />;

  // Unknown handle → 404
  if (!user) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: TOKENS.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
        fontFamily: FONT,
      }}>
        <div style={{
          fontFamily: MONO, fontSize: 12, letterSpacing: 1.4, color: TOKENS.mute,
        }}>
          USER NOT FOUND
        </div>
        <div style={{ fontSize: 14, color: TOKENS.mute2, marginTop: 8, textAlign: 'center' }}>
          @{handle}
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            marginTop: 16, background: 'none', border: 'none',
            color: TOKENS.mute2, cursor: 'pointer',
            fontFamily: FONT, fontSize: 14, textDecoration: 'underline',
            padding: 0,
          }}
        >
          Go back
        </button>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const displayedFollowers = user.followers + (following ? 1 : 0);
  const visibleBadges = user.arenaBadges.filter(b => b.rank <= 100).slice(0, 3);

  // Find DM thread for this handle (only relevant when premium)
  const dmThread = isPremium
    ? DM_THREADS.find(t => t.kind === 'user' && t.userHandle === handle)
    : undefined;
  const hasThread = dmThread !== undefined;

  const avatarRingStyle: React.CSSProperties = user.creatorsClub
    ? { boxShadow: `0 0 0 2.5px ${TOKENS.gold}, 0 0 20px rgba(212,175,55,0.3)` }
    : user.isPremium
      ? { boxShadow: `0 0 0 2px ${TOKENS.gold}` }
      : { boxShadow: '0 0 0 1.5px rgba(255,255,255,0.10)' };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleFollow = () => {
    const next = !following;
    setFollowState(next);
    persistFollowing(handle, next);
  };

  const handleMessage = () => {
    if (!isPremium) {
      navigate('/paywall');
      return;
    }
    // dmThread is pre-computed in derived values; if present, navigate directly
    if (dmThread) {
      navigate('/dm/' + dmThread.id);
    }
    // No thread → button renders as disabled (see JSX below); no-op here
  };

  // ── Follow button style ───────────────────────────────────────────────────
  // Following: gold filled.  Not-following: gold outline.
  // Hover applies a subtle opacity shift via followHovered state.

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
          Profile
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
              {/* TODO: Block — requires backend; non-functional */}
              <MenuRow
                label="Block"
                danger
                onClick={() => {
                  // TODO: block @{handle}
                  setShowMenu(false);
                }}
              />
              {/* TODO: Report — requires backend; non-functional */}
              <MenuRow
                label="Report"
                onClick={() => {
                  // TODO: report @{handle}
                  setShowMenu(false);
                }}
              />
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
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2a2a2a, #121212)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...avatarRingStyle,
          }}>
            <span style={{
              fontFamily: FONT, fontSize: 36, fontWeight: 700, color: TOKENS.text,
            }}>
              {user.avatarInitials}
            </span>
          </div>

          {/* Display name */}
          <div style={{
            marginTop: 12,
            fontFamily: FONT, fontSize: 22, fontWeight: 700, color: TOKENS.text,
            textAlign: 'center',
          }}>
            {user.displayName}
          </div>

          {/* Handle */}
          <div style={{
            marginTop: 2,
            fontFamily: FONT, fontSize: 13, color: TOKENS.mute2,
            textAlign: 'center',
          }}>
            @{user.handle}
          </div>

          {/* Inner Circle label */}
          {user.isPremium && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <SLMark size={14} color={TOKENS.gold} />
              <span style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: 1.4, color: TOKENS.gold,
              }}>INNER CIRCLE</span>
            </div>
          )}

          {/* Creators Club label */}
          {user.creatorsClub && (
            <div style={{
              marginTop: 3,
              fontFamily: MONO, fontSize: 9, letterSpacing: 1.4, color: TOKENS.gold,
              textAlign: 'center',
            }}>
              CREATORS CLUB · {user.creatorsClub.category}
            </div>
          )}

          {/* Bio */}
          <div style={{
            marginTop: 10,
            fontFamily: FONT, fontSize: 14, color: TOKENS.mute,
            lineHeight: 1.5, textAlign: 'center',
            maxWidth: 320,
          }}>
            {user.bio}
          </div>
        </div>

        {/* ── Action buttons: Follow + Message ─────────────────────────────── */}
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

            {/* Message — three states:
                  (a) !isPremium         → paywall prompt
                  (b) isPremium+thread   → navigate to DM thread
                  (c) isPremium+no thread → disabled "Message unavailable"   */}
            {isPremium && !hasThread ? (
              <div style={{
                flex: 1, height: 42, borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${TOKENS.line}`,
                color: TOKENS.mute2,
                fontFamily: FONT, fontSize: 14, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'not-allowed',
                userSelect: 'none',
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

        {/* ── Signal score ──────────────────────────────────────────────────── */}
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
                {user.signalScore.toLocaleString()}
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

        {/* ── Stats row ────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 8, padding: '0 20px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${TOKENS.line}`,
            borderRadius: 14,
            padding: '14px 0',
          }}>
            {[
              { label: 'FOLLOWING', value: user.following },
              { label: 'FOLLOWERS', value: displayedFollowers },
              { label: 'POSTS',     value: user.postCount },
            ].map(({ label, value }, i) => (
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
                  {value.toLocaleString()}
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

        {/* ── Arenas badges ────────────────────────────────────────────────── */}
        {visibleBadges.length > 0 && (
          <div style={{ marginTop: 20, padding: '0 20px' }}>
            <div style={{
              fontFamily: MONO, fontSize: 10, letterSpacing: 1.4, color: TOKENS.mute2,
              marginBottom: 8,
            }}>ARENAS</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visibleBadges.map(badge => {
                const A = AGENTS[badge.agent];
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
        )}

        {/* ── Post grid ────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 24 }}>
          <div style={{
            fontFamily: MONO, fontSize: 10, letterSpacing: 1.4, color: TOKENS.mute2,
            padding: '0 20px', marginBottom: 10,
          }}>
            POSTS
          </div>

          {user.postCount === 0 ? (
            <div style={{
              padding: '40px 20px', textAlign: 'center',
              fontFamily: MONO, fontSize: 11, color: TOKENS.mute2, letterSpacing: 1.4,
            }}>
              NO POSTS YET
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 2,
            }}>
              {posts.map(post => (
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
