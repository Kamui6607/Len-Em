// ============================================================
// Permission Service â€” all API calls related to permissions
// ============================================================
// Actual BE response shapes:
//   GET /permissions/resources â†’ { status: "success", data: { resources: string[], actions: string[] } }
//   GET /permissions â†’ { status: "success", data: { data: Permission[], total, page, limit, totalPages } }
//   GET /permissions/{id} â†’ { status: "success", data: { permission: Permission } }
//   POST /permissions â†’ { status: "success", data: { permission: Permission } }
//   PATCH /permissions/{id} â†’ { status: "success", data: { permission: Permission } }
//   DELETE /permissions/{id} â†’ { status: "success", message: string }
// ============================================================

import axiosClient from "../../lib/axiosClient";
import type { ApiResponse } from "../types/auth.types";
import type {
  Permission,
  PermissionsListResponse,
  PermissionStatistics,
  CreatePermissionRequest,
  UpdatePermissionRequest,
} from "../types/permission";

const PERMISSIONS_BASE = "/permissions";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface PermissionResource {
  resource: string;
  actions: string[];
}

// Raw response: GET /permissions â†’ data.data (list)
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

// â”€â”€â”€ Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const permissionService = {
  /** GET /permissions/resources â€” Get list of resources and their actions */
  getResources: () =>
    axiosClient.get<ApiResponse<RawResourcesData>>(`${PERMISSIONS_BASE}/resources`),

  /** GET /permissions â€” List permissions with filters & pagination */
  getAll: (params?: {
    page?: number;
    limit?: number;
    name?: string;
    resource?: string;
    action?: string;
  }) =>
    axiosClient.get<ApiResponse<RawPermissionsData>>(PERMISSIONS_BASE, { params }),

  /** GET /permissions/statistics â€” Get permission statistics */
  getStatistics: () =>
    axiosClient.get<ApiResponse<PermissionStatistics>>(`${PERMISSIONS_BASE}/statistics`),

  /** GET /permissions/{permissionId} â€” Get permission by ID */
  getById: (permissionId: string) =>
    axiosClient.get<ApiResponse<{ permission: Permission }>>(`${PERMISSIONS_BASE}/${permissionId}`),

  /** POST /permissions â€” Create a new permission (Admin only) */
  create: (data: CreatePermissionRequest) =>
    axiosClient.post<ApiResponse<{ permission: Permission }>>(PERMISSIONS_BASE, data),

  /** PATCH /permissions/{permissionId} â€” Update a permission (Admin only) */
  update: (permissionId: string, data: UpdatePermissionRequest) =>
    axiosClient.patch<ApiResponse<{ permission: Permission }>>(`${PERMISSIONS_BASE}/${permissionId}`, data),

  /** DELETE /permissions/{permissionId} â€” Hard delete a permission (Admin only) */
  delete: (permissionId: string) =>
    axiosClient.delete<ApiResponse<{ deletedPermission?: { _id: string; name: string } }>>(
      `${PERMISSIONS_BASE}/${permissionId}`
    ),
};

export type { Permission, PermissionsListResponse, PermissionStatistics, CreatePermissionRequest, UpdatePermissionRequest };