export type NotificationType = "review_request" | "report_update" | "order_update" | "new_order" | "order_status_change" | "support_diy_update";

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
