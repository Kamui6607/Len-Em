import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Shield,
  AlertTriangle,
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

// ─── Props for ConfirmDialog ─────────────────────────────

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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950">
            <AlertTriangle size={20} className="text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-colors"
          >
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] pb-8 px-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto z-10">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold">
            {editingId ? "Edit Permission" : "Create Permission"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Permission Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              className={`w-full px-4 py-2.5 bg-input-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${
                fieldErrors.name ? "border-destructive" : "border-border"
              }`}
              placeholder="e.g. create_product"
            />
            {fieldErrors.name && (
              <p className="text-xs text-destructive mt-1">
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Resource */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
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

          {/* Action */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                onChange({ ...form, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Optional description..."
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.97]"
          >
            {saving ? "Saving..." : editingId ? "Update" : "Create"}
          </button>
        </div>
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
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all active:scale-[0.97]"
          >
            <Plus size={18} />
            Create Permission
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
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

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : permissions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Shield size={40} className="mx-auto mb-3 opacity-40" />
            <p>No permissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
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
                    className="border-t border-border hover:bg-muted/30 transition-colors"
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
                            onClick={() => openEdit(perm)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(perm)}
                            className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
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
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
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
