// ============================================================
// Role Service — all API calls related to roles
// ============================================================
// Actual BE response shapes:
//   GET /roles → { status: "success", data: { message: "...", data: { roles: Role[], total, page, limit, totalPages } } }
//   GET /roles/{id} → { status: "success", data: { role: { message: "...", data: RoleDetail } } }
//   POST /roles → { status: "success", data: { role: { message: "...", data: { _id, roleName, permission, ... } } } }
//   PATCH /roles/{id} → { status: "success", data: { role: { message: "...", data: { ... } } } }
//   DELETE /roles/{id} → { status: "success", data: { role: { message: "..." } } }
// IMPORTANT: BE response field is "permission" (singular, string[])
//            but POST/PATCH body sends "permissions" (plural).
// ============================================================

import axiosClient from "../lib/axiosClient";
import type { ApiResponse } from "../types/auth.types";
import type {
  Role,
  RoleDetail,
  RolesListResponse,
  RoleStatistics,
  CreateRoleRequest,
  UpdateRoleRequest,
} from "../types/role";

const ROLES_BASE = "/roles";

// ---- Raw response types matching BE actual structure ----

// GET /roles → response.data.data => { message, data: { roles, total, page, limit, totalPages } }
interface RawRoleListWrapper {
  message: string;
  data: {
    roles: Array<{
      _id: string;
      roleName: string;
      permission: string[];
      description?: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// GET /roles/{id} → response.data.data => { role: { message, data: RoleDetail } }
interface RawRoleDetailWrapper {
  role: {
    message: string;
    data: RoleDetail;
  };
}

// POST/PATCH → response.data.data => { role: { message, data: {...} } }
interface RawRoleActionWrapper {
  role: {
    message: string;
    data: {
      _id: string;
      roleName: string;
      permission: string[];
      description?: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
}

export const roleService = {
  /** GET /roles — List roles with filters & pagination */
  getAll: (params?: {
    page?: number;
    limit?: number;
    name?: string;
    isActive?: boolean;
  }) =>
    axiosClient.get<ApiResponse<RawRoleListWrapper>>(ROLES_BASE, { params }),

  /** GET /roles/statistics — Get role statistics */
  getStatistics: () =>
    axiosClient.get<ApiResponse<RoleStatistics>>(`${ROLES_BASE}/statistics`),

  /** GET /roles/{roleId} — Get role detail with permissions */
  getById: (roleId: string) =>
    axiosClient.get<ApiResponse<RawRoleDetailWrapper>>(`${ROLES_BASE}/${roleId}`),

  /** POST /roles — Create a new role (Admin only) */
  create: (data: CreateRoleRequest) =>
    axiosClient.post<ApiResponse<RawRoleActionWrapper>>(ROLES_BASE, {
      name: data.name || data.roleName,
      description: data.description,
      isActive: data.isActive ?? true,
      permissions: data.permissions, // POST body dùng "permissions" (có s)
    }),

  /** PATCH /roles/{roleId} — Update role (Admin only) */
  update: (roleId: string, data: UpdateRoleRequest) =>
    axiosClient.patch<ApiResponse<RawRoleActionWrapper>>(`${ROLES_BASE}/${roleId}`, {
      name: data.name || data.roleName,
      description: data.description,
      isActive: data.isActive,
      permissions: data.permissions, // PATCH body dùng "permissions" (có s)
    }),

  /** DELETE /roles/{roleId} — Soft delete role (Admin only) */
  delete: (roleId: string) =>
    axiosClient.delete<ApiResponse<{ role: { message: string } }>>(
      `${ROLES_BASE}/${roleId}`
    ),
};

/** Helper: map raw BE role to normalized UI shape (add name + permissions aliases) */
export function normalizeRole(raw: {
  _id: string;
  roleName: string;
  permission: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}): Role {
  return {
    _id: raw._id,
    roleName: raw.roleName,
    name: raw.roleName,
    permission: raw.permission ?? [],
    permissions: raw.permission ?? [],
    description: raw.description,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function normalizeRoles(roles: Array<{
  _id: string;
  roleName: string;
  permission: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}>): Role[] {
  return roles.map(normalizeRole);
}

export type { Role, RoleDetail, RolesListResponse, RoleStatistics };
