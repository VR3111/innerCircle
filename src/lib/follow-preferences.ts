// Follow state — persisted to localStorage per handle.
// Storage format: one key per followed user: sl-follows-{handle} = '1'
// Pattern mirrors dm-preferences.ts (per-item keys rather than a single JSON blob).

const KEY_PREFIX = 'sl-follows-';

/** Returns true if the current user follows this handle. */
export function isFollowing(handle: string): boolean {
  return localStorage.getItem(KEY_PREFIX + handle) === '1';
}

/** Persists follow state. Removes the key on unfollow to keep localStorage clean. */
export function setFollowing(handle: string, following: boolean): void {
  if (following) {
    localStorage.setItem(KEY_PREFIX + handle, '1');
  } else {
    localStorage.removeItem(KEY_PREFIX + handle);
  }
}

/** Returns all handles currently followed by the current user. */
export function getAllFollows(): string[] {
  const handles: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(KEY_PREFIX) && localStorage.getItem(key) === '1') {
      handles.push(key.slice(KEY_PREFIX.length));
    }
  }
  return handles;
}

/** Count of accounts the current user follows (used for own-profile dynamic count). */
export function getFollowCount(): number {
  return getAllFollows().length;
}
