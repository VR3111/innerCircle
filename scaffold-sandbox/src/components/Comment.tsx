// Comment.tsx — ported from prototype-source/screen-post.jsx L5-113
// Font overrides: 'Geist' → Inter, 'Geist Mono, monospace' → ui-monospace, monospace

import { AGENTS, TOKENS } from '@/lib/design-tokens';
import { AgentDot } from '@/components/primitives';
import type { Reply } from '@/lib/types';

// Split on @mention tokens; use agent color when the handle matches a real agent,
// fall back to TOKENS.gold for user handles (e.g. @devon_w, @quantrose).
function parseText(text: string): React.ReactNode[] {
  return String(text).split(/(@\w+)/g).map((part, i) => {
    if (!part.startsWith('@')) return <span key={i}>{part}</span>;
    const handle = part.slice(1); // strip the @
    // Case-insensitive name lookup; exclude the virtual ALL sentinel
    const agent = Object.values(AGENTS).find(
      a => a.id !== 'ALL' && a.name.toLowerCase() === handle.toLowerCase()
    );
    return (
      <span key={i} style={{ color: agent ? agent.color : TOKENS.gold, fontWeight: 500 }}>
        {part}
      </span>
    );
  });
}

interface CommentProps {
  c: Reply;
  onReply?: (c: Reply) => void;
  onLike?: (c: Reply) => void;
  indent?: boolean;
}

export function Comment({ c, onReply, onLike, indent = false }: CommentProps) {
  const A = c.agent ? AGENTS[c.agent] : null;
  const displayName = A ? A.name : (c.name ?? 'anon');
  const nameColor   = A ? A.color : '#FFFFFF';
  const avatarSize  = indent ? 28 : 34;  // prototype L38

  return (
    <div
      id={`comment-${c.id}`}
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 0',
        paddingLeft: indent ? 44 : 0,   // prototype L26-27
        position: 'relative',
      }}
    >
      {/* Subtle vertical connector line for indented replies (prototype L30-35) */}
      {indent && (
        <span style={{
          position: 'absolute',
          left: 16, top: 0, bottom: 14, width: 1,
          background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)',
        }} />
      )}

      {/* Avatar — AgentDot when agent reply, gradient initial when user (prototype L37-48) */}
      {A ? (
        <div style={{ flexShrink: 0 }}>
          <AgentDot agent={c.agent!} size={avatarSize} clickable={false} />
        </div>
      ) : (
        <div style={{
          width: avatarSize, height: avatarSize,
          borderRadius: '50%', flexShrink: 0,
          background: 'radial-gradient(circle at 32% 28%, #7a7a82 0%, #3c3c42 60%, #1c1c20 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -4px 8px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          // font override: Geist → Inter
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 12, color: '#fff', fontWeight: 600,
        }}>
          {String(c.name || '?')[0].toUpperCase()}
        </div>
      )}

      {/* Main content column */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Name + badges + timestamp row (prototype L51-76) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            // font override: Geist → Inter
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13, fontWeight: 600,
            color: nameColor, letterSpacing: -0.1,
          }}>{displayName}</span>

          {/* AGENT badge — only shown when comment is from an agent */}
          {A && (
            <span style={{
              // font override: Geist Mono → ui-monospace
              fontFamily: 'ui-monospace, monospace',
              fontSize: 8.5, color: A.color, letterSpacing: 1.2,
              padding: '1px 6px', borderRadius: 4,
              background: `${A.color}1a`, border: `1px solid ${A.color}44`,
            }}>AGENT</span>
          )}

          {/* INNER CIRCLE badge — premium users (prototype L64-72) */}
          {c.premium && (
            <span style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 8.5, color: TOKENS.gold, letterSpacing: 1.2,
              padding: '1px 6px', borderRadius: 4,
              background: `${TOKENS.gold}14`, border: `1px solid ${TOKENS.gold}55`,
            }}>INNER CIRCLE</span>
          )}

          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: 0.4,
          }}>{c.time}</span>
        </div>

        {/* Body text with @mention parsing (prototype L78-83) */}
        <div style={{
          marginTop: 4,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14, color: '#FFFFFF',
          lineHeight: 1.45, opacity: 0.92,
          wordBreak: 'break-word',
        }}>
          {parseText(c.text)}
        </div>

        {/* Reply link + like count (prototype L84-95) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 8 }}>
          <button
            onClick={() => onReply?.(c)}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 12, fontWeight: 500,
              color: 'rgba(255,255,255,0.58)', letterSpacing: 0.1,
            }}
          >Reply</button>
          {c.likes > 0 && (
            <span style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11, color: 'rgba(255,255,255,0.38)',
            }}>
              {c.likes} {c.likes === 1 ? 'like' : 'likes'}
            </span>
          )}
        </div>
      </div>

      {/* Heart like button — right-aligned, scale(1.1) bounce + red fill (prototype L98-110) */}
      <button
        onClick={() => onLike?.(c)}
        style={{
          background: 'none', border: 'none', padding: 4, cursor: 'pointer',
          alignSelf: 'flex-start', marginTop: 2,
          color: c.liked ? '#E63946' : 'rgba(255,255,255,0.22)',
          transition: 'color 200ms, transform 200ms',
          transform: c.liked ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24"
             fill={c.liked ? '#E63946' : 'none'}>
          <path
            d="M12 21s-7-4.35-9.5-9.2A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 6.8C19 16.65 12 21 12 21z"
            stroke={c.liked ? '#E63946' : 'currentColor'}
            strokeWidth="1.7" strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
