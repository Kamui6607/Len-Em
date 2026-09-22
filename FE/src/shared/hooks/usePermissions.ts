// ============================================================
// usePermissions — lấy danh sách permissions của 1 role từ API
// để quyết định hiển thị/ẩn chức năng theo quyền hạn.
//
// Ví dụ: role "Staff" có permissions ["users:read", "orders:update", ...]
// Component có thể gọi:
//   const { hasPermission } = usePermissions("Staff");
//   {hasPermission("users:update") && <button>Edit</button>}
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { loadRoles } from "../api/roleService";

/**
 * Fixed-role model: the backend no longer keeps a permission list per role
 * (GET /roles now returns only `_id` + `roleName`), so the app is gated by
 * role. This map keeps the existing UI gating working without an extra API.
 */
const FIXED_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["*"],
  staff: [
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    "users:manage",
    "orders:read",
    "orders:update",
    "reports:read",
    "reports:update",
    "products:read",
  ],
  creator: ["courses:create", "courses:update", "courses:delete", "diy:create", "diy:update"],
  cus: ["orders:create", "orders:read", "reports:create", "reviews:create"],
  user: ["orders:create", "orders:read", "reports:create", "reviews:create"],
};

/** Permissions baked into the app for the 3 fixed roles. */
export function getFixedRolePermissions(roleName?: string): string[] {
  if (!roleName) return [];
  const key = roleName.trim().toLowerCase();
  if (key === "customer") return FIXED_ROLE_PERMISSIONS.cus;
  return FIXED_ROLE_PERMISSIONS[key] ?? [];
}

export interface UsePermissionsResult {
  /** Danh sách permission dạng "resource:action" của role hiện tại. */
  permissions: string[];
  loading: boolean;
  /** Kiểm tra 1 permission cụ thể (ví dụ: "users:update"). */
  hasPermission: (permission: string) => boolean;
  /** Kiểm tra có ít nhất 1 trong danh sách permission hay không. */
  hasAnyPermission: (permissions: string[]) => boolean;
}

/**
 * @param roleName Tên role cần lấy permissions (ví dụ "Staff", "Admin").
 *                 So khớp không phân biệt hoa thường.
 */
export function usePermissions(roleName?: string): UsePermissionsResult {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roleName) {
      setPermissions([]);
      return;
    }
    let cancelled = false;

    setLoading(true);
    loadRoles()
      .then((roles) => {
        if (cancelled) return;
        const role = roles.find(
          (r) => r.roleName.toLowerCase() === roleName.toLowerCase(),
        );
        const apiPermissions = role?.permissions ?? [];
        // Fixed-role backend no longer returns permissions → use the built-in map.
        setPermissions(
          apiPermissions.length > 0 ? apiPermissions : getFixedRolePermissions(roleName),
        );
      })
      .catch(() => {
        if (!cancelled) setPermissions(getFixedRolePermissions(roleName));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roleName]);

  const hasPermission = useCallback(
    (permission: string) => {
      const target = permission.toLowerCase();
      return permissions.some((p) => {
        const current = p.toLowerCase();
        return current === target || current === "*" || current === "manage";
      });
    },
    [permissions],
  );

  const hasAnyPermission = useCallback(
    (required: string[]) => required.some((p) => hasPermission(p)),
    [hasPermission],
  );

  return { permissions, loading, hasPermission, hasAnyPermission };
}