import { useState } from "react";
import { X } from "lucide-react";
import type { ApiUser } from "../../users/services/user.service";
import type { AdminUsersController } from "../hooks/useAdminUsers";

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="admin-dialog-overlay" onClick={onClose}>
      <div
        className="admin-dialog-content max-h-[90vh] w-full max-w-2xl overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input w-full"
      />
    </label>
  );
}

function ViewUserDialog({
  user,
  roleName,
  onClose,
}: {
  user: ApiUser;
  roleName: string;
  onClose: () => void;
}) {
  return (
    <Overlay onClose={onClose}>
      <div className="admin-dialog-header flex items-center justify-between">
        <h2 className="text-lg font-semibold">User details</h2>
        <button type="button" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="admin-dialog-body space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Name</p>
          <p className="font-medium">{user.fullName || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Username</p>
          <p>{user.username || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Email</p>
          <p>{user.email || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Phone</p>
          <p>{user.phone || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Role</p>
          <p>{roleName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <p>{user.status || "ACTIVE"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Address</p>
          <p>{user.address || "—"}</p>
        </div>
      </div>
      <div className="admin-dialog-footer">
        <button type="button" onClick={onClose} className="btn-modal-primary">
          Close
        </button>
      </div>
    </Overlay>
  );
}

function UpdateUserDialog({
  user,
  loading,
  onCancel,
  onConfirm,
}: {
  user: ApiUser;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (data: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    username: user.username ?? "",
    email: user.email ?? "",
    fullName: user.fullName ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
    gender: user.gender ?? "",
    dateOfBirth: user.dateOfBirth ?? "",
    subscription:
      (user as ApiUser & { subscription?: string }).subscription ?? "",
  });
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <Overlay onClose={onCancel}>
      <div className="admin-dialog-header flex items-center justify-between">
        <h2 className="text-lg font-semibold">Update user</h2>
        <button type="button" onClick={onCancel} aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <form
        className="admin-dialog-body grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm(form);
        }}
      >
        <Field
          label="Full name"
          value={form.fullName}
          onChange={set("fullName")}
        />
        <Field
          label="Username"
          value={form.username}
          onChange={set("username")}
        />
        <Field
          label="Email"
          value={form.email}
          onChange={set("email")}
          type="email"
        />
        <Field label="Phone" value={form.phone} onChange={set("phone")} />
        <Field label="Address" value={form.address} onChange={set("address")} />
        <Field label="Gender" value={form.gender} onChange={set("gender")} />
        <Field
          label="Date of birth"
          value={form.dateOfBirth}
          onChange={set("dateOfBirth")}
          type="date"
        />
        <Field
          label="Subscription"
          value={form.subscription}
          onChange={set("subscription")}
        />
        <div className="admin-dialog-footer col-span-full">
          <button type="button" onClick={onCancel} className="btn-modal-cancel">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-modal-primary"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

function CreateUserDialog({
  controller,
}: {
  controller: AdminUsersController;
}) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    phone: "",
    address: "",
    gender: "",
    dateOfBirth: "",
    roleId: controller.roleDropdownOptions[0]?.value ?? "",
  });
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <Overlay onClose={() => controller.setShowCreateModal(false)}>
      <div className="admin-dialog-header flex items-center justify-between">
        <h2 className="text-lg font-semibold">Create user</h2>
        <button
          type="button"
          onClick={() => controller.setShowCreateModal(false)}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <form
        className="admin-dialog-body grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void controller.handleCreateUser(form);
        }}
      >
        <Field
          label="Full name"
          value={form.fullName}
          onChange={set("fullName")}
        />
        <Field
          label="Username"
          value={form.username}
          onChange={set("username")}
        />
        <Field
          label="Email"
          value={form.email}
          onChange={set("email")}
          type="email"
        />
        <Field
          label="Password"
          value={form.password}
          onChange={set("password")}
          type="password"
        />
        <Field label="Phone" value={form.phone} onChange={set("phone")} />
        <Field label="Address" value={form.address} onChange={set("address")} />
        <Field label="Gender" value={form.gender} onChange={set("gender")} />
        <Field
          label="Date of birth"
          value={form.dateOfBirth}
          onChange={set("dateOfBirth")}
          type="date"
        />
        <label className="text-sm font-medium">
          <span className="mb-1 block text-muted-foreground">Role</span>
          <select
            value={form.roleId}
            onChange={(event) => set("roleId")(event.target.value)}
            className="input w-full"
          >
            {controller.roleDropdownOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="admin-dialog-footer col-span-full">
          <button
            type="button"
            onClick={() => controller.setShowCreateModal(false)}
            className="btn-modal-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={controller.creating}
            className="btn-modal-primary"
          >
            {controller.creating ? "Creating..." : "Create user"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

export function AdminUsersDialogs({
  controller,
}: {
  controller: AdminUsersController;
}) {
  return (
    <>
      {controller.selectedUser && (
        <ViewUserDialog
          user={controller.selectedUser}
          roleName={
            typeof controller.selectedUser.roleId === "string"
              ? (controller.roleNameMap[controller.selectedUser.roleId] ??
                "User")
              : (controller.selectedUser.roleId?.roleName ?? "User")
          }
          onClose={() => controller.setSelectedUser(null)}
        />
      )}
      {controller.userToUpdate && (
        <UpdateUserDialog
          user={controller.userToUpdate}
          loading={controller.updating}
          onCancel={() => controller.setUserToUpdate(null)}
          onConfirm={(data) =>
            void controller.handleUpdateUser(
              controller.userToUpdate!.userId,
              data,
            )
          }
        />
      )}
      {controller.showCreateModal && (
        <CreateUserDialog controller={controller} />
      )}
    </>
  );
}
