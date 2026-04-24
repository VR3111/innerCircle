// DM per-thread preferences — persisted to localStorage.
// Storage format: Record<threadId, boolean>
// True = muted, false = explicitly unmuted (overrides mock-data default).

const MUTE_KEY = 'sl-dm-muted';

function readMap(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(MUTE_KEY) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

/**
 * Returns mute state for a thread.
 * If the thread has never been explicitly toggled, falls back to `defaultValue`
 * (the mock-data `muted` field) so UI demos work correctly out of the box.
 */
export function isThreadMuted(threadId: string, defaultValue: boolean): boolean {
  const map = readMap();
  return threadId in map ? map[threadId] : defaultValue;
}

/**
 * Persists mute state for a thread, overriding any mock-data default.
 */
export function setThreadMuted(threadId: string, muted: boolean): void {
  const map = readMap();
  localStorage.setItem(MUTE_KEY, JSON.stringify({ ...map, [threadId]: muted }));
}
