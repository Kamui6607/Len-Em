// ============================================================
// Role Types — matches backend API contracts
// IMPORTANT: BE response field is "permission" (singular, string[])
//            but POST/PATCH body sends "permissions" (plural).
//            BE response "roleName" maps to UI "name"
// ============================================================

export interface Role {
  _id: string;
  roleName: string;
  name: string;              // alias for roleName for convenience
  permission: string[];      // BE response field (singular)
  permissions: string[];     // alias for permission for convenience
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleDetail extends Role {
  permissionDetails?: {
    _id: string;
    name: string;
    resource: string;
    action: string;
  }[];
}

export interface RolesListResponse {
  roles: Role[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RoleStatistics {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
}

/** Body gửi lên dùng "permissions" (có s) — BE map ngược lại */
export interface CreateRoleRequest {
  name: string;
  roleName?: string;
  description?: string;
  isActive?: boolean;
  permissions?: string[];      // POST body dùng "permissions" (plural)
}

export interface UpdateRoleRequest {
  name?: string;
  roleName?: string;
  description?: string;
  isActive?: boolean;
  permissions?: string[];      // PATCH body dùng "permissions" (plural)
}

/**
 * Helper: map raw BE role to normalized UI Role.
 * BE returns `roleName` + `permission` (singular).
 * UI expects `name` + `permissions` (plural).
 */
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