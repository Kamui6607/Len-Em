// ============================================================
// Notification time helpers — shared by the bell dropdown, the
// customer inbox and the admin notifications page.
// ============================================================

/** Date buckets used to group notifications in the list views. */
export const NOTIFICATION_DATE_GROUPS = [
  "Today",
  "Yesterday",
  "This week",
  "Earlier",
] as const;

export type NotificationDateGroup = (typeof NOTIFICATION_DATE_GROUPS)[number];

/** Which date bucket a notification belongs to. */
export function getDateGroup(date: Date): NotificationDateGroup {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfWeek) return "This week";
  return "Earlier";
}

/** "Just now" / "5m ago" / "3h ago" / "2d ago" / "21 Sep 2026". */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
}
