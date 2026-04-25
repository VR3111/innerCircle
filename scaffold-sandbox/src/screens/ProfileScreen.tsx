// ProfileScreen — own profile at /profile
//
// Part 1 scope:
//   ✅ Avatar + identity block (initials, name, handle, IC/CC labels, bio)
//   ✅ Signal score featured card + info popover
//   ✅ Secondary stats row (Following / Followers / Posts)
//   ✅ Arenas badges (rank ≤ 100, max 3, CREATORS pill for rank ≤ 5)
//   ✅ Action buttons (Edit Profile / Share Profile — no-op)
//   ✅ Upgrade to Inner Circle gold button (free users only)
//   ✅ Post grid (3-column, non-interactive SVG thumbnails)
//
// Part 2 TODO:
//   - UserProfileScreen.tsx for /profile/:handle (other users)
//   - Follow/unfollow state
//   - Post grid tiles clickable

import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOKENS, AGENTS } from '@/lib/design-tokens';
import { AgentDot } from '@/components/primitives';
import { SLMark } from '@/components/Logo';
import { CURRENT_USER, getPostsForUser } from '@/lib/mock-data';
import { getFollowCount } from '@/lib/follow-preferences';

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

export function ProfileScreen() {
  const navigate = useNavigate();

  // Read premium from localStorage once at mount — do not re-read mid-session
  const [isPremium] = useState(() => localStorage.getItem('sl-premium') === '1');
  // Dynamic following count: baseline + accounts followed via UserProfileScreen.
  // Read once at mount; updates on next mount after following someone on another screen.
  const [dynamicFollowing] = useState(() => CURRENT_USER.following + getFollowCount());
  const [showSignalInfo, setShowSignalInfo] = useState(false);

  const signalCardRef = useRef<HTMLDivElement>(null);
  const popoverRef    = useRef<HTMLDivElement>(null);

  const user  = { ...CURRENT_USER, isPremium };
  const posts = useMemo(() => getPostsForUser(user), [user.handle, user.postCount]);

  // Close signal info popover on outside click
  useEffect(() => {
    if (!showSignalInfo) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insidePopover = popoverRef.current?.contains(target) ?? false;
      const insideCard    = signalCardRef.current?.contains(target) ?? false;
      if (!insidePopover && !insideCard) setShowSignalInfo(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSignalInfo]);

  // Avatar ring: CC gets gold glow, premium gets plain gold border, otherwise subtle
  const avatarRingStyle: React.CSSProperties = user.creatorsClub
    ? { boxShadow: `0 0 0 2.5px ${TOKENS.gold}, 0 0 20px rgba(212,175,55,0.3)` }
    : user.isPremium
      ? { boxShadow: `0 0 0 2px ${TOKENS.gold}` }
      : { boxShadow: '0 0 0 1.5px rgba(255,255,255,0.10)' };

  // Arenas: filter rank ≤ 100, show max 3
  const visibleBadges = user.arenaBadges.filter(b => b.rank <= 100).slice(0, 3);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: TOKENS.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: FONT,
    }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
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
        }}>Profile</span>

        <button type="button" onClick={() => navigate('/settings')} style={iconBtnStyle}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}
      >

        {/* ── Avatar + identity ────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '28px 20px 16px',
        }}>
          {/* Avatar circle — ring style set by tier */}
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

          {/* Inner Circle label — only if premium */}
          {user.isPremium && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, marginTop: 4,
            }}>
              <SLMark size={14} color={TOKENS.gold} />
              <span style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: 1.4, color: TOKENS.gold,
              }}>INNER CIRCLE</span>
            </div>
          )}

          {/* Creators Club label — only if CC member */}
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

        {/* ── Action buttons ───────────────────────────────────────────────── */}
        <div style={{ marginTop: 20, padding: '0 20px' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => { /* TODO: Edit flow in future prompt */ }}
              style={{
                flex: 1, height: 42, borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${TOKENS.line}`,
                color: TOKENS.text,
                fontFamily: FONT, fontSize: 14, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => { /* TODO: Share profile */ }}
              style={{
                flex: 1, height: 42, borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${TOKENS.line}`,
                color: TOKENS.text,
                fontFamily: FONT, fontSize: 14, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Share Profile
            </button>
          </div>

          {/* Upgrade button — free users only */}
          {!user.isPremium && (
            <button
              type="button"
              onClick={() => navigate('/paywall')}
              style={{
                width: '100%', height: 42, borderRadius: 12, marginTop: 10,
                background: 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)',
                border: 'none',
                color: '#0A0A0A',
                fontFamily: FONT, fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(212,175,55,0.35)',
              }}
            >
              Upgrade to Inner Circle
            </button>
          )}
        </div>

        {/* ── Signal score block ───────────────────────────────────────────── */}
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
              }}>
                SIGNAL SCORE
              </div>
              <div style={{
                fontFamily: FONT, fontSize: 28, fontWeight: 700, color: TOKENS.gold,
                marginTop: 2,
              }}>
                {user.signalScore.toLocaleString()}
              </div>
            </div>

            {/* Info icon — toggles explainer popover */}
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
            >
              ?
            </button>
          </div>

          {/* Signal score explainer popover — closes on outside click */}
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
                Your signalScore reflects activity across agent categories: posts, engagement, streaks, and retention. Updated daily.
              </div>
            </div>
          )}
        </div>

        {/* ── Secondary stats row ──────────────────────────────────────────── */}
        <div style={{ marginTop: 8, padding: '0 20px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${TOKENS.line}`,
            borderRadius: 14,
            padding: '14px 0',
          }}>
            {[
              { label: 'FOLLOWING', value: dynamicFollowing },
              { label: 'FOLLOWERS', value: user.followers },
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
            }}>
              ARENAS
            </div>

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

                    {/* CREATORS pill — shown for rank ≤ 5 */}
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
