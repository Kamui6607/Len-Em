export type NotificationType = "review_request" | "report_update" | "order_update";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  targetId?: string;
  targetPath?: string;
  read: boolean;
  createdAt: string;
}