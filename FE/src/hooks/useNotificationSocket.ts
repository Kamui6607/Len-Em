import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuthStore } from "../store/auth.store";
import { useNotifications } from "../app/context/NotificationContext";
import { notificationService } from "../api/notificationService";
import type { ApiNotification } from "../api/notificationService";
import type { Notification } from "../types/notification.types";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "")
  : "http://localhost:5000";

function mapApiNotification(apiNotif: ApiNotification): Notification {
  return {
    _id: apiNotif._id,
    type: apiNotif.type as Notification["type"],
    title: apiNotif.title,
    message: apiNotif.message,
    targetId: apiNotif.targetId,
    targetPath: apiNotif.targetPath,
    read: apiNotif.isRead,
    createdAt: apiNotif.createdAt,
    updatedAt: apiNotif.updatedAt,
  };
}

export function useNotificationSocket() {
  const socketRef = useRef<Socket | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { setNotifications, addNotification } = useNotifications();

  // Fetch notifications from API on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        const { data } = await notificationService.getAll({ page: 1, limit: 50 });
        const apiNotifs = data.data.notifications;
        const mapped = apiNotifs.map(mapApiNotification);
        setNotifications(mapped);
      } catch {
        // Silent fail - fall back to local storage
      }
    };

    fetchNotifications();
  }, [isAuthenticated, setNotifications]);

  // Socket.IO connection for real-time
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = io(`${SOCKET_URL}/notifications`, {
      auth: { token: `Bearer ${accessToken}` },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[NotificationSocket] Connected");
    });

    socket.on("new_notification", (apiNotif: ApiNotification) => {
      const mapped = mapApiNotification(apiNotif);
      addNotification(mapped);

      // Show toast notification immediately with icon emoji
      const icon = apiNotif.type === "new_order" ? "🛒"
        : apiNotif.type === "order_status_change" ? "📦"
        : apiNotif.type === "support_diy_update" ? "🛠️"
        : apiNotif.type === "report_update" ? "🚩"
        : "🔔";
      toast.info(`${icon} ${apiNotif.title}`, {
        description: apiNotif.message,
        duration: 4000,
        position: "top-right",
      });
    });

    socket.on("disconnect", () => {
      console.log("[NotificationSocket] Disconnected");
    });

    socket.on("connect_error", (err) => {
      console.warn("[NotificationSocket] Connection error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken, addNotification]);

  return socketRef;
}