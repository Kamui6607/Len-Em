// ============================================================
// Order Status Constants — shared across customer & admin views
// ============================================================

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PREPARING: "Đang chuẩn bị",
  SHIPPING: "Đang giao hàng",
  DELIVERED: "Đã giao hàng",
  CANCELLED: "Đã hủy",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã Thanh Toán",
  FAILED: "Thất bại",
  REFUNDED: "Đã hoàn tiền",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PREPARING: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  SHIPPING: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  DELIVERED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  REFUNDED: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

/**
 * Get inline style object for order status badges using CSS custom properties.
 * This respects the design system's --status-* tokens for both light & dark modes.
 */
export function getPaymentStatusStyle(status: string): React.CSSProperties {
  const base: React.CSSProperties = {};
  switch (status) {
    case "PAID":
      base.background = "var(--status-success-bg)";
      base.color = "var(--status-success-text)";
      base.border = "1px solid var(--status-success-border)";
      break;
    case "PENDING":
      base.background = "var(--status-pending-bg)";
      base.color = "var(--status-pending-text)";
      base.border = "1px solid var(--status-pending-border)";
      break;
    case "FAILED":
    case "REFUNDED":
      base.background = "var(--status-error-bg)";
      base.color = "var(--status-error-text)";
      base.border = "1px solid var(--status-error-border)";
      break;
    default:
      base.background = "var(--status-info-bg)";
      base.color = "var(--status-info-text)";
      base.border = "1px solid var(--status-info-border)";
      break;
  }
  return base;
}

export function getOrderStatusStyle(status: string): React.CSSProperties {
  const base: React.CSSProperties = {};
  switch (status) {
    case "DELIVERED":
    case "CONFIRMED":
    case "PREPARING":
    case "SHIPPING":
      base.background = "var(--status-success-bg)";
      base.color = "var(--status-success-text)";
      base.border = "1px solid var(--status-success-border)";
      break;
    case "PENDING":
      base.background = "var(--status-pending-bg)";
      base.color = "var(--status-pending-text)";
      base.border = "1px solid var(--status-pending-border)";
      break;
    case "CANCELLED":
      base.background = "var(--status-error-bg)";
      base.color = "var(--status-error-text)";
      base.border = "1px solid var(--status-error-border)";
      break;
    default:
      base.background = "var(--status-info-bg)";
      base.color = "var(--status-info-text)";
      base.border = "1px solid var(--status-info-border)";
      break;
  }
  return base;
}

/**
 * Valid status transitions for admin order management.
 * Keys are current status, values are allowed next statuses.
 */
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  VNPAY: "VNPAY",
  CASH: "Tiền mặt (COD)",
  BANK: "Chuyển khoản",
};