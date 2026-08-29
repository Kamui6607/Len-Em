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
import { roleService, normalizeRoles } from "../api/roleService";

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
    roleService
      .getAll({ limit: 100 })
      .then((res) => {
        if (cancelled) return;
        // Res.data.data = RawRoleListWrapper { ... , data: { roles, total, ... } }
        const rawRoleList = res.data?.data;
        const roles = normalizeRoles(rawRoleList?.data?.roles ?? []);
        const role = roles.find(
          (r) => r.roleName.toLowerCase() === roleName.toLowerCase(),
        );
        setPermissions(role?.permissions ?? []);
      })
      .catch(() => {
        if (!cancelled) setPermissions([]);
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