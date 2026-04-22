// CommentsSection.tsx — ported from prototype-source/screen-post.jsx L336-394
// Font overrides: 'Geist Mono, monospace' → ui-monospace, monospace

import { useState } from 'react';
import { TOKENS } from '@/lib/design-tokens';
import { Comment } from '@/components/Comment';
import type { Reply } from '@/lib/types';

interface CommentsSectionProps {
  thread: Reply[];
  onLike: (c: Reply) => void;
  onReply: (c: Reply) => void;
}

export function CommentsSection({ thread, onLike, onReply }: CommentsSectionProps) {
  const [tab, setTab] = useState<'everyone' | 'inner'>('everyone');

  // Inner Circle: top-level + replies that are agent comments or premium (prototype L338)
  const innerCircle = thread
    .flatMap(c => [c, ...(c.replies ?? [])])
    .filter(c => c.agent || c.premium);

  // Total includes top-level + all nested (prototype L339)
  const total = thread.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);

  return (
    <div>
      {/* Segmented toggle — EVERYONE / INNER CIRCLE (prototype L344-367) */}
      <div style={{
        display: 'flex', gap: 6, padding: '14px 0 10px',
        // font override: Geist Mono → ui-monospace
        fontFamily: 'ui-monospace, monospace',
        fontSize: 10, letterSpacing: 1.3,
      }}>
        <button
          onClick={() => setTab('everyone')}
          style={{
            background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer',
            color: tab === 'everyone' ? '#FFFFFF' : 'rgba(255,255,255,0.38)',
            borderBottom: tab === 'everyone' ? '1.5px solid #FFFFFF' : '1.5px solid transparent',
            letterSpacing: 1.3,
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          EVERYONE · {total}
        </button>

        <div style={{ width: 18 }} />

        {/* Inner Circle button with circle+check icon (prototype L355-366) */}
        <button
          onClick={() => setTab('inner')}
          style={{
            background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer',
            color: tab === 'inner' ? TOKENS.gold : 'rgba(255,255,255,0.38)',
            borderBottom: tab === 'inner' ? `1.5px solid ${TOKENS.gold}` : '1.5px solid transparent',
            display: 'flex', alignItems: 'center', gap: 5,
            fontFamily: 'ui-monospace, monospace', letterSpacing: 1.3,
          }}
        >
          {/* Circle + checkmark icon — ported exactly from prototype L361-364 */}
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          INNER CIRCLE · {innerCircle.length}
        </button>
      </div>

      {/* Everyone tab — flat render: top-level then indented replies (prototype L369-379) */}
      {tab === 'everyone' ? (
        <div>
          {thread.map(c => (
            <div key={c.id}>
              <Comment c={c} onLike={onLike} onReply={onReply} />
              {c.replies?.map(r => (
                <Comment key={r.id} c={r} onLike={onLike} onReply={onReply} indent />
              ))}
            </div>
          ))}
        </div>
      ) : (
        /* Inner Circle tab — filtered flat list or empty state (prototype L380-391) */
        <div>
          {innerCircle.length > 0
            ? innerCircle.map(c => (
                <Comment key={c.id} c={c} onLike={onLike} onReply={onReply} />
              ))
            : (
              <div style={{
                padding: '28px 0', textAlign: 'center',
                // font override: Geist → Inter
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 13, color: 'rgba(255,255,255,0.38)',
              }}>
                No Inner Circle replies yet.
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}
