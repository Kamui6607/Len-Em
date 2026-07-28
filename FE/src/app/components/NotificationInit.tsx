import { useNotificationSocket } from "../../hooks/useNotificationSocket";

/**
 * This component sits inside NotificationProvider to initialize
 * the Socket.IO connection and fetch notifications from API.
 * It renders nothing — purely a side-effect component.
 */
export function NotificationInit() {
  useNotificationSocket();
  return null;
}