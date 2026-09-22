// ============================================================
// Role Service â€” all API calls related to roles
// ============================================================
// Actual BE response shapes:
//   GET /roles â†’ { status: "success", data: { message: "...", data: { roles: Role[], total, page, limit, totalPages } } }
//   GET /roles/{id} â†’ { status: "success", data: { role: { message: "...", data: RoleDetail } } }
//   POST /roles â†’ { status: "success", data: { role: { message: "...", data: { _id, roleName, permission, ... } } } }
//   PATCH /roles/{id} â†’ { status: "success", data: { role: { message: "...", data: { ... } } } }
//   DELETE /roles/{id} â†’ { status: "success", data: { role: { message: "..." } } }
// IMPORTANT: BE response field is "permission" (singular, string[])
//            but POST/PATCH body sends "permissions" (plural).
// ============================================================

import axiosClient from "../../lib/axiosClient";
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

// GET /roles â†’ response.data.data => { message, data: { roles, total, page, limit, totalPages } }
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

// GET /roles/{id} â†’ response.data.data => { role: { message, data: RoleDetail } }
interface RawRoleDetailWrapper {
  role: {
    message: string;
    data: RoleDetail;
  };
}

// POST/PATCH â†’ response.data.data => { role: { message, data: {...} } }
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

// ── Role list cache ──────────────────────────────────────────
// Several screens need the same list (user role dropdown, staff filter, roles
// page, permissions hook). Share one request + short cache, and remember
// failures so an unavailable endpoint is not hammered on every render.

const ROLE_CACHE_TTL_MS = 5 * 60 * 1000;
const ROLE_FAILURE_TTL_MS = 60 * 1000;

let roleListCache: { roles: Role[]; at: number } | null = null;
let roleFailureAt = 0;
let inFlightRoles: Promise<Role[]> | null = null;

/** Drop the cache (after create/update/delete, or when the user changes). */
export function clearRoleCache(): void {
  roleListCache = null;
  roleFailureAt = 0;
  inFlightRoles = null;
}

/** Roles already fetched in this session, if any. */
export function getCachedRoles(): Role[] | null {
  return roleListCache?.roles ?? null;
}

/**
 * Load the role list once per session and share it between screens.
 * Throws when the endpoint is unavailable — callers keep their fallbacks.
 */
export function loadRoles(params?: {
  page?: number;
  limit?: number;
  name?: string;
  isActive?: boolean;
}): Promise<Role[]> {
  const now = Date.now();

  if (roleListCache && now - roleListCache.at < ROLE_CACHE_TTL_MS) {
    return Promise.resolve(roleListCache.roles);
  }
  if (inFlightRoles) return inFlightRoles;
  if (roleFailureAt && now - roleFailureAt < ROLE_FAILURE_TTL_MS) {
    return Promise.reject(new Error("Roles endpoint unavailable"));
  }

  inFlightRoles = roleService
    .getAll(params)
    .then(({ data }) => {
      const roles = extractRoles(data);
      roleListCache = { roles, at: Date.now() };
      roleFailureAt = 0;
      return roles;
    })
    .catch((error: unknown) => {
      roleFailureAt = Date.now();
      throw error;
    })
    .finally(() => {
      inFlightRoles = null;
    });

  return inFlightRoles;
}

export const roleService = {
  /** GET /roles â€” List roles with filters & pagination */
  getAll: (params?: {
    page?: number;
    limit?: number;
    name?: string;
    isActive?: boolean;
  }) =>
    axiosClient.get<ApiResponse<RawRoleListWrapper>>(ROLES_BASE, { params }),

  /** GET /roles/statistics â€” Get role statistics */
  getStatistics: () =>
    axiosClient.get<ApiResponse<RoleStatistics>>(`${ROLES_BASE}/statistics`),

  /** GET /roles/{roleId} â€” Get role detail with permissions */
  getById: (roleId: string) =>
    axiosClient.get<ApiResponse<RawRoleDetailWrapper>>(`${ROLES_BASE}/${roleId}`),

  /** POST /roles â€” Create a new role (Admin only) */
  create: (data: CreateRoleRequest) =>
    axiosClient.post<ApiResponse<RawRoleActionWrapper>>(ROLES_BASE, {
      name: data.name || data.roleName,
      description: data.description,
      isActive: data.isActive ?? true,
      permissions: data.permissions, // POST body dĂ¹ng "permissions" (cĂ³ s)
    }),

  /** PATCH /roles/{roleId} â€” Update role (Admin only) */
  update: (roleId: string, data: UpdateRoleRequest) =>
    axiosClient.patch<ApiResponse<RawRoleActionWrapper>>(`${ROLES_BASE}/${roleId}`, {
      name: data.name || data.roleName,
      description: data.description,
      isActive: data.isActive,
      permissions: data.permissions, // PATCH body dĂ¹ng "permissions" (cĂ³ s)
    }),

  /** DELETE /roles/{roleId} â€” Soft delete role (Admin only) */
  delete: (roleId: string) =>
    axiosClient.delete<ApiResponse<{ role: { message: string } }>>(
      `${ROLES_BASE}/${roleId}`
    ),
};

/**
 * Raw role object as returned by the backend.
 * The fixed-role model only guarantees `_id` + `roleName`; `permission`,
 * `isActive`, timestamps, … may be missing, so every field is optional here.
 */
export interface RawRole {
  _id: string;
  roleName?: string;
  name?: string;
  permission?: string[];
  permissions?: string[];
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Helper: map raw BE role to the normalized UI shape (name + permissions aliases). */
export function normalizeRole(raw: RawRole): Role {
  const roleName = raw.roleName ?? raw.name ?? "";
  const permission = raw.permission ?? raw.permissions ?? [];

  return {
    _id: raw._id,
    roleName,
    name: roleName,
    permission,
    permissions: permission,
    description: raw.description,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
  };
}

export function normalizeRoles(roles: RawRole[]): Role[] {
  return roles.map(normalizeRole);
}

/**
 * Pull the role list out of any envelope the backend has used:
 *   NEW  GET /roles → { status, data: Role[] }                       (fixed roles)
 *   OLD  GET /roles → { status, data: { message, data: { roles } } } (paginated)
 *   also { status, data: { roles: Role[] } } / { roles: Role[] }
 */
export function extractRoles(body: unknown): Role[] {
  const candidates: unknown[] = [];
  const push = (value: unknown) => {
    if (Array.isArray(value)) candidates.push(value);
  };

  const root = body as { data?: unknown; roles?: unknown } | null | undefined;
  push(root?.roles);
  push(root?.data);

  const inner = root?.data as { roles?: unknown; data?: unknown } | undefined;
  push(inner?.roles);
  push(inner?.data);

  const deep = inner?.data as { roles?: unknown } | undefined;
  push(deep?.roles);

  const list = (candidates[0] ?? []) as RawRole[];
  return list
    .filter((role) => role && typeof role === "object" && typeof role._id === "string")
    .map(normalizeRole);
}

export type { Role, RoleDetail, RolesListResponse, RoleStatistics };
