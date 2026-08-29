import { useIsMobile } from "../../../shared/hooks/useMediaQuery";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { AdminUsersDesktop } from "./AdminUsersDesktop";
import { AdminUsersMobile } from "./AdminUsersMobile";
import { AdminUsersDialogs } from "./AdminUsersDialogs";
import { ChevronDown } from "lucide-react";
import { AdminSearchInput } from "../../../shared/components/admin/AdminDataTable";

export function AdminUsers() {
  const isMobile = useIsMobile();
  const controller = useAdminUsers();
  const mobileStatusOptions = [
    { value: "ACTIVE", label: controller.t("admin.users.active") },
    { value: "INACTIVE", label: controller.t("admin.users.inactive") },
    { value: "LOCKED", label: controller.t("admin.users.locked") },
  ];

  const content = isMobile ? (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-2">{controller.t("admin.users.title")}</h1>
          <p className="text-muted-foreground">
            {controller.isAdmin
              ? controller.t("admin.users.manageUsers")
              : controller.t("admin.users.viewRegisteredUsers")}
          </p>
        </div>
        {controller.isAdmin && (
          <button
            type="button"
            onClick={() => controller.setShowCreateModal(true)}
            className="btn-create"
          >
            {controller.t("admin.users.createUser")}
          </button>
        )}
      </div>
      <section
        className="admin-panel-glow overflow-hidden rounded-2xl border"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="space-y-3 border-b p-4"
          style={{ background: "var(--surface)" }}
        >
          <AdminSearchInput
            value={controller.searchTerm}
            onChange={controller.setSearchTerm}
            placeholder={controller.t("admin.users.searchPlaceholder")}
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <select
                className="input min-h-11 w-full appearance-none bg-none pr-9"
                value={controller.statusFilter}
                onChange={(event) =>
                  controller.setStatusFilter(
                    event.target.value as
                      | "all"
                      | "ACTIVE"
                      | "INACTIVE"
                      | "LOCKED",
                  )
                }
              >
                <option value="all">
                  {controller.t("admin.users.allStatuses")}
                </option>
                {mobileStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="relative">
              <select
                className="input min-h-11 w-full appearance-none bg-none pr-9"
                value={controller.roleFilter || "all"}
                onChange={(event) =>
                  controller.setRoleFilter(
                    event.target.value === "all" ? "" : event.target.value,
                  )
                }
              >
                <option value="all">
                  {controller.t("admin.users.allRoles")}
                </option>
                {controller.roleDropdownOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>
        <AdminUsersMobile
          users={controller.users}
          loading={controller.loading}
          isAdmin={controller.isAdmin}
          hasActiveFilters={controller.hasActiveFilters}
          roleOptions={controller.roleDropdownOptions}
          statusOptions={mobileStatusOptions}
          onViewUser={controller.handleViewUser}
          onEditUser={controller.setUserToUpdate}
          onDeleteUser={controller.confirmDeleteUser}
          onRoleChange={controller.handleRoleChange}
          onStatusChange={controller.handleStatusChange}
          onResetFilters={controller.handleResetFilters}
          page={controller.page}
          pageSize={20}
          totalItems={controller.totalUsersEstimate}
          onPageChange={controller.setPage}
          getRoleName={(roleId) =>
            typeof roleId === "string"
              ? (controller.roleNameMap[roleId] ?? "User")
              : (roleId?.roleName ?? "User")
          }
        />
      </section>
    </div>
  ) : (
    <AdminUsersDesktop controller={controller} />
  );

  return (
    <>
      {content}
      <AdminUsersDialogs controller={controller} />
    </>
  );
}
