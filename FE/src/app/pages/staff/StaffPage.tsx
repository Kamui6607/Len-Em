// ============================================================
// StaffPage — routes /staff, /staff/orders, /staff/users, /staff/reports
// Yêu cầu:
//  - Staff CHỈ xử lý Pending Orders (trang /staff/orders).
//  - Users: Staff chỉ được XEM. Các chức năng xử lý (Create/Edit/Delete)
//    chỉ hiển thị KHI role Staff có permission (users:create/update/delete)
//    — nếu không có sẽ ẩn hoàn toàn.
//  - Reports: báo cáo do Admin gán cho staff xử lý (trang /staff/reports).
// Lưu ý: Staff KHÔNG dùng AdminPage (toàn quyền CRUD) nữa.
// ============================================================

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  CheckCircle,
  Pencil,
  Trash2,
  Plus,
  ShieldAlert,
  X,
  Users as UsersIcon,
  Flag,
} from "lucide-react";
import { useLocation } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../../../shared/hooks/useAuth";
import { usePermissions } from "../../../shared/hooks/usePermissions";
import {
  useAdmin,
  type AdminUser,
} from "../../../shared/contexts/AdminContext";
import { formatPrice } from "../../../lib/formatPrice";
import { StaffReports } from "./StaffReports";
import { orderService } from "../../../features/orders/services/order.service";
import type { NavItem } from "../../../shared/components/dashboard/Sidebar";
import type { Order } from "../../../features/orders/types/order.types";
import { normalizeOrder } from "../../../features/orders/types/order.types";
import { DashboardShell } from "../../../shared/components/dashboard/DashboardShell";

const staffNavItems: NavItem[] = [
  { path: "/staff/orders", label: "Pending Orders", icon: ShoppingCart },
  { path: "/staff/users", label: "Users", icon: UsersIcon },
  { path: "/staff/reports", label: "Reports", icon: Flag },
];

// ─── Pending Orders (Staff xử lý) ─────────────────────────────
function PendingOrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { logActivity } = useAdmin();
  const { user } = useAuth();

  useEffect(() => {
    async function loadOrders() {
      try {
        const { data: response } = await orderService.getAllOrders({ page: 1, limit: 20 });
        setOrders(response.orders.map(normalizeOrder));
      } catch {
        // API unavailable — empty state
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const pendingOrders = orders.filter((o) => o.orderStatus === "PENDING");

  const handleConfirmCashPayment = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, { orderStatus: "CONFIRMED" });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? { ...o, orderStatus: "CONFIRMED" as const, payment: { ...o.payment, status: "PAID" as const } }
            : o,
        ),
      );
      logActivity({
        type: "payment_confirmed",
        userId: user?.email || "staff",
        userName: user?.fullName || "Staff",
        description: `Confirmed cash payment for order ${orderId} at store`,
      });
      toast.success("Cash payment confirmed");
    } catch {
      toast.error("Failed to confirm payment");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl mb-2">Pending Orders</h1>
        <p className="text-muted-foreground">
          Staff xử lý các đơn hàng Pending — xác nhận thanh toán & gửi đi
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : pendingOrders.length > 0 ? (
        <div className="grid gap-4">
          {pendingOrders.map((order) => (
            <div key={order._id} className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold mb-1">
                    Order #{order._id.slice(-8).toUpperCase()}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress?.fullName || "N/A"} •{" "}
                    {order.shippingAddress?.phone || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-xl">{formatPrice(order.totalPrice)}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.payment.method === "VNPAY" ? "Online Payment" : "Payment"}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Items:</p>
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <p key={idx} className="text-sm">
                      {item.productName || `Product ${item.productId}`} x{item.quantity}
                    </p>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleConfirmCashPayment(order._id)}
                className="w-full bg-secondary text-secondary-foreground px-6 py-3 rounded-full hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm Order
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl p-12 text-center border border-border">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="mb-2">No pending orders</h3>
          <p className="text-muted-foreground">All orders have been processed.</p>
        </div>
      )}
    </div>
  );
}
// ─── Users (Staff chỉ xem; xử lý theo permission) ────────────
function UsersContent() {
  const { user } = useAuth();
  const { users, createUser, updateUser, deleteUser } = useAdmin();
  const { loading: permsLoading, hasAnyPermission } = usePermissions(
    user?.roleId && user.roleId !== "user" ? user.roleId : "Staff",
  );

  const canCreate = !permsLoading && hasAnyPermission(["users:create", "users:manage"]);
  const canUpdate = !permsLoading && hasAnyPermission(["users:update", "users:manage"]);
  const canDelete = !permsLoading && hasAnyPermission(["users:delete", "users:manage"]);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<AdminUser["role"]>("user");
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openEdit = (u: AdminUser) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPhone(u.phone);
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !editName.trim() || !editEmail.trim()) return;
    setSavingEdit(true);
    try {
      updateUser(editingUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
      });
      toast.success("User updated");
      setEditingUser(null);
    } catch {
      toast.error("Failed to update user");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setCreating(true);
    try {
      createUser({ name: newName.trim(), email: newEmail.trim(), phone: newPhone.trim(), role: newRole });
      toast.success("User created");
      setShowCreate(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewRole("user");
    } catch {
      toast.error("Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      deleteUser(deleteTarget.id);
      toast.success(`User "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };
return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl mb-2">Users (Read Only)</h1>
        <p className="text-muted-foreground">View all registered users</p>
      </div>

      {!canCreate && !canUpdate && !canDelete ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-muted/40 text-sm text-muted-foreground">
          <ShieldAlert className="size-4 shrink-0" />
          Staff chỉ được xem danh sách user. Các chức năng xử lý sẽ được hiển thị
          khi Admin cấp permission (users:create/update/delete).
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-primary/5 text-sm text-primary">
            <ShieldAlert className="size-4 shrink-0" />
            Staff có quyền xử lý User theo permission được cấp.
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="size-4" />
              Create User
            </button>
          )}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-6 py-4 text-sm">Name</th>
              <th className="text-left px-6 py-4 text-sm">Email</th>
              <th className="text-left px-6 py-4 text-sm">Phone</th>
              <th className="text-left px-6 py-4 text-sm">Role</th>
              {(canUpdate || canDelete) && (
                <th className="text-right px-6 py-4 text-sm">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-6 py-4">{u.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                <td className="px-6 py-4 text-muted-foreground">{u.phone}</td>
                <td className="px-6 py-4 capitalize">{u.role}</td>
                {(canUpdate || canDelete) && (
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {canUpdate && (
                        <button onClick={() => openEdit(u)} className="admin-action-btn edit" title="Edit">
                          <Pencil className="size-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => setDeleteTarget(u)} className="admin-action-btn delete" title="Delete">
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
{/* ── Edit modal ── */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setEditingUser(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Edit User</h3>
              <button onClick={() => setEditingUser(null)} className="admin-action-btn" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Full Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input w-full" placeholder="User name" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Email</label>
                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="input w-full" placeholder="user@email.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Phone</label>
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="input w-full" placeholder="Phone number" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingUser(null)} className="flex-1 py-2.5 rounded-full text-sm border border-border hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit || !editName.trim() || !editEmail.trim()}
                  className="flex-1 py-2.5 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create modal ── */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Create User</h3>
              <button onClick={() => setShowCreate(false)} className="admin-action-btn" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Full Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input w-full" placeholder="User name" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Email</label>
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="input w-full" placeholder="user@email.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Phone</label>
                <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="input w-full" placeholder="Phone number" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminUser["role"])}
                  className="input w-full"
                >
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-full text-sm border border-border hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim() || !newEmail.trim()}
                  className="flex-1 py-2.5 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
{/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-2">Delete User</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">{deleteTarget.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-full text-sm border border-border hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-full text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function StaffPage() {
  const location = useLocation();

  let content;
  if (location.pathname.startsWith("/staff/reports")) {
    content = <StaffReports />;
  } else if (location.pathname.startsWith("/staff/users")) {
    content = <UsersContent />;
  } else {
    // /staff, /staff/orders → Pending Orders
    content = <PendingOrdersContent />;
  }

  return (
    <DashboardShell navItems={staffNavItems} title="Staff Panel">
      {content}
    </DashboardShell>
  );
}
