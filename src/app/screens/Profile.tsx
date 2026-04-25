// Profile — own profile at /profile
//
// Wired to real Supabase data via useProfile().
// Visual layout ported from scaffold-sandbox/src/screens/ProfileScreen.tsx.
// Every visual element from the scaffold is present here.
//
// No-ops / stubs for features not yet backed:
//   - Edit Profile button action
//   - Share Profile button action
//   - Arenas rank (shows "—" placeholder)
//   - Creators Club label / CREATORS pill (JSX path exists; Step 6 wires backend)
//   - Upgrade to Inner Circle (navigates to /home — /paywall route not yet in src/)

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import PageShell from '../components/PageShell'
import BottomNav from '../components/BottomNav'

// ─── Design constants (from scaffold-sandbox/src/lib/design-tokens.ts) ────────

const GOLD  = '#D4AF37'
const LINE  = 'rgba(255,255,255,0.06)'
const LINE2 = 'rgba(255,255,255,0.10)'
const MUTE  = 'rgba(255,255,255,0.56)'
const MUTE2 = 'rgba(255,255,255,0.38)'
const CARD  = 'rgba(255,255,255,0.02)'
const MONO  = 'ui-monospace, "SFMono-Regular", monospace'
const SANS  = 'Inter, system-ui, sans-serif'

// ─── Primitives ───────────────────────────────────────────────────────────────

function IconBtn({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background:     'rgba(255,255,255,0.06)',
        border:         `1px solid ${LINE}`,
        borderRadius:   999,
        width:          36,
        height:         36,
        cursor:         'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          'rgba(255,255,255,0.6)',
        flexShrink:     0,
      }}
    >
      {children}
    </button>
  )
}

// Diamond + inner rotated square — matches scaffold-sandbox SLMark visually
// (simplified: solid filled diamond for the badge context, no animation needed).
function SLMarkSmall({ size = 14, color = GOLD }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ flexShrink: 0 }}>
      {/* outer diamond */}
      <path d="M50 6 L94 50 L50 94 L6 50 Z" fill="none" stroke={color} strokeWidth="9" strokeLinejoin="miter" />
      {/* inner rotated square */}
      <rect x="35" y="35" width="30" height="30" transform="rotate(45 50 50)"
        fill="none" stroke={color} strokeWidth="9" strokeLinejoin="miter" />
    </svg>
  )
}

// Fancy agent dot — inactive state of scaffold-sandbox's AgentDot primitive.
// Layers: radial gradient fill + specular highlight + agent letter.
// No glow/conic ring since always non-active in this context.
function AgentDotPassive({ color, letter, size = 32 }: { color: string; letter: string; size?: number }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size, flexShrink: 0 }}>
      {/* base circle with radial gradient */}
      <span style={{
        position:        'absolute',
        inset:           0,
        borderRadius:    '50%',
        background:      `radial-gradient(circle at 32% 28%, ${color}ff 0%, ${color}cc 55%, ${color}66 100%)`,
        boxShadow:       [
          'inset 0 1.5px 1px rgba(255,255,255,0.55)',
          'inset 0 -10px 18px rgba(0,0,0,0.38)',
          'inset 0 0 0 1px rgba(255,255,255,0.08)',
          `0 4px 12px ${color}44`,
        ].join(', '),
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        fontFamily:      SANS,
        fontSize:        size * 0.42,
        fontWeight:      700,
        color:           '#0A0A0A',
        letterSpacing:   '-0.5px',
      }}>
        {/* specular highlight */}
        <span aria-hidden style={{
          position:   'absolute',
          top:        '8%',
          left:       '14%',
          width:      '52%',
          height:     '34%',
          borderRadius: '50%',
          background:  'radial-gradient(ellipse at center, rgba(255,255,255,0.55) 0%, transparent 70%)',
          filter:      'blur(2px)',
          pointerEvents: 'none',
        }} />
        <span style={{ position: 'relative', zIndex: 1 }}>{letter}</span>
      </span>
    </span>
  )
}

// Static color + letter fallback for agent IDs — matches mockData / scaffold tokens.
const AGENT_META: Record<string, { color: string; letter: string }> = {
  baron:   { color: '#E63946', letter: 'B' },
  blitz:   { color: '#F4A261', letter: 'Z' },
  circuit: { color: '#457B9D', letter: 'C' },
  reel:    { color: '#E9C46A', letter: 'R' },
  pulse:   { color: '#2A9D8F', letter: 'P' },
  atlas:   { color: '#6C757D', letter: 'T' },
}

// ─── Loading state ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '1.2px', color: MUTE2 }}>
        LOADING...
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId   = user?.id ?? ''

  const {
    profile,
    followingCountTotal,
    userPosts,
    arenasCategories,
    loading,
  } = useProfile(userId)

  // Signal score info popover
  const [showSignalInfo, setShowSignalInfo] = useState(false)
  const signalCardRef = useRef<HTMLDivElement>(null)
  const popoverRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showSignalInfo) return
    const handler = (e: MouseEvent) => {
      const target       = e.target as Node
      const insideCard   = signalCardRef.current?.contains(target) ?? false
      const insidePopover = popoverRef.current?.contains(target) ?? false
      if (!insideCard && !insidePopover) setShowSignalInfo(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSignalInfo])

  // ── Derived display values ──────────────────────────────────────────────────
  const displayName    = profile?.display_name ?? profile?.username ?? ''
  const handle         = profile?.username ?? ''
  const avatarInitials = displayName.slice(0, 2).toUpperCase() || '?'

  // Three-tier avatar ring — matches scaffold-sandbox conditional exactly.
  // is_inner_circle = "premium" in scaffold terms.
  // creators_club_category = "creatorsClub" in scaffold terms.
  const isCC       = !!profile?.creators_club_category
  const isPremium  = profile?.is_inner_circle ?? false
  const avatarRing: React.CSSProperties = isCC
    ? { boxShadow: `0 0 0 2.5px ${GOLD}, 0 0 20px rgba(212,175,55,0.3)` }
    : isPremium
      ? { boxShadow: `0 0 0 2px ${GOLD}` }
      : { boxShadow: '0 0 0 1.5px rgba(255,255,255,0.10)' }

  // Arenas: max 3 (scaffold slices to 3 after filtering rank ≤ 100;
  // we have no rank data yet so just slice to 3).
  const visibleArenas = arenasCategories.slice(0, 3)

  return (
    <PageShell hasBottomNav hasStickyHeader className="bg-[#070707]">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-50"
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          10,
          padding:      'calc(18px + env(safe-area-inset-top, 0px)) 20px 8px',
          borderBottom: `1px solid ${LINE}`,
          background:   '#070707',
          flexShrink:   0,
        }}
      >
        <IconBtn onClick={() => navigate(-1)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </IconBtn>

        <span style={{
          flex:       1,
          textAlign:  'center',
          fontFamily: SANS,
          fontSize:   17,
          fontWeight: 600,
          color:      '#fff',
        }}>
          Profile
        </span>

        <IconBtn onClick={() => navigate('/settings')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </IconBtn>
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────────────── */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>

        {loading ? (
          <LoadingState />
        ) : (
          <>
            {/* ── Avatar + identity ─────────────────────────────────────────── */}
            <div style={{
              display:       'flex',
              flexDirection: 'column',
              alignItems:    'center',
              padding:       '28px 20px 16px',
            }}>
              {/* Avatar circle — ring tier based on CC / premium / free */}
              <div style={{
                width:          96,
                height:         96,
                borderRadius:   '50%',
                background:     'linear-gradient(135deg, #2a2a2a, #121212)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                ...avatarRing,
              }}>
                <span style={{ fontFamily: SANS, fontSize: 36, fontWeight: 700, color: '#fff' }}>
                  {avatarInitials}
                </span>
              </div>

              {/* Display name */}
              <div style={{
                marginTop:  12,
                fontFamily: SANS,
                fontSize:   22,
                fontWeight: 700,
                color:      '#fff',
                textAlign:  'center',
              }}>
                {displayName || '—'}
              </div>

              {/* Handle */}
              <div style={{
                marginTop:  2,
                fontFamily: SANS,
                fontSize:   13,
                color:      MUTE2,
                textAlign:  'center',
              }}>
                @{handle}
              </div>

              {/* Inner Circle badge — only when is_inner_circle = true */}
              {isPremium && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                  <SLMarkSmall size={14} color={GOLD} />
                  <span style={{
                    fontFamily:    MONO,
                    fontSize:      9,
                    letterSpacing: '1.4px',
                    color:         GOLD,
                  }}>
                    INNER CIRCLE
                  </span>
                </div>
              )}

              {/* Creators Club label — only when creators_club_category is set.
                  TODO: Backend wires this in Step 6 (Leaderboard / Creators Club).
                  Currently always null — this line never renders. */}
              {profile?.creators_club_category && (
                <div style={{
                  marginTop:     3,
                  fontFamily:    MONO,
                  fontSize:      9,
                  letterSpacing: '1.4px',
                  color:         GOLD,
                  textAlign:     'center',
                }}>
                  CREATORS CLUB · {profile.creators_club_category}
                </div>
              )}

              {/* Bio — only when non-null and non-empty (overrides scaffold's unconditional
                  render to avoid an orphaned 10px gap for users without a bio). */}
              {profile?.bio && profile.bio.trim().length > 0 && (
                <div style={{
                  marginTop:  10,
                  fontFamily: SANS,
                  fontSize:   14,
                  color:      MUTE,
                  lineHeight: 1.5,
                  textAlign:  'center',
                  maxWidth:   320,
                }}>
                  {profile.bio}
                </div>
              )}
            </div>

            {/* ── Action buttons ────────────────────────────────────────────── */}
            <div style={{ marginTop: 20, padding: '0 20px' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {/* Edit Profile — no-op click, subtle style per scaffold */}
                <button
                  type="button"
                  style={{
                    flex:        1,
                    height:      42,
                    borderRadius: 12,
                    background:  'rgba(255,255,255,0.04)',
                    border:      `1px solid ${LINE}`,
                    color:       '#fff',
                    fontFamily:  SANS,
                    fontSize:    14,
                    fontWeight:  500,
                    cursor:      'pointer',
                  }}
                >
                  Edit Profile
                </button>

                {/* Share Profile — no-op click, subtle style per scaffold */}
                <button
                  type="button"
                  style={{
                    flex:        1,
                    height:      42,
                    borderRadius: 12,
                    background:  'rgba(255,255,255,0.04)',
                    border:      `1px solid ${LINE}`,
                    color:       '#fff',
                    fontFamily:  SANS,
                    fontSize:    14,
                    fontWeight:  500,
                    cursor:      'pointer',
                  }}
                >
                  Share Profile
                </button>
              </div>

              {/* Upgrade to Inner Circle — shown for free (non-premium) users.
                  // TODO Step 7: navigate to /paywall when route exists */}
              {!isPremium && (
                <button
                  type="button"
                  onClick={() => {}}
                  style={{
                    width:        '100%',
                    height:       42,
                    borderRadius: 12,
                    marginTop:    10,
                    background:   'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)',
                    border:       'none',
                    color:        '#0A0A0A',
                    fontFamily:   SANS,
                    fontSize:     14,
                    fontWeight:   600,
                    cursor:       'pointer',
                    boxShadow:    '0 4px 16px rgba(212,175,55,0.35)',
                  }}
                >
                  Upgrade to Inner Circle
                </button>
              )}
            </div>

            {/* ── Signal Score card ─────────────────────────────────────────── */}
            <div style={{ marginTop: 18, padding: '0 20px', position: 'relative' }}>
              <div
                ref={signalCardRef}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  background:     CARD,
                  border:         `1px solid ${LINE}`,
                  borderRadius:   14,
                  padding:        '14px 18px',
                }}
              >
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '1.4px', color: MUTE2 }}>
                    SIGNAL SCORE
                  </div>
                  <div style={{
                    fontFamily: SANS,
                    fontSize:   28,
                    fontWeight: 700,
                    color:      GOLD,
                    marginTop:  2,
                  }}>
                    {(profile?.signal_score ?? 0).toLocaleString()}
                  </div>
                </div>

                {/* ? info icon — toggles explainer popover */}
                <button
                  type="button"
                  onClick={() => setShowSignalInfo(v => !v)}
                  style={{
                    width:          22,
                    height:         22,
                    borderRadius:   '50%',
                    background:     'rgba(255,255,255,0.06)',
                    border:         `1px solid ${LINE2}`,
                    cursor:         'pointer',
                    color:          MUTE2,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    fontFamily:     MONO,
                    fontSize:       12,
                    fontWeight:     700,
                    flexShrink:     0,
                  }}
                >
                  ?
                </button>
              </div>

              {/* Signal score explainer popover — text matches scaffold exactly */}
              {showSignalInfo && (
                <div
                  ref={popoverRef}
                  style={{
                    position:     'absolute',
                    top:          'calc(100% + 8px)',
                    left:         0,
                    right:        0,
                    zIndex:       10,
                    background:   '#0D0D0D',
                    border:       `1px solid ${LINE2}`,
                    borderRadius: 12,
                    padding:      '12px 14px',
                    boxShadow:    '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  <div style={{ fontFamily: SANS, fontSize: 13, color: MUTE, lineHeight: 1.5 }}>
                    Your signalScore reflects activity across agent categories: posts, engagement, streaks, and retention. Updated daily.
                  </div>
                </div>
              )}
            </div>

            {/* ── Stats row ─────────────────────────────────────────────────── */}
            <div style={{ marginTop: 8, padding: '0 20px' }}>
              <div style={{
                display:             'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                background:          CARD,
                border:              `1px solid ${LINE}`,
                borderRadius:        14,
                padding:             '14px 0',
              }}>
                {([
                  { label: 'FOLLOWING', value: followingCountTotal },
                  { label: 'FOLLOWERS', value: profile?.followers_count ?? 0 },
                  { label: 'POSTS',     value: profile?.posts_count     ?? 0 },
                ] as const).map(({ label, value }, i) => (
                  <div
                    key={label}
                    style={{
                      textAlign:  'center',
                      borderLeft: i > 0 ? `1px solid ${LINE}` : 'none',
                    }}
                  >
                    <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: '#fff' }}>
                      {value.toLocaleString()}
                    </div>
                    <div style={{
                      fontFamily:    MONO,
                      fontSize:      10,
                      letterSpacing: '1.2px',
                      color:         MUTE2,
                      marginTop:     2,
                    }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Arenas ────────────────────────────────────────────────────── */}
            {visibleArenas.length > 0 && (
              <div style={{ marginTop: 20, padding: '0 20px' }}>
                <div style={{
                  fontFamily:    MONO,
                  fontSize:      10,
                  letterSpacing: '1.4px',
                  color:         MUTE2,
                  marginBottom:  8,
                }}>
                  ARENAS
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {visibleArenas.map(arena => {
                    const meta = AGENT_META[arena.agent_id] ?? { color: '#888', letter: arena.name.charAt(0) }

                    // CREATORS pill — render when this arena's agent is the user's Creators Club category.
                    // TODO: Backend wires creators_club_category in Step 6 (Leaderboard / Creators Club).
                    // Currently always null so the pill never renders — the JSX path exists for when it does.
                    const isCreatorsCategory = profile?.creators_club_category === arena.agent_id

                    return (
                      <div
                        key={arena.agent_id}
                        style={{
                          padding:      '12px 14px',
                          borderRadius: 12,
                          background:   meta.color + '10',
                          border:       `1px solid ${meta.color}33`,
                          display:      'flex',
                          alignItems:   'center',
                          gap:          12,
                        }}
                      >
                        <AgentDotPassive
                          color={meta.color}
                          letter={meta.letter}
                          size={32}
                        />

                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: SANS,
                            fontSize:   14,
                            fontWeight: 600,
                            color:      '#fff',
                          }}>
                            {arena.name}
                          </div>
                          <div style={{ fontFamily: SANS, fontSize: 11, color: MUTE, marginTop: 2 }}>
                            Rank —
                          </div>
                        </div>

                        {/* CREATORS pill — matches scaffold badge.rank ≤ 5 equivalent */}
                        {isCreatorsCategory && (
                          <span style={{
                            padding:       '3px 8px',
                            borderRadius:  4,
                            background:    meta.color + '26',
                            color:         meta.color,
                            fontFamily:    MONO,
                            fontSize:      8,
                            letterSpacing: '1.2px',
                            fontWeight:    700,
                          }}>
                            CREATORS
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Posts grid ────────────────────────────────────────────────── */}
            <div style={{ marginTop: 24 }}>
              <div style={{
                fontFamily:    MONO,
                fontSize:      10,
                letterSpacing: '1.4px',
                color:         MUTE2,
                padding:       '0 20px',
                marginBottom:  10,
              }}>
                POSTS
              </div>

              {userPosts.length === 0 ? (
                <div style={{
                  padding:       '40px 20px',
                  textAlign:     'center',
                  fontFamily:    MONO,
                  fontSize:      11,
                  color:         MUTE2,
                  letterSpacing: '1.4px',
                }}>
                  NO POSTS YET
                </div>
              ) : (
                <div style={{
                  display:             'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap:                 2,
                }}>
                  {userPosts.map(post => (
                    <PostTile
                      key={post.id}
                      post={post}
                      onClick={() => navigate(`/post/${post.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </PageShell>
  )
}

// ─── Post tile ────────────────────────────────────────────────────────────────

interface PostTileProps {
  post: { id: string; agent_id: string; image_url: string | null }
  onClick: () => void
}

function PostTile({ post, onClick }: PostTileProps) {
  const fallback = (AGENT_META[post.agent_id]?.color ?? '#333333')

  if (post.image_url) {
    return (
      <div
        onClick={onClick}
        style={{
          aspectRatio:        '1 / 1',
          backgroundImage:    `url(${post.image_url})`,
          backgroundSize:     'cover',
          backgroundPosition: 'center',
          cursor:             'pointer',
        }}
      />
    )
  }

  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio:     '1 / 1',
        backgroundColor: fallback + '33',
        border:          `1px solid ${fallback}44`,
        cursor:          'pointer',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
      }}
    >
      <div style={{
        width:           24,
        height:          24,
        borderRadius:    '50%',
        backgroundColor: fallback,
        opacity:         0.6,
      }} />
    </div>
  )
}
