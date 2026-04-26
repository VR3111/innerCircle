import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const POLL_INTERVAL_MS = 60_000;

// Types previously in notificationsData.ts — inlined here to avoid dead file.
export type NotificationType = "rank" | "inner_circle" | "agent_post" | "leaderboard";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  subtitle: string;
  timestamp: string;
  read: boolean;
  href: string;
  agentId?: string;
}

interface NotificationsContextType {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  dismiss: (id: number) => void;
  markRead: (id: number) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  items: [],
  unreadCount: 0,
  loading: true,
  dismiss: () => {},
  markRead: () => {},
  markAllRead: () => {},
  clearAll: () => {},
});

function timeAgo(isoString: string): string {
  const secs = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (secs < 60)    return "just now";
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// DB row → Notification shape expected by NotificationsScreen.
// id is a UUID string in the DB; we cast it to satisfy the `id: number` type
// without changing the UI file. At runtime the value is the UUID string, which
// works correctly for filtering/keys.
function mapRow(row: Record<string, unknown>): Notification {
  return {
    id:        row.id as unknown as number,
    type:      row.type as NotificationType,
    title:     row.title as string,
    subtitle:  row.body  as string,
    timestamp: timeAgo(row.created_at as string),
    read:      row.is_read as boolean,
    href:      "/home",
  };
}

async function fetchRows(userId: string, token: string): Promise<Notification[]> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/notifications`);
  url.searchParams.set("select",  "*");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("order",   "created_at.desc");

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      apikey:        SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) return [];
  const data = await res.json() as Record<string, unknown>[];
  return (data ?? []).map(mapRow);
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user?.id || !session?.access_token) return;

    const userId = user.id;
    const token  = session.access_token;

    let cancelled = false;

    const load = async () => {
      const rows = await fetchRows(userId, token);
      if (!cancelled) {
        setItems(rows);
        setLoading(false);
      }
    };

    void load();
    const interval = setInterval(() => { void load(); }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.id, session?.access_token]);

  const dismiss = async (id: number) => {
    const uuid = id as unknown as string;
    setItems((prev) => prev.filter((n) => (n.id as unknown as string) !== uuid));

    if (!session?.access_token) return;
    await fetch(
      `${SUPABASE_URL}/rest/v1/notifications?id=eq.${encodeURIComponent(uuid)}`,
      {
        method: "DELETE",
        headers: {
          apikey:        SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );
  };

  const markRead = async (id: number) => {
    const uuid = id as unknown as string;
    setItems((prev) =>
      prev.map((n) =>
        (n.id as unknown as string) === uuid ? { ...n, read: true } : n,
      ),
    );

    if (!session?.access_token) return;
    await fetch(
      `${SUPABASE_URL}/rest/v1/notifications?id=eq.${encodeURIComponent(uuid)}`,
      {
        method: "PATCH",
        headers: {
          apikey:         SUPABASE_ANON_KEY,
          Authorization:  `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          Prefer:         "return=minimal",
        },
        body: JSON.stringify({ is_read: true }),
      },
    );
  };

  const markAllRead = async () => {
    if (!user?.id || !session?.access_token) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

    await fetch(
      `${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${encodeURIComponent(user.id)}`,
      {
        method: "PATCH",
        headers: {
          apikey:          SUPABASE_ANON_KEY,
          Authorization:   `Bearer ${session.access_token}`,
          "Content-Type":  "application/json",
          Prefer:          "return=minimal",
        },
        body: JSON.stringify({ is_read: true }),
      }
    );
  };

  const clearAll = async () => {
    if (!user?.id || !session?.access_token) return;
    setItems([]);

    await fetch(
      `${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${encodeURIComponent(user.id)}`,
      {
        method: "DELETE",
        headers: {
          apikey:        SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );
  };

  return (
    <NotificationsContext.Provider
      value={{ items, unreadCount, loading, dismiss, markRead, markAllRead, clearAll }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
