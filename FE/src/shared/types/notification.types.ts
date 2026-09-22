// ============================================================
// Notification Types — mirrors the backend notification contract
// ============================================================
// Backend payload (REST + Socket `new_notification`):
// {
//   "_id": "6a...",
//   "type": "ORDER",       // ORDER | SYSTEM | SUPPORT | DIY | REPORT
//   "priority": "NORMAL",  // LOW | NORMAL | HIGH
//   "title": "Tiêu đề thông báo",
//   "message": "Nội dung chi tiết",
//   "isRead": false,
//   "createdAt": "2026-09-21T09:15:31.000Z"
// }
// NOTE: the payload uses `isRead` — the FE normalizes it to `read`.
// ============================================================

/** Canonical notification types emitted by the backend. */
export type NotificationType =
  | "ORDER"
  | "SYSTEM"
  | "SUPPORT"
  | "DIY"
  | "REPORT"
  // ── Legacy values from the first FE integration (kept so cached/local
  //    notifications still resolve to the right category) ──
  | "review_request"
  | "report_update"
  | "new_report"
  | "report_assigned"
  | "order_update"
  | "new_order"
  | "order_status_change"
  | "support_diy_update";

/** Notification priority — drives the toast level & the UI accent colour. */
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH";

/** Coarse grouping used for icons, filters and fallback navigation. */
export type NotificationCategory = "ORDER" | "SYSTEM" | "SUPPORT" | "DIY" | "REPORT";

export const NOTIFICATION_CATEGORIES: readonly NotificationCategory[] = [
  "ORDER",
  "REPORT",
  "SUPPORT",
  "DIY",
  "SYSTEM",
];

/** Human label for each category (used by filter chips). */
export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  ORDER: "Orders",
  REPORT: "Reports",
  SUPPORT: "Support DIY",
  DIY: "DIY Posts",
  SYSTEM: "System",
};

/** Emoji shown in toast popups (Sonner) per category. */
export const NOTIFICATION_CATEGORY_EMOJI: Record<NotificationCategory, string> = {
  ORDER: "🛒",
  REPORT: "🚩",
  SUPPORT: "🛠️",
  DIY: "🎨",
  SYSTEM: "🔔",
};

export interface Notification {
  _id: string;
  type: NotificationType;
  /** Defaults to "NORMAL" when the server omits it. */
  priority: NotificationPriority;
  title: string;
  message: string;
  targetId?: string;
  targetPath?: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
  /** Free-form extras some notifications carry (order code, items, totals…). */
  metadata?: Record<string, unknown>;
}

/**
 * Shape accepted by `addNotification()` — server fields are optional so both
 * socket payloads (full object) and locally generated notifications
 * (type/title/message only) can be pushed into the store.
 */
export interface NewNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  targetId?: string;
  targetPath?: string;
  _id?: string;
  read?: boolean;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
};

/** Normalize a raw priority value coming from the API. */
export function normalizePriority(raw?: string | null): NotificationPriority {
  const value = (raw ?? "").toUpperCase();
  return value === "HIGH" || value === "LOW" ? value : "NORMAL";
}

/**
 * Map any notification type (canonical uppercase or legacy lowercase) to its
 * category. Unknown types fall back to SYSTEM.
 */
export function getNotificationCategory(type: string): NotificationCategory {
  const value = (type ?? "").toUpperCase();
  if (value.startsWith("REPORT")) return "REPORT";
  if (value.startsWith("SUPPORT")) return "SUPPORT";
  if (value.startsWith("ORDER")) return "ORDER";
  if (value.startsWith("DIY")) return "DIY";
  if (value.startsWith("SYSTEM")) return "SYSTEM";
  // Legacy lowercase types ("order_status_change", "new_report", …)
  if (value.includes("ORDER")) return "ORDER";
  if (value.includes("REPORT")) return "REPORT";
  if (value.includes("SUPPORT")) return "SUPPORT";
  if (value.includes("DIY")) return "DIY";
  return "SYSTEM";
}

/**
 * Report notifications (Admin giao phó / xử lý báo cáo).
 * Handles both "REPORT" (new BE contract) and "report_update"/"new_report".
 */
export function isReportNotification(type: string): boolean {
  return getNotificationCategory(type) === "REPORT";
}

/** True for the highest-priority notifications (needs immediate attention). */
export function isHighPriority(priority?: string | null): boolean {
  return normalizePriority(priority) === "HIGH";
}

/**
 * Mongo ObjectId check — only notifications that exist on the server can be
 * marked as read / deleted through the API. Locally generated notifications
 * use a `NOTIF-…` id and must stay client-side.
 */
export function isServerNotificationId(id: string): boolean {
  return /^[0-9a-f]{24}$/i.test(id ?? "");
}

/**
 * Where to navigate when the user clicks a notification.
 * Prefers the backend-provided `targetPath`; otherwise falls back to the
 * destination matching the notification category + the user's role.
 */
export function resolveNotificationPath(
  notification: { type: string; targetPath?: string },
  role?: string | null,
): string | undefined {
  if (notification.targetPath) return notification.targetPath;

  const isAdmin = role === "admin";
  const isStaff = role === "staff";

  switch (getNotificationCategory(notification.type)) {
    case "ORDER":
      if (isAdmin) return "/admin/orders";
      if (isStaff) return "/staff/orders";
      return "/purchased";
    case "REPORT":
      if (isAdmin) return "/admin/reports";
      if (isStaff) return "/staff/reports";
      return "/orders/reports";
    case "SUPPORT":
      // Customers have no support-diy list page — keep them on the inbox.
      if (isAdmin) return "/admin/support-diy";
      return "/notifications";
    case "DIY":
      return isAdmin ? "/admin/diy-posts" : "/diy";
    default:
      return isAdmin ? "/admin/notifications" : "/notifications";
  }
}
