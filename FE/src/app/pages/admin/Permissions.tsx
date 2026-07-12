import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Shield,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../hooks/useAuth";
import {
  permissionService,
  type Permission,
  type PermissionResource,
} from "../../../api/permissionService";
import { AdminSelect } from "../../components/admin/AdminSelect";
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

// ─── Permission Form Data ────────────────────────────────

interface PermissionFormData {
  name: string;
  resource: string;
  action: string;
  description: string;
}

const emptyForm: PermissionFormData = {
  name: "",
  resource: "",
  action: "",
  description: "",
};

// ─── Permission Modal ────────────────────────────────────

interface PermissionModalProps {
  open: boolean;
  editingId: string | null;
  form: PermissionFormData;
  resources: PermissionResource[];
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
    resources,
    saving,
    fieldErrors,
    onChange,
    onSave,
    onClose,
  }: PermissionModalProps) {
    if (!open) return null;

    const filteredActions =
      resources.find((r) => r.resource === form.resource)?.actions ?? [];

    return (
      <div className="admin-dialog-overlay" onClick={onClose}>
        <div
          className="admin-dialog-content max-w-lg max-h-[90vh] overflow-y-auto"
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
                  placeholder="e.g. create_product"
                />
                {fieldErrors.name && (
                  <p className="text-xs text-destructive mt-1">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Resource <span className="text-destructive">*</span>
                </label>
                <AdminSelect
                  value={form.resource}
                  placeholder="Select resource"
                  options={resources.map((r) => ({
                    value: r.resource,
                    label: r.resource,
                  }))}
                  onChange={(value) =>
                    onChange({ ...form, resource: value, action: "" })
                  }
                  buttonClassName={fieldErrors.resource ? "border-destructive" : ""}
                />
                {fieldErrors.resource && (
                  <p className="text-xs text-destructive mt-1">
                    {fieldErrors.resource}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  Action <span className="text-destructive">*</span>
                </label>
                <AdminSelect
                  value={form.action}
                  placeholder="Select action"
                  disabled={!form.resource}
                  options={filteredActions.map((action) => ({
                    value: action,
                    label: action,
                  }))}
                  onChange={(value) => onChange({ ...form, action: value })}
                  buttonClassName={fieldErrors.action ? "border-destructive" : ""}
                />
                {fieldErrors.action && (
                  <p className="text-xs text-destructive mt-1">
                    {fieldErrors.action}
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
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  // ── Data state ──
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [resources, setResources] = useState<PermissionResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // ── Filter state ──
  const [searchName, setSearchName] = useState("");
  const [filterResource, setFilterResource] = useState("");
  const [filterAction, setFilterAction] = useState("");

  // ── Modal state ──
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PermissionFormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Delete confirm ──
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);

  // ── Derived actions for resource drop-down ──
  const resourceActions =
    resources.find((r) => r.resource === filterResource)?.actions ?? [];

  // ── Fetch resources once ──
  useEffect(() => {
    permissionService
      .getResources()
      .then((res) => {
        // BE returns { resources: string[], actions: string[] }
        const data = res.data.data;
        const mapped: PermissionResource[] = (data?.resources ?? []).map(
          (r: string) => ({
            resource: r,
            actions: data?.actions ?? [],
          }),
        );
        setResources(mapped);
      })
      .catch(() => {
        // Silently fail
      });
  }, []);

  // ── Fetch permissions ──
  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (searchName.trim()) params.name = searchName.trim();
      if (filterResource) params.resource = filterResource;
      if (filterAction) params.action = filterAction;

      const { data: response } = await permissionService.getAll(params);
      const data = response.data;
      // BE returns { data: Permission[], total, page, limit, totalPages }
      setPermissions(data.data ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  }, [page, searchName, filterResource, filterAction]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // ── Reset page when filters change ──
  useEffect(() => {
    setPage(1);
  }, [searchName, filterResource, filterAction]);

  // ── Validate form ──
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Permission name is required";
    if (!form.resource) errors.resource = "Resource is required";
    if (!form.action) errors.action = "Action is required";
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
  const openEdit = (perm: Permission) => {
    setEditingId(perm._id);
    setForm({
      name: perm.name,
      resource: perm.resource,
      action: perm.action,
      description: perm.description ?? "",
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
          resource: form.resource,
          action: form.action,
          description: form.description.trim() || undefined,
        });
        toast.success("Permission updated successfully");
      } else {
        await permissionService.create({
          name: form.name.trim(),
          resource: form.resource,
          action: form.action,
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
          setFieldErrors({ name: msg || "This name already exists" });
        } else {
          toast.error(msg || "Invalid input. Please check your data.");
        }
      } else if (axiosErr.response?.status === 403) {
        toast.error("You don't have permission to perform this action.");
      } else if (axiosErr.response?.status === 404) {
        toast.error("Permission not found.");
      } else {
        toast.error(axiosErr.message || "Failed to save permission");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await permissionService.delete(deleteTarget._id);
      toast.success(`Permission "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      fetchPermissions();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 403) {
        toast.error("You don't have permission to perform this action.");
      } else if (axiosErr.response?.status === 404) {
        toast.error("Permission not found.");
      } else {
        toast.error("Failed to delete permission");
      }
      setDeleteTarget(null);
    }
  };

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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
          <button onClick={openCreate} className="btn-create">
            <Plus size={18} />
            +create
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg">
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
                ...resources.map((resource) => ({
                  value: resource.resource,
                  label: resource.resource,
                })),
              ]}
              onChange={(value) => {
                setFilterResource(value);
                setFilterAction("");
              }}
              className="min-w-[170px]"
            />

            <AdminSelect
              value={filterAction}
              disabled={!filterResource}
              options={[
                { value: "", label: "All actions" },
                ...resourceActions.map((action) => ({
                  value: action,
                  label: action,
                })),
              ]}
              onChange={setFilterAction}
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
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Resource
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Action
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Created
                  </th>
                  {isAdmin && (
                    <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground w-[100px]">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm) => (
                  <tr
                    key={perm._id}
                    className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-sm">{perm.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-sm bg-muted px-2.5 py-1 rounded-full">
                        {perm.resource}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-sm">{perm.action}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-[200px] truncate">
                      {perm.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(perm.createdAt)}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {}}
                            className="admin-action-btn view"
                            title="View Detail"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEdit(perm)}
                            className="admin-action-btn edit"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(perm)}
                            className="admin-action-btn delete"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
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
        resources={resources}
        saving={saving}
        fieldErrors={fieldErrors}
        onChange={setForm}
        onSave={handleSave}
        onClose={closeModal}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Permission"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ""
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
