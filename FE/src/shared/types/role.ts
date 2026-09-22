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


// NOTE: the raw -> UI role mapping lives in `src/shared/api/roleService.ts`
// (normalizeRole / extractRoles) so there is a single source of truth.
