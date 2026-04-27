// ProfileScreen — own profile at /profile
//
// Wired to useProfile() hook for real Supabase data.
// Visual structure matches scaffold-sandbox pixel-for-pixel.

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { TOKENS, type AgentId } from '@/lib/design-tokens';
import { AgentDot } from '@/components/primitives';
import { SLMark } from '@/components/Logo';
import { ErrorState } from '@/components/states';
import { useAuth } from '../contexts/AuthContext';
import { useProfile, type ArenaCategory } from '../hooks/useProfile';

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

function getInitials(displayName: string | null, username: string): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    return parts.map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase() || '?';
}

export function ProfileScreen() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const {
    profile, followingCountTotal, userPosts, arenasCategories,
    loading, error, refetch,
  } = useProfile(authUser?.id ?? '');

  const [showSignalInfo, setShowSignalInfo] = useState(false);

  const signalCardRef = useRef<HTMLDivElement>(null);
  const popoverRef    = useRef<HTMLDivElement>(null);

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

  // Derived profile values (safe when profile is null during loading)
  const displayName    = profile?.display_name ?? profile?.username ?? '';
  const handle         = profile?.username ?? '';
  const avatarInitials = getInitials(profile?.display_name ?? null, profile?.username ?? '');
  const isPremium      = profile?.is_inner_circle ?? false;
  const ccCategory     = profile?.creators_club_category ?? null;
  const signalScore    = profile?.signal_score ?? 0;
  const followersCount = profile?.followers_count ?? 0;
  const postsCount     = profile?.posts_count ?? 0;

  // Avatar ring: CC gets gold glow, premium gets plain gold border, otherwise subtle
  const avatarRingStyle: React.CSSProperties = ccCategory
    ? { boxShadow: `0 0 0 2.5px ${TOKENS.gold}, 0 0 20px rgba(212,175,55,0.3)` }
    : isPremium
      ? { boxShadow: `0 0 0 2px ${TOKENS.gold}` }
      : { boxShadow: '0 0 0 1.5px rgba(255,255,255,0.10)' };

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
        padding: 'calc(8px + var(--ic-top-inset,0px)) 20px 8px',
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

      {/* ── Loading state ─────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60 }}>
          <div className="sl-shimmer animate-sl-shimmer" style={{ width: 96, height: 96, borderRadius: '50%' }} />
          <div className="sl-shimmer animate-sl-shimmer" style={{ width: 120, height: 18, borderRadius: 8, marginTop: 16 }} />
          <div className="sl-shimmer animate-sl-shimmer" style={{ width: 80, height: 12, borderRadius: 6, marginTop: 8 }} />
          <div className="sl-shimmer animate-sl-shimmer" style={{ width: 240, height: 12, borderRadius: 6, marginTop: 16 }} />
          <div className="sl-shimmer animate-sl-shimmer" style={{ width: '85%', height: 60, borderRadius: 14, marginTop: 24 }} />
          <div className="sl-shimmer animate-sl-shimmer" style={{ width: '85%', height: 60, borderRadius: 14, marginTop: 8 }} />
        </div>
      )}

      {/* ── Error state ───────────────────────────────────────────────────── */}
      {!loading && (error || !profile) && (
        <div style={{ flex: 1 }}>
          <ErrorState message={error ?? 'Profile not found'} onRetry={refetch} />
        </div>
      )}

      {/* ── Profile content ───────────────────────────────────────────────── */}
      {!loading && !error && profile && (
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
              overflow: 'hidden',
              ...avatarRingStyle,
            }}>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{
                  fontFamily: FONT, fontSize: 36, fontWeight: 700, color: TOKENS.text,
                }}>
                  {avatarInitials}
                </span>
              )}
            </div>

            {/* Display name */}
            <div style={{
              marginTop: 12,
              fontFamily: FONT, fontSize: 22, fontWeight: 700, color: TOKENS.text,
              textAlign: 'center',
            }}>
              {displayName}
            </div>

            {/* Handle */}
            <div style={{
              marginTop: 2,
              fontFamily: FONT, fontSize: 13, color: TOKENS.mute2,
              textAlign: 'center',
            }}>
              @{handle}
            </div>

            {/* Inner Circle label — only if premium */}
            {isPremium && (
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
            {ccCategory && (
              <div style={{
                marginTop: 3,
                fontFamily: MONO, fontSize: 9, letterSpacing: 1.4, color: TOKENS.gold,
                textAlign: 'center',
              }}>
                CREATORS CLUB · {ccCategory}
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div style={{
                marginTop: 10,
                fontFamily: FONT, fontSize: 14, color: TOKENS.mute,
                lineHeight: 1.5, textAlign: 'center',
                maxWidth: 320,
              }}>
                {profile.bio}
              </div>
            )}
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
            {!isPremium && (
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
                  {signalScore.toLocaleString()}
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
                  Your signal score reflects activity across agent categories: posts, engagement, streaks, and retention. Updated daily.
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
                { label: 'FOLLOWING', value: followingCountTotal },
                { label: 'FOLLOWERS', value: followersCount },
                { label: 'POSTS',     value: postsCount },
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
          {arenasCategories.length > 0 && (
            <div style={{ marginTop: 20, padding: '0 20px' }}>
              <div style={{
                fontFamily: MONO, fontSize: 10, letterSpacing: 1.4, color: TOKENS.mute2,
                marginBottom: 8,
              }}>
                ARENAS
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {arenasCategories.map((arena: ArenaCategory) => (
                  <div
                    key={arena.agent_id}
                    style={{
                      padding: '12px 14px', borderRadius: 12,
                      background: arena.color + '10',
                      border: `1px solid ${arena.color + '33'}`,
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}
                  >
                    <AgentDot agent={arena.agent_id.toUpperCase() as AgentId} size={32} clickable={false} />

                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: FONT, fontSize: 14, fontWeight: 600, color: TOKENS.text,
                      }}>
                        {arena.name}
                      </div>
                      <div style={{
                        fontFamily: FONT, fontSize: 11, color: TOKENS.mute, marginTop: 2,
                      }}>
                        {arena.post_count} {arena.post_count === 1 ? 'post' : 'posts'}
                      </div>
                    </div>
                  </div>
                ))}
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

            {userPosts.length === 0 ? (
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
                {userPosts.map(post => (
                  <div
                    key={post.id}
                    onClick={() => navigate('/post/' + post.id)}
                    style={{
                      aspectRatio: '1 / 1',
                      backgroundImage: post.image_url ? `url(${post.image_url})` : undefined,
                      backgroundColor: post.image_url ? undefined : TOKENS.bg2,
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
      )}
    </div>
  );
}
