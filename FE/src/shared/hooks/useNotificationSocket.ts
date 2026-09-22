import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuthStore } from "../store/auth.store";
import { useNotifications } from "../contexts/NotificationContext";
import {
  extractNotifications,
  mapApiNotification,
  notificationService,
  type ApiNotification,
} from "../api/notificationService";
import {
  NOTIFICATION_CATEGORY_EMOJI,
  getNotificationCategory,
  normalizePriority,
} from "../types/notification.types";

// Socket server base — mirrors the axios client's base-URL logic:
// relative VITE_API_BASE_URL → same origin (Vite dev proxy), otherwise strip
// the /api/v1 suffix and hit the host directly.
const SOCKET_NAMESPACE = "/notifications";
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.startsWith("/")
    ? "" // relative base (/api/v1) → same origin, Vite proxy forwards in dev
    : import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "")
  : import.meta.env.PROD
    ? "https://yarn-shop-be.onrender.com"
    : "http://localhost:5000";

const JWT_PATTERN = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

/** Page size for the initial history fetch. */
const HISTORY_LIMIT = 50;

export function useNotificationSocket() {
  const socketRef = useRef<Socket | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { setNotifications, addNotification } = useNotifications();

  // Fetch the notification history from the API as soon as the user is signed
  // in. The backend already scopes the result by role (Admin / Staff / Customer).
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        const { data } = await notificationService.getAll({ page: 1, limit: HISTORY_LIMIT });
        const { notifications: apiNotifs } = extractNotifications(data, 1, HISTORY_LIMIT);
        setNotifications(apiNotifs.map(mapApiNotification));
      } catch {
        // Silent fail - fall back to the locally cached history
      }
    };

    fetchNotifications();
  }, [isAuthenticated, setNotifications]);

  // ── Real-time: Socket.IO namespace /notifications ──
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const rawToken = accessToken.startsWith("Bearer ") ? accessToken.slice(7) : accessToken;

    // Validate token format before connecting
    if (!JWT_PATTERN.test(rawToken)) {
      console.warn("[NotificationSocket] Invalid token format, skipping connection");
      return;
    }

    let socket: Socket | null = null;
    let connectTimeout: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    // The guide passes the raw JWT in `auth.token`; some backend builds expect
    // the "Bearer " prefix instead — retry once with it if auth is rejected.
    let usedBearerFallback = false;

    const handleNewNotification = (apiNotif: ApiNotification) => {
      const notification = mapApiNotification(apiNotif);

      // Push it to the top of the list + bump the unread badge
      addNotification(notification);

      // Toast popup — level and icon depend on priority / type
      const emoji = NOTIFICATION_CATEGORY_EMOJI[getNotificationCategory(notification.type)];
      const priority = normalizePriority(notification.priority);
      const options = {
        description: notification.message,
        // Admin order notifications carry several lines (items, totals…) —
        // keep the line breaks the backend sends in `message`.
        descriptionClassName: "whitespace-pre-line",
        duration: priority === "HIGH" ? 8000 : 5000,
        position: "top-right" as const,
      };

      if (priority === "HIGH") {
        toast.warning(`${emoji} ${notification.title}`, options);
      } else {
        toast.info(`${emoji} ${notification.title}`, options);
      }
    };

    const start = (withBearerPrefix: boolean) => {
      socket?.removeAllListeners();
      socket?.disconnect();

      const instance = io(`${SOCKET_URL}${SOCKET_NAMESPACE}`, {
        auth: { token: withBearerPrefix ? `Bearer ${rawToken}` : rawToken },
        transports: ["polling", "websocket"],
        // Network failures may retry, but auth failures are handled below and
        // must not keep reconnecting with the same invalid token.
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 3000,
        timeout: 15000,
      });
      socket = instance;
      socketRef.current = instance;

      connectTimeout = setTimeout(() => {
        if (!instance.connected) {
          console.warn("[NotificationSocket] Connection timeout");
          instance.disconnect();
        }
      }, 20000);

      instance.on("connect", () => {
        console.log("[NotificationSocket] Connected");
        clearTimeout(connectTimeout);
      });

      instance.on("new_notification", handleNewNotification);

      instance.on("disconnect", (reason) => {
        console.log("[NotificationSocket] Disconnected:", reason);
      });

      instance.on("connect_error", (err) => {
        const isAuthError =
          err.message.includes("Authentication error") ||
          err.message.includes("Invalid token") ||
          /unauthorized|jwt|token/i.test(err.message);

        if (isAuthError && !usedBearerFallback) {
          usedBearerFallback = true;
          console.info("[NotificationSocket] Auth rejected — retrying with a Bearer prefix");
          clearTimeout(connectTimeout);
          if (!cancelled) start(true);
          return;
        }

        if (!isAuthError) {
          console.warn("[NotificationSocket] Connection error:", err.message);
          return;
        }

        // Stop the Socket.IO manager before disconnecting; otherwise it can
        // schedule another attempt with the same expired token.
        console.info("[NotificationSocket] Authentication failed; disabling reconnect");
        clearTimeout(connectTimeout);
        instance.io.opts.reconnection = false;
        instance.removeAllListeners();
        instance.disconnect();
        if (socketRef.current === instance) {
          socketRef.current = null;
        }
      });
    };

    start(false);

    return () => {
      cancelled = true;
      clearTimeout(connectTimeout);
      socket?.removeAllListeners();
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken, addNotification]);

  return socketRef;
}
