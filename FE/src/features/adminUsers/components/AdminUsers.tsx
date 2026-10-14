// ============================================================
// AdminUsers — route /admin/users
// Một layout duy nhất cho mọi màn hình: AdminDataGrid tự gập thành thẻ khi
// panel hẹp (thay cho cặp AdminUsersDesktop / AdminUsersMobile trước đây).
// Thẻ trạng thái kiêm số liệu (thay khối "Thống kê người dùng").
// ============================================================

import { ChevronDown, Edit3, Eye, Layers, RefreshCw, Trash2, UserCheck, Users, UserX } from "lucide-react";
import type { ApiUser, UserStatus } from "../../users/services/user.service";
import { useAdminUsers, ADMIN_USERS_PAGE_SIZE } from "../hooks/useAdminUsers";
import { AdminUsersDialogs } from "./AdminUsersDialogs";
import { isInactiveStatus } from "../types/adminUsers.types";
import { initialsOf, statusLabel } from "../utils/adminUsersFormat";
import { CreateButton } from "../../../shared/components/admin/CreateButton";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import { AdminSelect } from "../../../shared/components/admin/AdminSelect";
import { AdminSearchMeta } from "../../../shared/components/admin/AdminSearch";
import {
  AdminActionButton,
  AdminCellStack,
  AdminDataGrid,
  AdminGridFooter,
  AdminGridToolbar,
  AdminPill,
  AdminRowActions,
  AdminRowMenu,
  AdminStatusTabs,
  useAdminConfirm,
  type AdminGridColumn,
  type AdminTone,
} from "../../../shared/components/admin/AdminDataGrid";

type StatusFilter = "all" | "ACTIVE" | "INACTIVE";

/** Admin = rose, Staff = green, Customer = blue, khác = neutral. */
function roleTone(roleName: string): AdminTone {
  const lower = (roleName || "").toLowerCase();
  if (lower.includes("admin") || lower.includes("quản trị")) return "rose";
  if (lower.includes("staff") || lower.includes("nhân viên")) return "green";
  if (lower.includes("customer") || lower.includes("khách") || lower === "user") return "blue";
  return "neutral";
}

function statusTone(status?: string | null): AdminTone {
  const upper = (status ?? "ACTIVE").toUpperCase();
  return upper === "ACTIVE" ? "green" : upper === "INACTIVE" || upper === "LOCKED" ? "rose" : "neutral";
}

/** <select> mang dáng pill trạng thái — đổi vai trò / trạng thái ngay trên dòng. */
function PillSelect({
  tone,
  value,
  options,
  onChange,
  ariaLabel,
}: {
  tone: AdminTone;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <span className="adm-gpill-select" data-tone={tone} onClick={(e) => e.stopPropagation()}>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" />
    </span>
  );
}

export function AdminUsers() {
  const controller = useAdminUsers();
  const { t } = controller;
  const { confirm, dialog: confirmDialog } = useAdminConfirm();

  const roleName = (user: ApiUser) =>
    typeof user.roleId === "string"
      ? (controller.roleNameMap[user.roleId] ?? "User")
      : (user.roleId?.roleName ?? "User");
  const roleId = (user: ApiUser) => (typeof user.roleId === "string" ? user.roleId : (user.roleId?._id ?? ""));
  // Nhãn ngắn để vừa pill trong bảng; nhãn đầy đủ nằm ở thẻ lọc phía trên.
  const statusOptions = [
    { value: "ACTIVE", label: t("admin.users.activeShort") },
    { value: "INACTIVE", label: t("admin.users.inactiveShort") },
  ];

  const handleDelete = async (user: ApiUser) => {
    const ok = await confirm({
      title: t("admin.confirmDelete.title", { name: user.fullName || user.username }),
      description: t("admin.users.deleteWarning"),
      confirmLabel: t("admin.users.delete"),
      danger: true,
      icon: Trash2,
    });
    if (ok) await controller.confirmDeleteUser(user);
  };

  const columns: AdminGridColumn<ApiUser>[] = [
    {
      key: "name",
      header: t("admin.users.userName"),
      width: "minmax(200px, 1.4fr)",
      minWidth: 200,
      sortable: true,
      card: "title",
      render: (user) => (
        <AdminCellStack
          media={<span className="adm-ginitials">{initialsOf(user.fullName || user.username || "?")}</span>}
          primary={user.fullName || user.username}
          secondary={`@${user.username}`}
        />
      ),
    },
    {
      key: "email",
      header: t("admin.users.emailLabel"),
      width: "minmax(160px, 1.3fr)",
      minWidth: 160,
      sortable: true,
      render: (user) => <span className="adm-gprimary">{user.email}</span>,
    },
    {
      key: "phone",
      header: t("admin.users.phoneShort"),
      width: "116px",
      minWidth: 116,
      sortable: true,
      render: (user) => <span className="adm-gmono">{user.phone || "—"}</span>,
    },
    {
      key: "role",
      header: t("admin.users.role"),
      width: "140px",
      minWidth: 140,
      align: "center",
      sortable: true,
      render: (user) =>
        controller.isAdmin ? (
          <PillSelect
            tone={roleTone(roleName(user))}
            value={roleId(user)}
            options={controller.roleDropdownOptions}
            onChange={(value) => controller.handleRoleChange(user, value)}
            ariaLabel={`${t("admin.users.role")} ${user.fullName}`}
          />
        ) : (
          <AdminPill tone={roleTone(roleName(user))}>{roleName(user)}</AdminPill>
        ),
    },
    {
      key: "status",
      header: t("admin.users.status"),
      width: "130px",
      minWidth: 130,
      align: "center",
      sortable: true,
      card: "aside",
      // LOCKED là trạng thái cũ, không còn được chọn → chỉ hiện pill, không cho sửa.
      render: (user) =>
        controller.isAdmin && (user.status ?? "ACTIVE") !== "LOCKED" ? (
          <PillSelect
            tone={statusTone(user.status)}
            value={user.status ?? "ACTIVE"}
            options={statusOptions}
            onChange={(value) => controller.handleStatusChange(user, value as UserStatus)}
            ariaLabel={`${t("admin.users.status")} ${user.fullName}`}
          />
        ) : (
          <AdminPill tone={statusTone(user.status)}>{statusLabel(user.status, t)}</AdminPill>
        ),
    },
    {
      key: "actions",
      header: t("admin.users.actions"),
      width: "178px",
      minWidth: 178,
      align: "center",
      card: "actions",
      render: (user) => (
        <AdminRowActions>
          {controller.isAdmin ? (
            <AdminActionButton icon={Edit3} label={t("admin.users.update")} onClick={() => controller.openUpdateModal(user)} />
          ) : (
            <AdminActionButton icon={Eye} label={t("admin.users.viewDetail")} onClick={() => controller.handleViewUser(user)} />
          )}
          <AdminRowMenu
            ariaLabel={t("admin.grid.moreActions")}
            items={[
              { label: t("admin.users.viewDetail"), icon: Eye, onSelect: () => controller.handleViewUser(user) },
              controller.isAdmin && {
                label: t("admin.users.delete"),
                icon: Trash2,
                danger: true,
                separated: true,
                disabled: isInactiveStatus(user.status),
                onSelect: () => void handleDelete(user),
              },
            ]}
          />
        </AdminRowActions>
      ),
    },
  ];

  const stats = controller.stats;
  const countOf = (value?: number) => (controller.statsLoading ? undefined : stats ? value : null);

  return (
    <>
      <div className="space-y-4">
        <AdminPageHeader
          eyebrow={t("admin.users.eyebrow")}
          title={t("admin.users.title")}
          subtitle={controller.isAdmin ? t("admin.users.manageUsers") : t("admin.users.viewRegisteredUsers")}
          actions={
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void controller.refresh()}
                disabled={controller.loading}
              >
                <RefreshCw className={`h-4 w-4 ${controller.loading ? "animate-spin" : ""}`} />
                {t("admin.grid.refresh")}
              </button>
              {controller.isAdmin && (
                <CreateButton label={t("admin.users.createUser")} onClick={controller.openCreateModal} />
              )}
            </>
          }
        />

        <AdminStatusTabs<StatusFilter>
          ariaLabel={t("admin.users.status")}
          value={controller.statusFilter as StatusFilter}
          onChange={(value) => controller.setStatusFilter(value)}
          tabs={[
            { value: "all", label: t("admin.users.allStatuses"), icon: Layers, count: countOf(stats?.totalUsers) },
            { value: "ACTIVE", label: t("admin.users.active"), icon: UserCheck, tone: "green", count: countOf(stats?.activeUsers) },
            { value: "INACTIVE", label: t("admin.users.inactive"), icon: UserX, tone: "rose", count: countOf(stats?.inactiveUsers) },
          ]}
        />

        <AdminPanel hover={false} className="adm-gpanel">
          <AdminGridToolbar
            search={{
              value: controller.searchTerm,
              onChange: controller.setSearchTerm,
              placeholder: t("admin.users.searchPlaceholder"),
              isSearching: controller.searchPending,
            }}
            filters={
              <AdminSelect
                value={controller.roleFilter || "all"}
                options={[{ value: "all", label: t("admin.users.allRoles") }, ...controller.roleDropdownOptions]}
                onChange={(value) => controller.setRoleFilter(value === "all" ? "" : value)}
              />
            }
            onReset={controller.hasActiveFilters ? controller.handleResetFilters : undefined}
            meta={
              controller.searchTerm ? (
                <AdminSearchMeta searching={controller.searchPending}>
                  {controller.users.length === 0
                    ? t("admin.search.noResults")
                    : t("admin.search.resultsCount", { count: controller.users.length })}
                </AdminSearchMeta>
              ) : undefined
            }
          />

          <AdminDataGrid<ApiUser>
            ariaLabel={t("admin.users.title")}
            rows={controller.users}
            rowKey={(user) => user.userId}
            columns={columns}
            loading={controller.loading}
            sort={{
              field: controller.sortField,
              direction: controller.sortDirection,
              onSort: (field) => controller.handleSort(field as Parameters<typeof controller.handleSort>[0]),
            }}
            onRowClick={(user) => controller.handleViewUser(user)}
            rowMuted={(user) => isInactiveStatus(user.status)}
            empty={{
              icon: Users,
              title: t("admin.users.noUsersFound"),
              description: controller.hasActiveFilters ? t("admin.users.tryAdjustingFilters") : undefined,
              action: controller.hasActiveFilters ? (
                <button type="button" className="btn-secondary" onClick={controller.handleResetFilters}>
                  {t("admin.users.clearFilters")}
                </button>
              ) : undefined,
            }}
          />

          <AdminGridFooter
            page={controller.page}
            totalPages={controller.totalPages}
            total={controller.totalUsersEstimate}
            pageSize={ADMIN_USERS_PAGE_SIZE}
            onPageChange={controller.setPage}
            disabled={controller.loading}
          />
        </AdminPanel>
      </div>

      {confirmDialog}
      <AdminUsersDialogs controller={controller} />
    </>
  );
}
