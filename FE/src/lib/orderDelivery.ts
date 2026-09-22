// ============================================================
// Order delivery helpers — shared by the order detail card, the
// purchased list and the order success page.
// ============================================================

/**
 * Backend fills `expectedDeliveryTime` from the GHN lead-time API as soon as
 * the order is created (it can be null when GHN was unreachable).
 * Formats it as "25/09/2026 14:30"; returns "" when missing/unusable.
 */
export function formatExpectedDelivery(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Whether the order is still on its way — the lead time is only useful then. */
export function isAwaitingDelivery(orderStatus?: string): boolean {
  return (
    orderStatus !== "DELIVERED" &&
    orderStatus !== "CANCELLED" &&
    orderStatus !== "REJECTED"
  );
}
