// ============================================================
// Order Status Constants — shared across customer & admin views
// ============================================================

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED"
  | "PROCESSED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PREPARING: "Đang chuẩn bị",
  SHIPPING: "Đang giao hàng",
  DELIVERED: "Đã giao hàng",
  CANCELLED: "Đã hủy",
  REJECTED: "Bị từ chối",
  PROCESSED: "Đã xử lý",
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
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PROCESSED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  REFUNDED: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

/**
 * Get badge class name for payment status badges.
 * Uses the design system's badge classes for consistent styling.
 */
export function getPaymentStatusBadgeClass(status: string): string {
  switch (status) {
    case "PAID":
      return "badge-green";
    case "PENDING":
      return "badge-orange";
    case "FAILED":
    case "REFUNDED":
      return "badge-red";
    default:
      return "badge-blue";
  }
}

/**
 * Get badge class name for order status badges.
 * Uses the design system's badge classes for consistent styling with LED glow effects.
 */
export function getOrderStatusBadgeClass(status: string): string {
  switch (status) {
    case "DELIVERED":
    case "PROCESSED":
      return "badge-green";
    case "CONFIRMED":
    case "PREPARING":
    case "SHIPPING":
      return "badge-blue";
    case "PENDING":
      return "badge-orange";
    case "CANCELLED":
    case "REJECTED":
      return "badge-red";
    default:
      return "badge-blue";
  }
}

/**
 * Valid status transitions for admin order management.
 * Keys are current status, values are allowed next statuses.
 */
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "REJECTED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
  PROCESSED: [],
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  VNPAY: "VNPAY",
  MOMO: "MoMo",
  CASH: "Tiền mặt (COD)",
  BANK: "Chuyển khoản",
};
