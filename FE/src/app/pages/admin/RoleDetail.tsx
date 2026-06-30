import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Save, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../hooks/useAuth";
import { roleService, type RoleDetail as RoleDetailType } from "../../../api/roleService";
import { permissionService, type Permission } from "../../../api/permissionService";
import { PermissionPicker } from "../../components/admin/PermissionPicker";

export function RoleDetail() {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [role, setRole] = useState<RoleDetailType | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    return () => { cancelled = true; };
  }, [roleId, navigate]);

  // Save updated permissions
  const handleSave = async () => {
    if (!roleId || !role) return;
    setSaving(true);
    try {
      await roleService.update(roleId, {
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        permissions: selectedPermissionIds,
      });
      toast.success("Role permissions updated successfully");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      if (axiosErr.response?.status === 403) {
        toast.error("You don't have permission to perform this action.");
      } else if (axiosErr.response?.status === 400) {
        toast.error(axiosErr.response.data?.message || "Invalid data");
      } else {
        toast.error(axiosErr.message || "Failed to update role");
      }
    } finally {
      setSaving(false);
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/roles")}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="mb-1">{role.name}</h1>
            <p className="text-sm text-muted-foreground">
              {role.description || "No description"}
              <span className="mx-2">•</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                  role.isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${role.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                {role.isActive ? "Active" : "Inactive"}
              </span>
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.97]"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Permissions"}
          </button>
        )}
      </div>

      {/* Permission Assignment */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-1">Assigned Permissions</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {selectedPermissionIds.length} permission{selectedPermissionIds.length !== 1 ? "s" : ""} selected
          {!isAdmin && " (read-only)"}
        </p>

        <PermissionPicker
          permissions={allPermissions}
          selected={selectedPermissionIds}
          onChange={setSelectedPermissionIds}
          disabled={!isAdmin}
        />
      </div>
    </div>
  );
}