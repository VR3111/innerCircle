import { createContext, useContext, useState, ReactNode } from "react";
import { notifications as initial, Notification } from "../data/notificationsData";

interface NotificationsContextType {
  items: Notification[];
  unreadCount: number;
  dismiss: (id: number) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  items: [],
  unreadCount: 0,
  dismiss: () => {},
  markAllRead: () => {},
  clearAll: () => {},
});

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Notification[]>(initial);

  const unreadCount = items.filter((n) => !n.read).length;

  const dismiss = (id: number) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setItems([]);
  };

  return (
    <NotificationsContext.Provider
      value={{ items, unreadCount, dismiss, markAllRead, clearAll }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
