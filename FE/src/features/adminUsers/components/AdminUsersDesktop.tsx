import { BarChart3, ChevronDown, ChevronUp, Edit3, Eye, SlidersHorizontal, UserCheck, Users, UserX } from "lucide-react";
import type { ApiUser, UserStatus } from "../../users/services/user.service";
import { CreateButton } from "../../../shared/components/admin/CreateButton";
import type { AdminUsersController } from "../hooks/useAdminUsers";
import { ADMIN_USERS_PAGE_SIZE } from "../hooks/useAdminUsers";
import { isInactiveStatus } from "../types/adminUsers.types";
import { AdminPagination } from "../../../shared/components/admin/AdminPagination";
import { ConfirmDeleteButton } from "../../../shared/components/admin/ConfirmDeleteButton";
import { AdminSearchInput } from "../../../shared/components/admin/AdminDataTable";
import { AdminStatCard, type AdminStatCardData } from "../../../shared/components/admin/AdminStatCard";
import {
  getRoleBadgeClass,
  getStatusBadgeClass,
  initialsOf,
  statusLabel,
} from "../utils/adminUsersFormat";

function roleName(user: ApiUser, map: Record<string, string>) {
  return typeof user.roleId === "string" ? map[user.roleId] ?? "User" : user.roleId?.roleName ?? "User";
}

function SortHeader({
  label,
  field,
  controller,
  align = "left",
}: {
  label: string;
  field: "name" | "email" | "phone" | "role" | "status";
  controller: AdminUsersController;
  align?: "left" | "center" | "right";
}) {
  const active = controller.sortField === field;
  return (
    <th
      className={`px-6 py-4 text-sm font-medium text-muted-foreground ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"}`}
      style={{ textAlign: align }}
    >
      <button
        type="button"
        onClick={() => controller.handleSort(field)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-foreground focus:outline-none ${active ? "text-foreground font-semibold" : ""} ${align === "right" ? "flex-row-reverse" : align === "center" ? "justify-center w-full" : ""}`}
      >
        {label}
        <span className="flex flex-col items-center justify-center -space-y-[3px]">
          <ChevronUp
            className={`w-2.5 h-2.5 ${active && controller.sortDirection === "asc" ? "text-primary" : "text-muted-foreground/40"}`}
          />
          <ChevronDown
            className={`w-2.5 h-2.5 ${active && controller.sortDirection === "desc" ? "text-primary" : "text-muted-foreground/40"}`}
          />
        </span>
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
  ];
  // Page count comes from the hook (backend `totalPages`) so the pager works
  // even when the list has exactly one full page worth of rows.
  const totalPages = controller.totalPages;
  // Each stat card owns a colour so the row reads at a glance:
  // total = sea blue, active = green, inactive = red.
  const stats: AdminStatCardData[] = controller.stats
    ? [
        {
          title: t("admin.users.totalUsers"),
          value: controller.stats.totalUsers,
          icon: Users,
          iconBg: "var(--info-bg)",
          iconColor: "var(--info-text)",
        },
        {
          title: t("admin.users.activeUsers"),
          value: controller.stats.activeUsers,
          icon: UserCheck,
          iconBg: "var(--success-bg)",
          iconColor: "var(--success-text)",
        },
        {
          title: t("admin.users.inactiveUsers"),
          value: controller.stats.inactiveUsers,
          icon: UserX,
          iconBg: "var(--error-bg)",
          iconColor: "var(--error-text)",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-2">{t("admin.users.title")}</h1>
          <p className="text-muted-foreground">{controller.isAdmin ? t("admin.users.manageUsers") : t("admin.users.viewRegisteredUsers")}</p>
        </div>
        {controller.isAdmin && (
          <CreateButton
            label={t("admin.users.createUser")}
            onClick={controller.openCreateModal}
          />
        )}
      </div>

      <section className="admin-panel-glow rounded-2xl border p-6" style={{ background: "var(--card)", borderColor: "var(--border-light)" }}>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("admin.users.statistics")}</h2>
        </div>
        {controller.statsLoading ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="admin-skeleton h-[132px] rounded-2xl" />
            ))}
          </div>
        ) : stats.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <AdminStatCard key={stat.title} stat={stat} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("admin.users.failedToLoadStatistics")}</p>
        )}
      </section>

      <section className="admin-panel-glow overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)" }}>
        <div className="space-y-3 border-b p-6" style={{ background: "var(--surface)" }}>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <AdminSearchInput value={controller.searchTerm} onChange={controller.setSearchTerm} placeholder={t("admin.users.searchPlaceholder")} />
            </div>
            {controller.hasActiveFilters && <button type="button" onClick={controller.handleResetFilters} className="admin-action-btn shrink-0" aria-label={t("admin.users.clearFilters")}><SlidersHorizontal className="h-4 w-4" /></button>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <select
                className="input w-full appearance-none bg-none pr-10"
                style={{ backgroundImage: "none" }}
                value={controller.statusFilter}
                onChange={(event) => controller.setStatusFilter(event.target.value as "all" | UserStatus)}
              >
                {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="relative">
              <select
                className="input w-full appearance-none bg-none pr-10"
                style={{ backgroundImage: "none" }}
                value={controller.roleFilter || "all"}
                onChange={(event) => controller.setRoleFilter(event.target.value === "all" ? "" : event.target.value)}
              >
                <option value="all">{t("admin.users.allRoles")}</option>
                {controller.roleDropdownOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto" style={{ background: "var(--card)" }}>
          <table className="admin-table w-full">
            <thead>
              <tr>
                <SortHeader label={t("admin.users.userName")} field="name" controller={controller} align="left" />
                <SortHeader label={t("admin.users.emailLabel")} field="email" controller={controller} align="left" />
                <SortHeader label={t("admin.users.phoneLabel")} field="phone" controller={controller} align="center" />
                <SortHeader label={t("admin.users.role")} field="role" controller={controller} align="center" />
                <SortHeader label={t("admin.users.status")} field="status" controller={controller} align="center" />
                <th
                  className="px-6 py-4 text-center text-sm font-medium text-muted-foreground w-[130px]"
                  style={{ textAlign: "center" }}
                >
                  {t("admin.users.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {controller.loading ? (
                <tr><td colSpan={6} className="py-16 text-center text-muted-foreground">Loading...</td></tr>
              ) : controller.users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">{t("admin.users.noUsersFound")}</p>
                    {controller.hasActiveFilters && (
                      <button type="button" onClick={controller.handleResetFilters} className="mt-2 text-xs text-primary">
                        {t("admin.users.clearFilters")}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                controller.users.map((user) => (
                  <tr key={user.userId} className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {initialsOf(user.fullName || user.username || "?")}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{user.fullName}</p>
                          <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-48 truncate px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground text-center">{user.phone || "—"}</td>
                    <td className="px-6 py-4 text-center">
                      {controller.isAdmin ? (
                        <div className="badge-select-wrap">
                          <select
                            className={`badge-select min-w-[130px] ${getRoleBadgeClass(roleName(user, controller.roleNameMap))}`}
                            value={typeof user.roleId === "string" ? user.roleId : user.roleId?._id}
                            onChange={(event) => controller.handleRoleChange(user, event.target.value)}
                            aria-label={`${t("admin.users.role")} ${user.fullName}`}
                          >
                            {controller.roleDropdownOptions.map((option) => (
                              <option
                                key={option.value}
                                value={option.value}
                                style={{ background: "var(--dropdown-bg)", color: "var(--foreground)" }}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="badge-select-arrow text-current" />
                        </div>
                      ) : (
                        <span className={`badge ${getRoleBadgeClass(roleName(user, controller.roleNameMap))}`}>
                          {roleName(user, controller.roleNameMap)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {/* LOCKED is a legacy status: it is not offered any more, so a
                          locked row shows a plain badge instead of an editable select
                          that could silently display the wrong value. */}
                      {controller.isAdmin && (user.status ?? "ACTIVE") !== "LOCKED" ? (
                        <div className="badge-select-wrap">
                          <select
                            className={`badge-select min-w-[150px] ${getStatusBadgeClass(user.status ?? "ACTIVE")}`}
                            value={user.status ?? "ACTIVE"}
                            onChange={(event) => controller.handleStatusChange(user, event.target.value as UserStatus)}
                            aria-label={`${t("admin.users.status")} ${user.fullName}`}
                          >
                            {statusOptions.slice(1).map((option) => (
                              <option
                                key={option.value}
                                value={option.value}
                                style={{ background: "var(--dropdown-bg)", color: "var(--foreground)" }}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="badge-select-arrow text-current" />
                        </div>
                      ) : (
                        <span className={`badge ${getStatusBadgeClass(user.status ?? "ACTIVE")}`}>
                          {statusLabel(user.status, t)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {controller.isAdmin ? (
                          <>
                            <button
                              type="button"
                              className="admin-action-btn view min-h-10 min-w-10"
                              onClick={() => controller.handleViewUser(user)}
                              aria-label={t("admin.users.viewDetail")}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="admin-action-btn edit min-h-10 min-w-10"
                              onClick={() => controller.openUpdateModal(user)}
                              aria-label={t("admin.users.update")}
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <ConfirmDeleteButton
                              onDelete={() => controller.confirmDeleteUser(user)}
                              itemName={user.fullName || user.username}
                              disabled={isInactiveStatus(user.status)}
                              disabledTitle={t("admin.users.deleteDisabledHint")}
                              className="min-h-10 min-w-10"
                            />
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t("admin.users.viewOnly")}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!controller.loading && (
          <AdminPagination
            page={controller.page}
            totalPages={totalPages}
            onPageChange={controller.setPage}
            totalItems={controller.totalUsersEstimate}
            pageSize={ADMIN_USERS_PAGE_SIZE}
            disabled={controller.loading}
            className="border-t p-4"
          />
        )}
      </section>
    </div>
  );
}
