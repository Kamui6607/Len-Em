// ============================================================
// Permission Service — all API calls related to permissions
// ============================================================
// Actual BE response shapes:
//   GET /permissions/resources → { status: "success", data: { resources: string[], actions: string[] } }
//   GET /permissions → { status: "success", data: { data: Permission[], total, page, limit, totalPages } }
//   GET /permissions/{id} → { status: "success", data: { permission: Permission } }
//   POST /permissions → { status: "success", data: { permission: Permission } }
//   PATCH /permissions/{id} → { status: "success", data: { permission: Permission } }
//   DELETE /permissions/{id} → { status: "success", message: string }
// ============================================================

import axiosClient from "../lib/axiosClient";
import type { ApiResponse } from "../types/auth.types";
import type {
  Permission,
  PermissionsListResponse,
  PermissionStatistics,
  CreatePermissionRequest,
  UpdatePermissionRequest,
} from "../types/permission";

const PERMISSIONS_BASE = "/permissions";

// ─── Types ───────────────────────────────────────────────

export interface PermissionResource {
  resource: string;
  actions: string[];
}

// Raw response: GET /permissions → data.data (list)
interface RawPermissionsData {
  data: Permission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Raw response: GET /permissions/resources
interface RawResourcesData {
  resources: string[];
  actions: string[];
}

// ─── Service ─────────────────────────────────────────────

export const permissionService = {
  /** GET /permissions/resources — Get list of resources and their actions */
  getResources: () =>
    axiosClient.get<ApiResponse<RawResourcesData>>(`${PERMISSIONS_BASE}/resources`),

  /** GET /permissions — List permissions with filters & pagination */
  getAll: (params?: {
    page?: number;
    limit?: number;
    name?: string;
    resource?: string;
    action?: string;
  }) =>
    axiosClient.get<ApiResponse<RawPermissionsData>>(PERMISSIONS_BASE, { params }),

  /** GET /permissions/statistics — Get permission statistics */
  getStatistics: () =>
    axiosClient.get<ApiResponse<PermissionStatistics>>(`${PERMISSIONS_BASE}/statistics`),

  /** GET /permissions/{permissionId} — Get permission by ID */
  getById: (permissionId: string) =>
    axiosClient.get<ApiResponse<{ permission: Permission }>>(`${PERMISSIONS_BASE}/${permissionId}`),

  /** POST /permissions — Create a new permission (Admin only) */
  create: (data: CreatePermissionRequest) =>
    axiosClient.post<ApiResponse<{ permission: Permission }>>(PERMISSIONS_BASE, data),

  /** PATCH /permissions/{permissionId} — Update a permission (Admin only) */
  update: (permissionId: string, data: UpdatePermissionRequest) =>
    axiosClient.patch<ApiResponse<{ permission: Permission }>>(`${PERMISSIONS_BASE}/${permissionId}`, data),

  /** DELETE /permissions/{permissionId} — Hard delete a permission (Admin only) */
  delete: (permissionId: string) =>
    axiosClient.delete<ApiResponse<{ deletedPermission?: { _id: string; name: string } }>>(
      `${PERMISSIONS_BASE}/${permissionId}`
    ),
};

export type { Permission, PermissionsListResponse, PermissionStatistics, CreatePermissionRequest, UpdatePermissionRequest };