import axiosClient from "../../lib/axiosClient";
import {
  normalizePriority,
  type Notification,
  type NotificationPriority,
  type NotificationType,
} from "../types/notification.types";

// ============================================================
// Notification REST API — matches BE/FE notification guide
//   GET    /notifications?page=&limit=   history (personal + role-based)
//   PATCH  /notifications/{id}/read      mark one as read
//   DELETE /notifications/{id}           dismiss one
// ============================================================

/** Raw payload returned by the backend (uses `isRead`). */
export interface ApiNotification {
  _id: string;
  type: string;
  priority?: NotificationPriority | string;
  title: string;
  message: string;
  targetId?: string;
  targetPath?: string;
  isRead?: boolean;
  /** Some endpoints also expose the read flag as `read`. */
  read?: boolean;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface NotificationsResponse {
  notifications: ApiNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Raw response envelope — the list may sit under a few different keys. */
interface RawNotificationsEnvelope {
  status?: string;
  data?:
    | NotificationsResponse
    | {
        notifications?: ApiNotification[];
        items?: ApiNotification[];
        results?: ApiNotification[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      };
  notifications?: ApiNotification[];
}

/**
 * Normalize the various backend envelope shapes into one list + paging info.
 * Defensive on purpose: the notification module is new, and older builds
 * returned `{ data: { notifications } }` while others nest it deeper.
 */
export function extractNotifications(
  payload: RawNotificationsEnvelope | undefined,
  fallbackPage = 1,
  fallbackLimit = 20,
): NotificationsResponse {
  const container = payload?.data ?? {};
  const list =
    (container as NotificationsResponse).notifications ??
    (container as { items?: ApiNotification[] }).items ??
    (container as { results?: ApiNotification[] }).results ??
    payload?.notifications ??
    [];

  return {
    notifications: Array.isArray(list) ? list : [],
    total: (container as NotificationsResponse).total ?? list.length,
    page: (container as NotificationsResponse).page ?? fallbackPage,
    limit: (container as NotificationsResponse).limit ?? fallbackLimit,
    totalPages: (container as NotificationsResponse).totalPages ?? 1,
  };
}

/**
 * Convert a backend notification into the FE `Notification` model
 * (`isRead` → `read`, priority normalized, metadata fallback).
 */
export function mapApiNotification(apiNotif: ApiNotification): Notification {
  return {
    _id: apiNotif._id,
    type: apiNotif.type as NotificationType,
    priority: normalizePriority(apiNotif.priority),
    title: apiNotif.title,
    message: apiNotif.message,
    targetId: apiNotif.targetId,
    targetPath: apiNotif.targetPath,
    read: apiNotif.isRead ?? apiNotif.read ?? false,
    createdAt: apiNotif.createdAt,
    updatedAt: apiNotif.updatedAt,
    metadata: apiNotif.metadata ?? apiNotif.data,
  };
}

export const notificationService = {
  /** GET /notifications — personal + role-based system notifications. */
  getAll: (params?: { page?: number; limit?: number }) =>
    axiosClient.get<RawNotificationsEnvelope>("/notifications", { params }),

  /** PATCH /notifications/{id}/read — clears the unread dot. */
  markAsRead: (id: string) =>
    axiosClient.patch<{ status: string; data: { notification: ApiNotification } }>(
      `/notifications/${id}/read`,
    ),

  /** DELETE /notifications/{id} — dismiss a single notification. */
  delete: (id: string) =>
    axiosClient.delete<{ status: string; data: { notification: ApiNotification } }>(
      `/notifications/${id}`,
    ),
};

