import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit3,
  X,
  Shield,
  Eye,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { HoldToDeleteButton } from "../../components/admin/HoldToDeleteButton";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useAuth } from "../../../hooks/useAuth";
import { permissionService } from "../../../api/permissionService";
import type { Permission } from "../../../types/permission";
import { AdminSelect } from "../../components/admin/AdminSelect";

type SortField = "name" | "resource" | "created";
type SortDirection = "asc" | "desc";

// ─── Helpers ─────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return dateStr;
  }
}

// ─── Permission Modal ────────────────────────────────────

interface PermissionFormData {
  name: string;
  resource: string;
  action: string;
  description: string;
}

const emptyForm: PermissionFormData = {
  name: "",
  resource: "",
  action: "read",
  description: "",
};

interface PermissionModalProps {
  open: boolean;
  editingId: string | null;
  form: PermissionFormData;
  saving: boolean;
  fieldErrors: Record<string, string>;
  onChange: (form: PermissionFormData) => void;
  onSave: () => void;
  onClose: () => void;
}

function PermissionModal({
  open,
  editingId,
  form,
  saving,
  fieldErrors,
  onChange,
  onSave,
  onClose,
}: PermissionModalProps) {
  if (!open) return null;

  return (
    <div className="admin-dialog-overlay" onClick={onClose}>
      <div
        className="admin-dialog-content max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-dialog-header">
          <h3 className="text-base font-semibold">
            {editingId ? "Edit Permission" : "Create Permission"}
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
                Permission Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => onChange({ ...form, name: e.target.value })}
                className={`input w-full ${fieldErrors.name ? "border-destructive" : ""}`}
                placeholder="e.g. users:read"
              />
              {fieldErrors.name && (
                <p className="text-xs text-destructive mt-1">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Resource <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.resource}
                  onChange={(e) => onChange({ ...form, resource: e.target.value })}
                  className="input w-full"
                  placeholder="e.g. users, roles, products"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Action <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.action}
                  onChange={(e) => onChange({ ...form, action: e.target.value })}
                  className="input w-full"
                >
                  <option value="create">Create</option>
                  <option value="read">Read</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="manage">Manage</option>
                </select>
              </div>
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
              {saving ? "Saving…" : editingId ? "Update Permission" : "Create Permission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export function Permissions() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  // ── Data state ──
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // ── Filter state ──
  const [searchName, setSearchName] = useState("");
  const [filterResource, setFilterResource] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // ── Modal state ──
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PermissionFormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Fetch permissions ──
  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (page > 1) params.page = page;
      if (limit !== 20) params.limit = limit;
      if (searchName.trim()) params.name = searchName.trim();
      if (filterResource) params.resource = filterResource;

      const response = await permissionService.getAll(params);
      const listData = response.data?.data;
      const rawPermissions = listData?.data ?? [];
      setPermissions(rawPermissions);
      setTotal(listData?.total ?? 0);
      setTotalPages(listData?.totalPages ?? 1);
    } catch {
      toast.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  }, [page, searchName, filterResource]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // ── Reset page when filters change ──
  useEffect(() => {
    setPage(1);
  }, [searchName, filterResource]);

  // ── Validate ──
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Permission name is required";
    if (!form.resource.trim()) errors.resource = "Resource is required";
    if (!form.action.trim()) errors.action = "Action is required";
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
  const openEdit = (permission: Permission) => {
    setEditingId(permission._id);
    setForm({
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description ?? "",
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
      if (editingId) {
        await permissionService.update(editingId, {
          name: form.name.trim(),
          resource: form.resource.trim(),
          action: form.action.trim(),
          description: form.description.trim() || undefined,
        });
        toast.success("Permission updated successfully");
      } else {
        await permissionService.create({
          name: form.name.trim(),
          resource: form.resource.trim(),
          action: form.action.trim(),
          description: form.description.trim() || undefined,
        });
        toast.success("Permission created successfully");
      }
      closeModal();
      fetchPermissions();
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
        toast.error(axiosErr.message || "Failed to save permission");
      }
    } finally {
      setSaving(false);
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

  const sortedPermissions = [...permissions].sort((a, b) => {
    if (!sortField) return 0;
    const getValue = (permission: Permission) => {
      switch (sortField) {
        case "name": return permission.name;
        case "resource": return permission.resource;
        case "created": return new Date(permission.createdAt).getTime();
      }
    };
    const cmp = String(getValue(a)).localeCompare(String(getValue(b)));
    return sortDirection === "asc" ? cmp : -cmp;
  });

  // Get unique resources for filter
  const uniqueResources = Array.from(new Set(permissions.map(p => p.resource)));

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="mb-2">Permission Management</h1>
          <p className="text-muted-foreground">
            {total} permission{total !== 1 ? "s" : ""} total
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
            create
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
              value={filterResource}
              options={[
                { value: "", label: "All resources" },
                ...uniqueResources.map(r => ({ value: r, label: r }))
              ]}
              onChange={(val) => setFilterResource(val)}
              className="min-w-[160px]"
            />
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="p-8 text-center text-muted-foreground" style={{ background: "var(--card)" }}>
            Loading...
          </div>
        ) : permissions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground" style={{ background: "var(--card)" }}>
            <Shield size={40} className="mx-auto mb-3 opacity-40" />
            <p>No permissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ background: "var(--card)" }}>
            <table className="admin-table w-full">
              <thead className="bg-muted">
                <tr>
                  <SortableHeader label="Permission Name" field="name" />
                  <SortableHeader label="Resource" field="resource" />
                  <SortableHeader label="Action" field="name" />
                  <SortableHeader label="Created" field="created" />
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground w-[140px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPermissions.map((permission) => (
                  <tr
                    key={permission._id}
                    className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-sm">{permission.name}</span>
                      {permission.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[250px]">
                          {permission.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{permission.resource}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge badge-blue">
                        {permission.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(permission.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/permissions/${permission._id}`)}
                          className="admin-action-btn view"
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEdit(permission)}
                              className="admin-action-btn edit"
                              title="Edit"
                            >
                              <Edit3 size={16} />
                            </button>
                            <HoldToDeleteButton
                              onDelete={async () => {
                                try {
                                  await permissionService.delete(permission._id);
                                  toast.success(`Permission "${permission.name}" deleted`);
                                  fetchPermissions();
                                } catch (err: unknown) {
                                  const axiosErr = err as { response?: { status?: number } };
                                  if (axiosErr.response?.status === 409) {
                                    toast.error("Cannot delete: permission is currently assigned to roles.");
                                  } else if (axiosErr.response?.status === 403) {
                                    toast.error("You don't have permission to perform this action.");
                                  } else {
                                    toast.error("Failed to delete permission");
                                  }
                                }
                              }}
                              title="Hold 2s to delete"
                            />
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
      <PermissionModal
        open={showModal}
        editingId={editingId}
        form={form}
        saving={saving}
        fieldErrors={fieldErrors}
        onChange={setForm}
        onSave={handleSave}
        onClose={closeModal}
      />
    </div>
  );
}