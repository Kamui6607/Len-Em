import axiosClient from "../lib/axiosClient";

export interface ApiNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  targetId?: string;
  targetPath?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationsResponse {
  notifications: ApiNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const notificationService = {
  getAll: (params?: { page?: number; limit?: number }) =>
    axiosClient.get<{ status: string; data: NotificationsResponse }>("/notifications", { params }),

  markAsRead: (id: string) =>
    axiosClient.patch<{ status: string; data: { notification: ApiNotification } }>(
      `/notifications/${id}/read`,
    ),

  delete: (id: string) =>
    axiosClient.delete<{ status: string; data: { notification: ApiNotification } }>(
      `/notifications/${id}`,
    ),
};
