import { BarChart3, ChevronDown, ChevronUp, Edit3, Eye, Plus, Search, SlidersHorizontal, Users } from "lucide-react";
import type { ApiUser, UserStatus } from "../../users/services/user.service";
import type { AdminUsersController } from "../hooks/useAdminUsers";
import { HoldToDeleteButton } from "../../../shared/components/admin/HoldToDeleteButton";

function roleName(user: ApiUser, map: Record<string, string>) {
  return typeof user.roleId === "string" ? map[user.roleId] ?? "User" : user.roleId?.roleName ?? "User";
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function SortHeader({ label, field, controller }: { label: string; field: "name" | "email" | "phone" | "role" | "status"; controller: AdminUsersController }) {
  const active = false;
  return (
    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
      <button type="button" onClick={() => controller.handleSort(field)} className="inline-flex items-center gap-1">
        {label}
        {active ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
    </th>
  );
}

export function AdminUsersDesktop({ controller }: { controller: AdminUsersController }) {
  const { t } = controller;
  const statusOptions = [
    { value: "all", label: t("admin.users.allStatuses") },
    { value: "ACTIVE", label: t("admin.users.active") },
    { value: "INACTIVE", label: t("admin.users.inactive") },
    { value: "LOCKED", label: t("admin.users.locked") },
  ];
  const totalPages = Math.max(1, Math.ceil(controller.totalUsersEstimate / 20));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-2">{t("admin.users.title")}</h1>
          <p className="text-muted-foreground">{controller.isAdmin ? t("admin.users.manageUsers") : t("admin.users.viewRegisteredUsers")}</p>
        </div>
        {controller.isAdmin && (
          <button type="button" onClick={() => controller.setShowCreateModal(true)} className="btn-create">
            <Plus className="h-4 w-4" /> {t("admin.users.createUser")}
          </button>
        )}
      </div>

      <section className="admin-panel-glow rounded-2xl border p-6" style={{ background: "var(--card)", borderColor: "var(--border-light)" }}>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("admin.users.statistics")}</h2>
        </div>
        {controller.statsLoading ? <div className="h-20 animate-pulse rounded-xl bg-muted" /> : controller.stats ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[[t("admin.users.totalUsers"), controller.stats.totalUsers], [t("admin.users.activeUsers"), controller.stats.activeUsers], [t("admin.users.inactiveUsers"), controller.stats.inactiveUsers], [t("admin.users.lockedUsers"), controller.stats.lockedUsers]].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>
            ))}
          </div>
        ) : <p className="text-xs text-muted-foreground">{t("admin.users.failedToLoadStatistics")}</p>}
      </section>

      <section className="admin-panel-glow overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)" }}>
        <div className="space-y-3 border-b p-6" style={{ background: "var(--surface)" }}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input value={controller.searchTerm} onChange={(event) => controller.setSearchTerm(event.target.value)} placeholder={t("admin.users.searchPlaceholder")} className="input w-full pl-12" />
            </div>
            {controller.hasActiveFilters && <button type="button" onClick={controller.handleResetFilters} className="admin-action-btn" aria-label={t("admin.users.clearFilters")}><SlidersHorizontal className="h-4 w-4" /></button>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="input min-h-11" value={controller.statusFilter} onChange={(event) => controller.setStatusFilter(event.target.value as "all" | UserStatus)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            <select className="input min-h-11" value={controller.roleFilter || "all"} onChange={(event) => controller.setRoleFilter(event.target.value === "all" ? "" : event.target.value)}><option value="all">{t("admin.users.allRoles")}</option>{controller.roleDropdownOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          </div>
        </div>

        <div className="overflow-x-auto" style={{ background: "var(--card)" }}>
          <table className="admin-table w-full">
            <thead><tr><SortHeader label={t("admin.users.userName")} field="name" controller={controller} /><SortHeader label={t("admin.users.emailLabel")} field="email" controller={controller} /><SortHeader label={t("admin.users.phoneLabel")} field="phone" controller={controller} /><SortHeader label={t("admin.users.role")} field="role" controller={controller} /><SortHeader label={t("admin.users.status")} field="status" controller={controller} /><th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">{t("admin.users.actions")}</th></tr></thead>
            <tbody>
              {controller.loading ? <tr><td colSpan={6} className="py-16 text-center text-muted-foreground">Loading...</td></tr> : controller.users.length === 0 ? <tr><td colSpan={6} className="py-16 text-center"><Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" /><p className="text-sm font-medium">{t("admin.users.noUsersFound")}</p>{controller.hasActiveFilters && <button type="button" onClick={controller.handleResetFilters} className="mt-2 text-xs text-primary">{t("admin.users.clearFilters")}</button>}</td></tr> : controller.users.map((user) => <tr key={user.userId} className="border-b border-border">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{initials(user.fullName || user.username || "?")}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{user.fullName}</p><p className="truncate text-xs text-muted-foreground">@{user.username}</p></div></div></td>
                <td className="max-w-48 truncate px-6 py-4 text-sm text-muted-foreground">{user.email}</td><td className="px-6 py-4 text-sm text-muted-foreground">{user.phone || "—"}</td>
                <td className="px-6 py-4">{controller.isAdmin ? <select className="input min-h-10" value={typeof user.roleId === "string" ? user.roleId : user.roleId?._id} onChange={(event) => controller.handleRoleChange(user, event.target.value)}>{controller.roleDropdownOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : roleName(user, controller.roleNameMap)}</td>
                <td className="px-6 py-4">{controller.isAdmin ? <select className="input min-h-10" value={user.status ?? "ACTIVE"} onChange={(event) => controller.handleStatusChange(user, event.target.value as UserStatus)}>{statusOptions.slice(1).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : user.status ?? "ACTIVE"}</td>
                <td className="px-6 py-4"><div className="flex justify-end gap-2">{controller.isAdmin ? <><button type="button" className="admin-action-btn min-h-10 min-w-10" onClick={() => controller.handleViewUser(user)} aria-label={t("admin.users.viewDetail")}><Eye className="h-4 w-4" /></button><button type="button" className="admin-action-btn min-h-10 min-w-10" onClick={() => controller.setUserToUpdate(user)} aria-label={t("admin.users.update")}><Edit3 className="h-4 w-4" /></button><HoldToDeleteButton onDelete={() => controller.confirmDeleteUser(user)} title={t("admin.users.holdToDelete")} /></> : <span className="text-xs text-muted-foreground">{t("admin.users.viewOnly")}</span>}</div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {!controller.loading && <div className="flex items-center justify-between border-t p-4 text-sm"><button type="button" disabled={controller.page <= 1} onClick={() => controller.setPage(Math.max(1, controller.page - 1))} className="admin-action-btn min-h-10">Previous</button><span className="text-muted-foreground">{controller.page} / {totalPages}</span><button type="button" disabled={controller.page >= totalPages} onClick={() => controller.setPage(Math.min(totalPages, controller.page + 1))} className="admin-action-btn min-h-10">Next</button></div>}
      </section>
    </div>
  );
}
