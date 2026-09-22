import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import {
  isServerNotificationId,
  type NewNotificationInput,
  type Notification,
} from "../types/notification.types";
import { notificationService } from "../api/notificationService";
import { useAuthStore } from "../store/auth.store";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: NewNotificationInput) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  setNotifications: (notifications: Notification[]) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Each account keeps its own cache so an Admin session never leaks into the
// next customer session on the same browser.
const STORAGE_PREFIX = "lenEm_notifications";

function storageKey(userId: string | null): string {
  return `${STORAGE_PREFIX}_${userId ?? "guest"}`;
}

function readCache(userId: string | null): Notification[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Notification[]) : [];
  } catch {
    return [];
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const userId = useAuthStore((s) => s.user?.userId ?? s.user?.id ?? null);
  const [notifications, setNotifications] = useState<Notification[]>(() => readCache(userId));

  // Mirror of the current list for event handlers (kept out of the updater
  // functions so those stay pure).
  const notificationsRef = useRef<Notification[]>(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Reload the cache when the signed-in account changes.
  useEffect(() => {
    setNotifications(readCache(userId));
  }, [userId]);

  // Persist only for a signed-in account (guests keep everything in memory).
  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(notifications));
    } catch {
      // Storage full / disabled — notifications still work in memory.
    }
  }, [userId, notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((data: NewNotificationInput) => {
    const incoming: Notification = {
      _id: data._id ?? `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: data.type,
      priority: data.priority ?? "NORMAL",
      title: data.title,
      message: data.message,
      targetId: data.targetId,
      targetPath: data.targetPath,
      read: data.read ?? false,
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt,
      metadata: data.metadata,
    };

    setNotifications((prev) => {
      // The REST history and the socket can both deliver the same notification
      // — keep a single entry per server id.
      if (data._id && prev.some((n) => n._id === data._id)) return prev;
      return [incoming, ...prev];
    });
  }, []);


  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)),
    );
    // Locally generated notifications have no server record — skip the API.
    if (isServerNotificationId(notificationId)) {
      notificationService.markAsRead(notificationId).catch(() => {
        // Silent fail — local state is already updated
      });
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    const unreadServerIds = notificationsRef.current
      .filter((n) => !n.read && isServerNotificationId(n._id))
      .map((n) => n._id);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    // No bulk endpoint on the backend — PATCH each unread notification.
    unreadServerIds.forEach((id) => {
      notificationService.markAsRead(id).catch(() => {});
    });
  }, []);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    if (isServerNotificationId(notificationId)) {
      notificationService.delete(notificationId).catch(() => {
        // Silent fail — local state is already updated
      });
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    const serverIds = notificationsRef.current
      .filter((n) => isServerNotificationId(n._id))
      .map((n) => n._id);

    setNotifications([]);

    // Backend only supports DELETE /notifications/{id}
    serverIds.forEach((id) => {
      notificationService.delete(id).catch(() => {
        // Silent fail — local state is already updated
      });
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        setNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}