import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { Notification } from "../../types/notification.types";
import { notificationService } from "../../api/notificationService";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "_id" | "read" | "createdAt">) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  setNotifications: (notifications: Notification[]) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("lenEm_notifications");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("lenEm_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((data: Omit<Notification, "_id" | "read" | "createdAt">) => {
    const newNotification: Notification = {
      ...data,
      _id: `NOTIF-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n._id === notificationId);
      // Only call API if notification exists and is not already read
      if (notification && !notification.read) {
        notificationService.markAsRead(notificationId).catch(() => {
          // Silent fail — local state is already updated
        });
      }
      return prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n));
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n._id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    // Call API for each unread notification
    unreadIds.forEach((id) => {
      notificationService.markAsRead(id).catch(() => {});
    });
  }, [notifications]);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    // Call API to delete on server
    notificationService.delete(notificationId).catch(() => {
      // Silent fail — local state is already updated
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