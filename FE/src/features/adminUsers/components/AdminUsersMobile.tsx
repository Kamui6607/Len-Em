import { ChevronDown, ChevronLeft, ChevronRight, Eye, Edit3, Users } from "lucide-react";
import type { ApiUser, UserStatus } from "../../users/services/user.service";
import { HoldToDeleteButton } from "../../../shared/components/admin/HoldToDeleteButton";

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
  onPageChange: (page: number) => void;
  getRoleName: (roleId: ApiUser["roleId"]) => string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
  onPageChange,
  getRoleName,
}: AdminUsersMobileProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-4" aria-label="Loading users">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl"
            style={{ background: "var(--muted)" }}
          />
        ))}
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
                {getInitials(user.fullName || user.username || "?")}
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
                    <div className="relative mt-1">
                      <select
                        value={
                          typeof user.roleId === "string"
                            ? user.roleId
                            : user.roleId?._id
                        }
                        onChange={(event) =>
                          onRoleChange(user, event.target.value)
                        }
                        className="input min-h-11 w-full appearance-none bg-none pr-9 px-3 text-sm"
                        aria-label={`Role for ${user.fullName}`}
                      >
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </label>
                  <label className="text-xs text-muted-foreground">
                    Status
                    <div className="relative mt-1">
                      <select
                        value={status}
                        onChange={(event) =>
                          onStatusChange(user, event.target.value as UserStatus)
                        }
                        className="input min-h-11 w-full appearance-none bg-none pr-9 px-3 text-sm"
                        aria-label={`Status for ${user.fullName}`}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </label>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="mt-1 text-sm font-medium">{roleName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="mt-1 text-sm font-medium">{status}</p>
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
                    className="admin-action-btn min-h-11 min-w-11"
                    aria-label={`View ${user.fullName}`}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditUser(user)}
                    className="admin-action-btn min-h-11 min-w-11"
                    aria-label={`Edit ${user.fullName}`}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <HoldToDeleteButton
                    onDelete={() => onDeleteUser(user)}
                    title="Hold to delete"
                  />
                </>
              ) : (
                <span className="text-xs text-muted-foreground">View only</span>
              )}
            </div>
          </article>
        );
      })}

      {totalItems > pageSize && (
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
            Page {page} of {Math.max(1, Math.ceil(totalItems / pageSize))}
          </span>
          <button
            type="button"
            onClick={() =>
              onPageChange(Math.min(Math.ceil(totalItems / pageSize), page + 1))
            }
            disabled={page >= Math.ceil(totalItems / pageSize)}
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
