export type NotificationType =
  | "review_request"
  | "report_update"
  | "new_report"
  | "report_assigned"
  | "order_update"
  | "new_order"
  | "order_status_change"
  | "support_diy_update";

/**
 * Notification types that are report-related. Admin chỉ muốn nhận
 * những thông báo về Report (báo cáo), không nhận những tin nhắn khác.
 */
export const REPORT_NOTIFICATION_TYPES: readonly NotificationType[] = [
  "report_update",
  "new_report",
  "report_assigned",
];

/** Kiểm tra 1 notification có phải loại Report hay không. */
export function isReportNotification(type: string): boolean {
  return type.startsWith("report");
}

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  targetId?: string;
  targetPath?: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}
