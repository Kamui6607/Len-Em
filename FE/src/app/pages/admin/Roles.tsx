import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Shield,
  Eye,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import { roleService, normalizeRoles } from "../../../api/roleService";
import type { Role } from "../../../types/role";
import { permissionService } from "../../../api/permissionService";
import type { Permission } from "../../../types/permission";
import { PermissionPicker } from "../../components/admin/PermissionPicker";
import { AdminSelect } from "../../components/admin/AdminSelect";

type SortField = "name" | "permissions" | "status" | "created";
type SortDirection = "asc" | "desc";

// ─── Helpers ─────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return dateStr;
  }
}

// ─── Confirm Dialog ──────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

  function ConfirmDialog({
    open,
    title,
    message,
    onConfirm,
    onCancel,
  }: ConfirmDialogProps) {
    if (!open) return null;
    return (
      <div className="admin-dialog-overlay" onClick={onCancel}>
        <div
          className="admin-dialog-content max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="admin-dialog-header">
            <h3 className="text-base font-semibold">{title}</h3>
          </div>
          <div className="admin-dialog-body">
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <div className="admin-dialog-footer">
            <button
              type="button"
              onClick={onCancel}
              className="btn-modal-cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="btn-modal-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

// ─── Role Modal ──────────────────────────────────────────

interface RoleFormData {
  name: string;
  description: string;
  isActive: boolean;
  permissions: string[];
}

const emptyForm: RoleFormData = {
  name: "",
  description: "",
  isActive: true,
  permissions: [],
};

interface RoleModalProps {
  open: boolean;
  editingId: string | null;
  form: RoleFormData;
  allPermissions: Permission[];
  saving: boolean;
  fieldErrors: Record<string, string>;
  onChange: (form: RoleFormData) => void;
  onSave: () => void;
  onClose: () => void;
}

  function RoleModal({
    open,
    editingId,
    form,
    allPermissions,
    saving,
    fieldErrors,
    onChange,
    onSave,
    onClose,
  }: RoleModalProps) {
    if (!open) return null;

    return (
      <div className="admin-dialog-overlay" onClick={onClose}>
        <div
          className="admin-dialog-content max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="admin-dialog-header">
            <h3 className="text-base font-semibold">
              {editingId ? "Edit Role" : "Create Role"}
            </h3>
            <button
              onClick={onClose}
              style={{ color: "var(--foreground-muted)" }}
              className="admin-action-btn absolute top-4 right-4"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
            <div className="admin-dialog-body space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Role Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => onChange({ ...form, name: e.target.value })}
                  className={`input w-full ${fieldErrors.name ? "border-destructive" : ""}`}
                  placeholder="e.g. Manager"
                />
                {fieldErrors.name && (
                  <p className="text-xs text-destructive mt-1">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    onChange({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className="input w-full resize-none"
                  placeholder="Optional description..."
                />
              </div>

              {/* isActive */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    onChange({ ...form, isActive: e.target.checked })
                  }
                  className="rounded border-border"
                />
                <div>
                  <span className="text-sm font-medium">Active</span>
                  <p className="text-xs text-muted-foreground">
                    Inactive roles cannot be assigned to users
                  </p>
                </div>
              </label>

              {/* Permissions */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--foreground-muted)" }}>
                  Permissions
                </label>
                <PermissionPicker
                  permissions={allPermissions}
                  selected={form.permissions}
                  onChange={(perms) => onChange({ ...form, permissions: perms })}
                  maxHeightClassName="max-h-56"
                />
              </div>
            </div>
            <div className="admin-dialog-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn-modal-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-modal-primary"
              >
                {saving ? "Saving…" : editingId ? "Update Role" : "Create Role"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

// ─── Main Component ──────────────────────────────────────

export function Roles() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  // ── Data state ──
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // ── Filter state ──
  const [searchName, setSearchName] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // ── Modal state ──
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoleFormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Delete confirm ──
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  // ── Fetch permissions once ──
  useEffect(() => {
    permissionService
      .getAll({ limit: 100 })
      .then((res) => {
        // BE: { status, data: { data: Permission[], total, page, limit, totalPages } }
        const perms = res.data.data?.data ?? [];
        setAllPermissions(perms);
      })
      .catch((err) => {
        console.error("Failed to load permissions for picker:", err);
      });
  }, []);

  // ── Fetch roles ──
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      // Only send params that are strictly needed
      const params: Record<string, string | number> = {};
      if (page > 1) params.page = page;
      if (limit !== 20) params.limit = limit;
      if (searchName.trim()) params.name = searchName.trim();
      if (filterActive !== null)
        params.isActive = filterActive ? "true" : "false";

      const { data: response } = await roleService.getAll(params);
      // BE: { status, data: { message, data: { roles, total, page, limit, totalPages } } }
      const wrapper = response.data;
      const data = wrapper?.data;
      const rawRoles = data?.roles ?? [];
      setRoles(normalizeRoles(rawRoles));
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 1);
    } catch {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, [page, searchName, filterActive]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // ── Reset page when filters change ──
  useEffect(() => {
    setPage(1);
  }, [searchName, filterActive]);

  // ── Validate ──
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Role name is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Open create modal ──
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setFieldErrors({});
    setShowModal(true);
  };

  // ── Open edit modal ──
  const openEdit = (role: Role) => {
    setEditingId(role._id);
    setForm({
      name: role.name,
      description: role.description ?? "",
      isActive: role.isActive,
      permissions: role.permissions ?? [],
    });
    setFieldErrors({});
    setShowModal(true);
  };

  // ── Close modal ──
  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setFieldErrors({});
  };

  // ── Save (Create / Update) ──
  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        isActive: form.isActive,
        permissions: form.permissions,
      };

      if (editingId) {
        await roleService.update(editingId, payload);
        toast.success("Role updated successfully");
      } else {
        await roleService.create(payload);
        toast.success("Role created successfully");
      }
      closeModal();
      fetchRoles();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      if (axiosErr.response?.status === 400) {
        const msg = axiosErr.response.data?.message ?? "";
        if (
          msg.toLowerCase().includes("name") ||
          msg.toLowerCase().includes("duplicate")
        ) {
          setFieldErrors({ name: msg });
        } else {
          toast.error(msg || "Invalid input");
        }
      } else if (axiosErr.response?.status === 403) {
        toast.error("You don't have permission to perform this action.");
      } else {
        toast.error(axiosErr.message || "Failed to save role");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await roleService.delete(deleteTarget._id);
      toast.success(`Role "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      fetchRoles();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 409) {
        toast.error("Cannot delete: role is currently assigned to users.");
      } else if (axiosErr.response?.status === 403) {
        toast.error("You don't have permission to perform this action.");
      } else {
        toast.error("Failed to delete role");
      }
      setDeleteTarget(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  function SortableHeader({ label, field, align = "left" }: { label: string; field: SortField; align?: "left" | "right" }) {
    const active = sortField === field;
    return (
      <th className={`px-6 py-4 text-sm font-medium text-muted-foreground ${align === "right" ? "text-right" : "text-left"}`}>
        <button
          type="button"
          onClick={() => handleSort(field)}
          className={`group inline-flex items-center gap-1 transition-colors hover:text-foreground focus:outline-none ${active ? "text-foreground" : ""} ${align === "right" ? "flex-row-reverse" : ""}`}
        >
          {label}
          <span className="flex flex-col items-center justify-center -space-y-[3px]">
            <ChevronUp className={`w-2.5 h-2.5 ${active && sortDirection === "asc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
            <ChevronDown className={`w-2.5 h-2.5 ${active && sortDirection === "desc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
          </span>
        </button>
      </th>
    );
  }

  const sortedRoles = [...roles].sort((a, b) => {
    if (!sortField) return 0;
    const getValue = (role: Role) => {
      switch (sortField) {
        case "name": return role.name;
        case "permissions": return role.permissions?.length ?? 0;
        case "status": return role.isActive ? "active" : "inactive";
        case "created": return new Date(role.createdAt).getTime();
      }
    };
    const cmp = String(getValue(a)).localeCompare(String(getValue(b)));
    return sortDirection === "asc" ? cmp : -cmp;
  });

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="mb-2">Role Management</h1>
          <p className="text-muted-foreground">
            {total} role{total !== 1 ? "s" : ""} total
            {!isAdmin && (
              <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                Read-only
              </span>
            )}
          </p>
        </div>
        {isAdmin && (
           <button
             onClick={openCreate}
             className="btn-create"
           >
            <Plus size={16} />
            +create
           </button>
         )}
      </div>

      {/* Table */}
      <div className="admin-panel-glow rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg">
        {/* Filters */}
        <div className="p-6 border-b border-border" style={{ background: "var(--surface)" }}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="input w-full"
                style={{ paddingLeft: "3rem", paddingRight: "1rem", paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
              />
            </div>

            <AdminSelect
              value={filterActive === null ? "" : filterActive ? "true" : "false"}
              options={[
                { value: "", label: "All status" },
                { value: "true", label: "Active", dotClassName: "bg-emerald-500" },
                { value: "false", label: "Inactive", dotClassName: "bg-rose-500" },
              ]}
              onChange={(val) =>
                setFilterActive(val === "" ? null : val === "true")
              }
              className="min-w-[160px]"
            />
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="p-8 text-center text-muted-foreground" style={{ background: "var(--card)" }}>
            Loading...
          </div>
        ) : roles.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground" style={{ background: "var(--card)" }}>
            <Shield size={40} className="mx-auto mb-3 opacity-40" />
            <p>No roles found</p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ background: "var(--card)" }}>
            <table className="admin-table w-full">
              <thead className="bg-muted">
                <tr>
                  <SortableHeader label="Role Name" field="name" />
                  <SortableHeader label="Permissions" field="permissions" align="right" />
                  <SortableHeader label="Status" field="status" />
                  <SortableHeader label="Created" field="created" />
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground w-[140px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRoles.map((role) => (
                  <tr
                    key={role._id}
                    className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-sm">{role.name}</span>
                      {role.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[250px]">
                          {role.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">
                        {role.permissions?.length ?? 0} permissions
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`badge ${
                          role.isActive ? "badge-green" : "badge-red"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${role.isActive ? "bg-emerald-500" : "bg-rose-500"}`}
                        />
                        {role.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(role.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/roles/${role._id}`)}
                          className="admin-action-btn view"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEdit(role)}
                              className="admin-action-btn edit"
                              title="Edit"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(role)}
                              className="admin-action-btn delete"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      <RoleModal
        open={showModal}
        editingId={editingId}
        form={form}
        allPermissions={allPermissions}
        saving={saving}
        fieldErrors={fieldErrors}
        onChange={setForm}
        onSave={handleSave}
        onClose={closeModal}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Role"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This will soft-delete the role.`
            : ""
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
