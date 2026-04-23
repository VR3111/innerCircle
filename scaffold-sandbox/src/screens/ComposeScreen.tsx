// ComposeScreen — new-post composer with Arenas category selection
// Port of prototype-source/screen-compose.jsx with:
//   • Category chip row (required to submit)
//   • Image attachment via file picker + thumbnail preview
//   • @mention autocomplete (logic matches PostDetailScreen pattern)
//   • Heart/chat-bubble icons removed (were decorative)

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOKENS, AGENTS, AGENT_ORDER, type AgentId } from '@/lib/design-tokens';
import { AgentDot } from '@/components/primitives';

const MAX  = 280;
const FONT = 'Inter, system-ui, sans-serif';
const MONO = 'ui-monospace, monospace';

// Real agents only — exclude the virtual ALL sentinel
const COMPOSE_AGENTS = AGENT_ORDER
  .filter(id => id !== 'ALL')
  .map(id => AGENTS[id]);

// ── @mention helpers ──────────────────────────────────────────────────────────
// Detect an active @mention trigger: @ at start-of-string OR after whitespace,
// with no space between @ and cursor. "email@test" does NOT trigger.
function getMentionQuery(text: string): string | null {
  const m = text.match(/(?:^|\s)@(\w*)$/);
  return m ? m[1] : null;
}

// Replace the trailing @partial in draft with @Name + space.
function applyMention(draft: string, name: string): string {
  const atIdx = draft.lastIndexOf('@');
  return atIdx === -1 ? draft : `${draft.slice(0, atIdx)}@${name} `;
}
// ─────────────────────────────────────────────────────────────────────────────

export function ComposeScreen() {
  const navigate = useNavigate();

  const [text, setText]                           = useState('');
  const [selectedAgent, setSelectedAgent]         = useState<AgentId | null>(null);
  const [attachment, setAttachment]               = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery]           = useState<string | null>(null);
  const [mentionIdx, setMentionIdx]               = useState(0);

  const textareaRef        = useRef<HTMLTextAreaElement>(null);
  const fileInputRef       = useRef<HTMLInputElement>(null);
  // Stable ref so the unmount cleanup can revoke the URL without stale closures
  const attachmentPreviewRef = useRef<string | null>(null);

  // Revoke object URL on unmount to free memory
  useEffect(() => {
    return () => {
      if (attachmentPreviewRef.current) URL.revokeObjectURL(attachmentPreviewRef.current);
    };
  }, []);

  const canPost = text.trim().length > 0 && selectedAgent !== null;

  const post = () => {
    if (!selectedAgent || !text.trim()) return;
    // TODO: real backend wiring — POST /posts with category, text, optional image.
    // Attachment upload requires S3/storage integration + server-side image processing.
    navigate('/home', { replace: true });
  };

  // ── File attachment ───────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Revoke previous preview URL before creating a new one
    if (attachmentPreviewRef.current) URL.revokeObjectURL(attachmentPreviewRef.current);
    const url = URL.createObjectURL(file);
    setAttachment(file);
    setAttachmentPreview(url);
    attachmentPreviewRef.current = url;
    // Reset so same file can be re-selected after remove
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    if (attachmentPreviewRef.current) URL.revokeObjectURL(attachmentPreviewRef.current);
    attachmentPreviewRef.current = null;
    setAttachment(null);
    setAttachmentPreview(null);
  };

  // ── @mention autocomplete ─────────────────────────────────────────────────
  const mentionMatches = mentionQuery !== null
    ? COMPOSE_AGENTS.filter(a => a.name.toLowerCase().startsWith(mentionQuery.toLowerCase()))
    : [];

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX);
    setText(val);
    const query = getMentionQuery(val);
    setMentionQuery(query);
    if (query !== mentionQuery) setMentionIdx(0);
  };

  const selectMention = (name: string) => {
    // Strip the partial @query, then dedupe-check the prefix before it
    const atIdx = text.lastIndexOf('@');
    const prefix = atIdx === -1 ? text : text.slice(0, atIdx);
    const dupRe = new RegExp(`@${name}\\b`, 'i');
    if (dupRe.test(prefix)) {
      // Already mentioned — close dropdown silently, no insertion
      setMentionQuery(null);
      setMentionIdx(0);
      textareaRef.current?.focus();
      return;
    }
    const newText = applyMention(text, name).slice(0, MAX);
    setText(newText);
    setMentionQuery(null);
    setMentionIdx(0);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && mentionMatches.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIdx(i => (i + 1) % mentionMatches.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIdx(i => (i - 1 + mentionMatches.length) % mentionMatches.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectMention(mentionMatches[mentionIdx].name);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }
  };

  // Insert '@' at the current cursor position and open mention dropdown
  const handleMentionButton = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart ?? text.length;
    const newText = (text.slice(0, pos) + '@' + text.slice(pos)).slice(0, MAX);
    setText(newText);
    const query = getMentionQuery(newText.slice(0, pos + 1));
    setMentionQuery(query);
    setMentionIdx(0);
    // Restore cursor after React flushes the state update
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(pos + 1, pos + 1);
    }, 0);
  };

  // ── Char counter ring ─────────────────────────────────────────────────────
  const R            = 13;
  const circumference = 2 * Math.PI * R;
  const ringStroke   = text.length > MAX - 20 ? TOKENS.down : TOKENS.gold;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: TOKENS.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: FONT,
    }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'calc(16px + var(--ic-top-inset,0px)) 18px 10px',
        borderBottom: `1px solid ${TOKENS.line}`,
        flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: TOKENS.text, fontFamily: FONT, fontSize: 14, padding: 0,
          }}
        >Cancel</button>

        <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600 }}>New post</span>

        <button
          type="button"
          onClick={post}
          disabled={!canPost}
          style={{
            padding: '8px 16px', borderRadius: 999,
            cursor: canPost ? 'pointer' : 'not-allowed',
            background: canPost
              ? 'linear-gradient(135deg, #F4D47C 0%, #D4AF37 100%)'
              : 'rgba(255,255,255,0.08)',
            color: canPost ? '#0A0A0A' : TOKENS.mute2,
            border: 'none', fontFamily: FONT, fontSize: 12, fontWeight: 700,
            letterSpacing: 0.3, transition: 'all 200ms',
            boxShadow: canPost ? '0 4px 12px rgba(212,175,55,0.3)' : 'none',
          }}
        >POST</button>
      </div>

      {/* ── Category chip row ─────────────────────────────────────────────── */}
      <div style={{ padding: '14px 18px 8px', flexShrink: 0 }}>
        <div style={{
          fontFamily: MONO, fontSize: 10, color: TOKENS.mute,
          letterSpacing: 1.8, marginBottom: 10,
        }}>POST TO</div>

        <div
          className="no-scrollbar"
          style={{ display: 'flex', gap: 8, overflowX: 'auto' }}
        >
          {COMPOSE_AGENTS.map(agent => {
            const selected = selectedAgent === agent.id;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedAgent(agent.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px',
                  borderRadius: 999,
                  flexShrink: 0,
                  cursor: 'pointer',
                  background: selected ? agent.color : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selected ? agent.color : TOKENS.line}`,
                  color: selected ? '#0A0A0A' : TOKENS.mute,
                  fontFamily: FONT, fontSize: 13, fontWeight: 500,
                  transition: 'all 200ms',
                  boxShadow: selected ? `0 0 12px ${agent.color}66` : 'none',
                }}
              >
                <AgentDot agent={agent.id} size={16} clickable={false} />
                {agent.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '16px 18px', display: 'flex', gap: 12, minHeight: 0 }}>

        {/* User avatar */}
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #2a2a2a, #121212)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT, fontWeight: 700, fontSize: 16, color: TOKENS.text,
          border: `1px solid ${TOKENS.line2}`,
        }}>T</div>

        {/* Right column — textarea + attachment + mention dropdown + toolbar */}
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column',
          position: 'relative',
          minWidth: 0,
        }}>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            autoFocus
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setMentionQuery(null), 150)}
            placeholder="What's on your mind?"
            style={{
              width: '100%', flex: 1,
              background: 'none', border: 'none', outline: 'none', resize: 'none',
              color: TOKENS.text, fontFamily: FONT, fontSize: 18, lineHeight: 1.45,
              minHeight: 0,
            }}
          />

          {/* Image preview */}
          {attachmentPreview && (
            <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 8, flexShrink: 0 }}>
              <img
                src={attachmentPreview}
                alt={attachment?.name ?? 'attachment'}
                style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, display: 'block' }}
              />
              <button
                type="button"
                onClick={handleRemoveAttachment}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.72)', border: 'none',
                  cursor: 'pointer', color: '#fff',
                  fontFamily: FONT, fontSize: 14, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                }}
              >×</button>
            </div>
          )}

          {/* @mention autocomplete dropdown — floats above toolbar */}
          {mentionQuery !== null && mentionMatches.length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: 62,   // clears the toolbar (12px pad + 36px btn + 12px pad ≈ 60px)
              left: 0, right: 0,
              background: '#121212',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
              zIndex: 10,
            }}>
              {mentionMatches.map((agent, i) => (
                <button
                  key={agent.id}
                  type="button"
                  // onPointerDown prevents textarea blur so onClick still fires
                  onPointerDown={e => e.preventDefault()}
                  onClick={() => selectMention(agent.name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '9px 14px',
                    background: i === mentionIdx ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none',
                    borderBottom: i < mentionMatches.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background 100ms',
                  }}
                >
                  <AgentDot agent={agent.id} size={24} clickable={false} />
                  <div>
                    <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#fff' }}>
                      {agent.name}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.08em' }}>
                      {agent.tag}
                    </div>
                  </div>
                  {i === mentionIdx && (
                    <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: agent.color }} />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 0',
            flexShrink: 0,
          }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Image icon — triggers file picker */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${TOKENS.line}`,
                color: TOKENS.gold,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {/* Image SVG from prototype */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <path d="M21 15l-5-5-8 8" stroke="currentColor" strokeWidth="1.6" fill="none"/>
              </svg>
            </button>

            {/* @ mention icon */}
            <button
              type="button"
              onClick={handleMentionButton}
              style={{
                width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${TOKENS.line}`,
                color: TOKENS.gold,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT, fontSize: 16, fontWeight: 700,
              }}
            >@</button>

            <div style={{ flex: 1 }} />

            {/* Circular char counter ring */}
            <div style={{ position: 'relative', width: 32, height: 32 }}>
              <svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r={R} fill="none"
                  stroke="rgba(255,255,255,0.1)" strokeWidth="2.5"/>
                <circle cx="16" cy="16" r={R} fill="none"
                  stroke={ringStroke}
                  strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={(1 - text.length / MAX) * circumference}
                  transform="rotate(-90 16 16)"
                  style={{ transition: 'stroke-dashoffset 200ms, stroke 200ms' }}
                />
              </svg>
              {text.length > MAX - 40 && (
                <span style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: MONO, fontSize: 10, color: TOKENS.mute,
                }}>{MAX - text.length}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
