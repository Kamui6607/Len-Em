import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuthStore } from "../store/auth.store";
import { useNotifications } from "../app/context/NotificationContext";
import { notificationService } from "../api/notificationService";
import type { ApiNotification } from "../api/notificationService";
import type { Notification } from "../types/notification.types";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.startsWith("/")
    ? "" // relative base (/api/v1) → same origin, Vite proxy forwards in dev
    : import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "")
  : import.meta.env.PROD
    ? "https://yarn-shop-be.onrender.com"
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

    // Validate token format before connecting
    if (!accessToken.startsWith("Bearer ") && !accessToken.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
      console.warn("[NotificationSocket] Invalid token format, skipping connection");
      return;
    }

    const token = accessToken.startsWith("Bearer ") ? accessToken.slice(7) : accessToken;
    const socket = io(`${SOCKET_URL}/notifications`, {
      auth: { token: `Bearer ${token}` },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 3000,
      timeout: 15000,
    });

    socketRef.current = socket;

    const connectTimeout = setTimeout(() => {
      if (!socket.connected) {
        console.warn("[NotificationSocket] Connection timeout");
        socket.disconnect();
      }
    }, 20000);

    socket.on("connect", () => {
      console.log("[NotificationSocket] Connected");
      clearTimeout(connectTimeout);
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

    socket.on("disconnect", (reason) => {
      console.log("[NotificationSocket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[NotificationSocket] Connection error:", err.message);
      // Don't retry on authentication errors
      if (err.message.includes("Authentication error") || err.message.includes("Invalid token")) {
        socket.disconnect();
      }
    });

    return () => {
      clearTimeout(connectTimeout);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken, addNotification]);

  return socketRef;
}