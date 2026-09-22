import { ChevronDown, ChevronLeft, ChevronRight, Eye, Edit3, Users } from "lucide-react";
import type { ApiUser, UserStatus } from "../../users/services/user.service";
import { ConfirmDeleteButton } from "../../../shared/components/admin/ConfirmDeleteButton";
import { AdminListSkeleton } from "../../../shared/components/skeletons/AdminSkeleton";
import { isInactiveStatus } from "../types/adminUsers.types";
import { getRoleBadgeClass, getStatusBadgeClass, initialsOf } from "../utils/adminUsersFormat";

interface AdminUsersMobileProps {
  users: ApiUser[];
  loading: boolean;
  isAdmin: boolean;
  hasActiveFilters: boolean;
  roleOptions: Array<{ value: string; label: string }>;
  statusOptions: Array<{ value: string; label: string }>;
  onViewUser: (user: ApiUser) => void;
  onEditUser: (user: ApiUser) => void;
  onDeleteUser: (user: ApiUser) => void;
  onRoleChange: (user: ApiUser, roleId: string) => void;
  onStatusChange: (user: ApiUser, status: UserStatus) => void;
  onResetFilters: () => void;
  page: number;
  pageSize: number;
  totalItems: number;
  /** Authoritative page count from the API (falls back to totalItems/pageSize). */
  totalPages?: number;
  onPageChange: (page: number) => void;
  getRoleName: (roleId: ApiUser["roleId"]) => string;
}

export function AdminUsersMobile({
  users,
  loading,
  isAdmin,
  hasActiveFilters,
  roleOptions,
  statusOptions,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onRoleChange,
  onStatusChange,
  onResetFilters,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  getRoleName,
}: AdminUsersMobileProps) {
  const pageCount = totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize));

  if (loading) {
    // Skeleton dựng theo đúng card user thật: avatar tròn + tên/username/email,
    // bên dưới là 2 field role & status → không nhảy layout khi data về.
    return (
      <div aria-label="Loading users">
        <AdminListSkeleton className="p-4" variant="card" rows={4} />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
        <Users
          className="h-8 w-8"
          style={{ color: "var(--foreground-subtle)" }}
        />
        <p className="text-sm font-medium">No users found</p>
        <p className="text-xs text-muted-foreground">
          {hasActiveFilters
            ? "Try adjusting your filters."
            : "Users will show up here."}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-1 text-xs font-medium text-primary"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      {users.map((user) => {
        const roleName = getRoleName(user.roleId);
        const status = user.status ?? "ACTIVE";

        return (
          <article
            key={user.userId}
            className="rounded-2xl border p-4"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                style={{
                  background: "var(--chip-bg)",
                  color: "var(--primary)",
                }}
                aria-hidden="true"
              >
                {initialsOf(user.fullName || user.username || "?")}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">
                  {user.fullName || user.username}
                </h3>
                <p className="truncate text-xs text-muted-foreground">
                  @{user.username}
                </p>
                <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {isAdmin ? (
                <>
                  <label className="text-xs text-muted-foreground">
                    Role
                    <div className="badge-select-wrap mt-1 w-full">
                      <select
                        value={
                          typeof user.roleId === "string"
                            ? user.roleId
                            : user.roleId?._id
                        }
                        onChange={(event) =>
                          onRoleChange(user, event.target.value)
                        }
                        className={`badge-select min-h-10 w-full ${getRoleBadgeClass(roleName)}`}
                        aria-label={`Role for ${user.fullName}`}
                      >
                        {roleOptions.map((option) => (
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
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Status
                    <div className="badge-select-wrap mt-1 w-full">
                      {/* LOCKED is a legacy status (no longer selectable): show a
                          read-only badge instead of a select without that option. */}
                      {status !== "LOCKED" ? (
                        <select
                          value={status}
                          onChange={(event) =>
                            onStatusChange(user, event.target.value as UserStatus)
                          }
                          className={`badge-select min-h-10 w-full ${getStatusBadgeClass(status)}`}
                          aria-label={`Status for ${user.fullName}`}
                        >
                          {statusOptions.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                              style={{ background: "var(--dropdown-bg)", color: "var(--foreground)" }}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`badge ${getStatusBadgeClass(status)}`}>
                          {status}
                        </span>
                      )}
                      {status !== "LOCKED" && <ChevronDown className="badge-select-arrow text-current" />}
                    </div>
                  </label>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Role</p>
                    <span className={`badge ${getRoleBadgeClass(roleName)}`}>{roleName}</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <span className={`badge ${getStatusBadgeClass(status)}`}>{status}</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t pt-3">
              {isAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={() => onViewUser(user)}
                    className="admin-action-btn view min-h-11 min-w-11"
                    aria-label={`View ${user.fullName}`}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditUser(user)}
                    className="admin-action-btn edit min-h-11 min-w-11"
                    aria-label={`Edit ${user.fullName}`}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <ConfirmDeleteButton
                    onDelete={() => onDeleteUser(user)}
                    itemName={user.fullName}
                    disabled={isInactiveStatus(status)}
                    disabledTitle="Already inactive — cannot delete"
                    className="min-h-11 min-w-11"
                  />
                </>
              ) : (
                <span className="text-xs text-muted-foreground">View only</span>
              )}
            </div>
          </article>
        );
      })}

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="admin-action-btn min-h-11 min-w-11"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(pageCount, page + 1))}
            disabled={page >= pageCount}
            className="admin-action-btn min-h-11 min-w-11"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
