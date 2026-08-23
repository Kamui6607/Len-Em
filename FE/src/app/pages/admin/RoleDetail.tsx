import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../shared/hooks/useAuth";
import {
  roleService,
  type RoleDetail as RoleDetailType,
} from "../../../shared/api/roleService";
import {
  permissionService,
  type Permission,
} from "../../../shared/api/permissionService";
import { PermissionPicker } from "../../../shared/components/admin/PermissionPicker";
import { AdminBackHeader } from "../../../shared/components/admin/AdminBackHeader";
import { AdminPanel, AdminPanelHeader } from "../../../shared/components/admin/AdminPanel";
import { AdminActivePill } from "../../../shared/components/admin/AdminStatusPill";

export function RoleDetail() {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [role, setRole] = useState<RoleDetailType | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  // Fetch role detail & permissions
  useEffect(() => {
    if (!roleId) return;
    const id: string = roleId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [roleRes, permRes] = await Promise.all([
          roleService.getById(id),
          permissionService.getAll({ limit: 100 }),
        ]);

        if (cancelled) return;

        // GET /roles/{id} → { status, data: { role: { message, data: RoleDetail } } }
        // roleRes.data = { status, data: { role: { message, data: { ...role } } } }
        const roleWrapper = roleRes.data?.data?.role;
        const roleData = roleWrapper?.data;
        if (roleData) {
          // Normalize: map roleName -> name, permission -> permissions
          const normalized = {
            ...roleData,
            name: roleData.roleName || roleData.name,
            permissions: roleData.permission || roleData.permissions || [],
            permission: roleData.permission || [],
          };
          setRole(normalized);
          setSelectedPermissionIds(normalized.permissions);
        } else {
          setRole(null);
        }

        // GET /permissions → { status, data: { data: Permission[], total, page, limit, totalPages } }
        setAllPermissions(permRes.data.data?.data ?? []);
      } catch (err) {
        console.error("Failed to load role detail:", err);
        if (!cancelled) {
          toast.error("Failed to load role details");
          navigate("/admin/roles");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [roleId, navigate]);


  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading...</div>
    );
  }

  if (!role) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Shield size={40} className="mx-auto mb-3 opacity-40" />
        <p>Role not found</p>
        <button
          onClick={() => navigate("/admin/roles")}
          className="mt-4 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Back to roles
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminBackHeader
        title={role.name}
        subtitle={
          <span className="flex items-center gap-2">
            {role.description || "No description"}
            <AdminActivePill active={role.isActive} activeLabel="Active" inactiveLabel="Inactive" />
          </span>
        }
        onBack={() => navigate("/admin/roles")}
      />

      {/* Permission Assignment */}
      <AdminPanel>
        <AdminPanelHeader
          icon={<Shield className="w-4.5 h-4.5" />}
          title="Assigned Permissions"
          subtitle={`${selectedPermissionIds.length} permission${selectedPermissionIds.length !== 1 ? "s" : ""} selected${!isAdmin ? " (read-only)" : ""}`}
        />
        <div className="relative z-10" style={{ background: "var(--card)" }}>
          <PermissionPicker
            permissions={allPermissions}
            selected={selectedPermissionIds}
            onChange={setSelectedPermissionIds}
            disabled={true}
          />
        </div>
      </AdminPanel>
    </div>
  );
}