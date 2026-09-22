import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { userService, type ApiUser, type UserStatus, type UserStatistics } from "../../users/services/user.service";
import { authService } from "../../../shared/api/authService";
import { extractApiErrorMessage, extractFieldErrors } from "../../../lib/apiError";
import { loadRoles } from "../../../shared/api/roleService";
import type { Role } from "../../../shared/types/role";
import { useAdmin } from "../../../shared/contexts/AdminContext";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import type { AdminUsersSortDirection, AdminUsersSortField } from "../types/adminUsers.types";
import { isInactiveStatus } from "../types/adminUsers.types";

export const ADMIN_USERS_PAGE_SIZE = 10;

export interface AdminUserOption {
  value: string;
  label: string;
}

function roleIdOf(roleId: ApiUser["roleId"]): string {
  return typeof roleId === "string" ? roleId : roleId?._id ?? "";
}

function roleNameOf(roleId: ApiUser["roleId"], roleNameMap: Record<string, string>): string {
  if (typeof roleId === "string") return roleNameMap[roleId] ?? "User";
  return roleId?.roleName ?? "User";
}

function roleOptions(roles: Role[]): AdminUserOption[] {
  return roles.filter((role) => role.isActive).map((role) => ({ value: role._id, label: role.roleName }));
}

/**
 * Fallback for the role dropdown: when GET /roles is unavailable, every user
 * row still embeds its own `roleId` object ({ _id, roleName }), so the options
 * can be derived from the list we already loaded.
 */
function rolesFromUsers(users: ApiUser[]): Role[] {
  const map = new Map<string, Role>();
  for (const user of users) {
    const ref = user.roleId;
    if (!ref || typeof ref === "string") continue;
    if (!ref._id || map.has(ref._id)) continue;
    const roleName = ref.roleName ?? "";
    map.set(ref._id, {
      _id: ref._id,
      roleName,
      name: roleName,
      permission: [],
      permissions: [],
      isActive: true,
      createdAt: "",
      updatedAt: "",
    });
  }
  return [...map.values()];
}

export function useAdminUsers() {
  const { t } = useLanguage();
  const { logActivity } = useAdmin();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Search dùng chung hook debounce của toàn dự án (400ms) — đồng bộ mọi trang admin.
  const {
    inputValue: searchTerm,
    debouncedValue: debouncedSearch,
    setInputValue: setSearchTerm,
    isWaiting: searchPending,
    clear: clearSearch,
  } = useDebouncedSearch({ delay: 400, minChars: 0 });
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsersEstimate, setTotalUsersEstimate] = useState(0);
  const [sortField, setSortField] = useState<AdminUsersSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<AdminUsersSortDirection>("asc");
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [userToUpdate, setUserToUpdate] = useState<ApiUser | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});
  const [updateFieldErrors, setUpdateFieldErrors] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [apiRoles, setApiRoles] = useState<Role[]>([]);
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const roleNameMap = useMemo(() => Object.fromEntries(apiRoles.map((role) => [role._id, role.roleName])), [apiRoles]);
  const roleDropdownOptions = useMemo(() => roleOptions(apiRoles), [apiRoles]);
  const hasActiveFilters = debouncedSearch !== "" || statusFilter !== "all" || roleFilter !== "";

  const fetchRoles = useCallback(async () => {
    try {
      // Shared, cached loader — avoids one request per screen.
      setApiRoles(await loadRoles({ limit: 100 }));
    } catch {
      // GET /roles may be unavailable (older deployment). Do NOT flag the whole
      // page as failed — `loadUsers` derives the options from the user rows.
      console.warn("Failed to load roles for user admin");
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const { data: response } = await userService.getAllUsers({
        page,
        limit: ADMIN_USERS_PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
        roleId: roleFilter || undefined,
        search: debouncedSearch || undefined,
      });
      const fetchedUsers = response.data.result.users || [];
      setUsers(fetchedUsers);
      // Fallback: if GET /roles is unavailable, build the dropdown options from
      // the role objects embedded in the user rows.
      setApiRoles((prev) => (prev.length > 0 ? prev : rolesFromUsers(fetchedUsers)));
      // The API reports both `totalUsers` and `totalPages` inside `result`
      // (older builds only sent `total`). Reading the wrong key used to make a
      // full first page look like the whole list — and the remains of the list
      // became unreachable because no second page was offered.
      const result = response.data.result as {
        totalUsers?: number;
        total?: number;
        totalPages?: number;
      };
      const total = result.totalUsers ?? result.total;
      const fetchedCount = fetchedUsers.length;
      setTotalUsersEstimate(total ?? (page - 1) * ADMIN_USERS_PAGE_SIZE + fetchedCount);
      setTotalPages(
        result.totalPages ??
          (total !== undefined
            ? Math.max(1, Math.ceil(total / ADMIN_USERS_PAGE_SIZE))
            // No count at all: a full page means there is very likely more, so
            // still offer the next one instead of hiding the rest.
            : fetchedCount === ADMIN_USERS_PAGE_SIZE
              ? page + 1
              : page),
      );
    } catch {
      setUsers([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, roleFilter, debouncedSearch]);

  useEffect(() => { void fetchRoles(); }, [fetchRoles]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, roleFilter]);
  useEffect(() => { void loadUsers(); }, [loadUsers]);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    userService.getStatistics().then((response) => {
      if (!cancelled) setStats(response.data.data);
    }).catch(() => {
      if (!cancelled) toast.error(t("admin.users.failedToLoadStatistics"));
    }).finally(() => {
      if (!cancelled) setStatsLoading(false);
    });
    return () => { cancelled = true; };
  }, [t]);

  const sortedUsers = useMemo(() => {
    const filtered = debouncedSearch
      ? users.filter((user) => [user.fullName, user.username, user.email, user.phone].some((value) => value?.toLowerCase().includes(debouncedSearch.toLowerCase())))
      : users;
    if (!sortField) return filtered;
    const valueOf = (user: ApiUser): string => {
      switch (sortField) {
        case "name": return user.fullName ?? "";
        case "email": return user.email ?? "";
        case "phone": return user.phone ?? "";
        case "role": return roleNameOf(user.roleId, roleNameMap);
        case "status": return user.status ?? "ACTIVE";
      }
    };
    return [...filtered].sort((a, b) => {
      const result = valueOf(a).localeCompare(valueOf(b));
      return sortDirection === "asc" ? result : -result;
    });
  }, [users, debouncedSearch, sortField, sortDirection, roleNameMap]);

  const handleSort = (field: AdminUsersSortField) => {
    if (sortField === field) setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDirection("asc"); }
  };

  const handleResetFilters = () => {
    clearSearch();
    setStatusFilter("all");
    setRoleFilter("");
  };

  const handleViewUser = async (user: ApiUser) => {
    if (!isAdmin) return;
    try {
      const { data: response } = await userService.getUserById(user.userId);
      setSelectedUser(response.data.result);
    } catch { toast.error(t("admin.users.loadError")); }
  };

  const handleStatusChange = async (user: ApiUser, status: UserStatus) => {
    if (!isAdmin) return;
    try {
      await userService.updateUserStatus(user.userId, { status, description: `Admin changed status to ${status}` });
      setUsers((current) => current.map((item) => item.userId === user.userId ? { ...item, status } : item));
      logActivity({ type: "user_created", userId: "admin", userName: "Admin", description: `Updated status for ${user.fullName} to ${status}` });
      toast.success(t("admin.users.statusUpdateSuccess"));
    } catch { toast.error(t("admin.users.statusUpdateError")); }
  };

  const handleRoleChange = async (user: ApiUser, roleId: string) => {
    if (!isAdmin || !roleId || roleIdOf(user.roleId) === roleId) return;
    try {
      await userService.updateUserRole(user.userId, { roleId });
      setUsers((current) => current.map((item) => item.userId === user.userId ? { ...item, roleId: { _id: roleId, roleName: roleNameMap[roleId] || "User" } } : item));
      logActivity({ type: "user_created", userId: "admin", userName: "Admin", description: `Changed role for ${user.fullName} to ${roleNameMap[roleId] || roleId}` });
      toast.success(t("admin.users.roleUpdateSuccess"));
    } catch { toast.error(t("admin.users.roleUpdateError")); }
  };

  const confirmDeleteUser = async (user: ApiUser) => {
    // Guard: an INACTIVE user is already soft-deleted, and the row's delete
    // button is disabled — this covers a stale list (status changed elsewhere).
    if (isInactiveStatus(user.status)) {
      toast.error(t("admin.users.deleteDisabledError"));
      return;
    }
    try {
      await userService.deleteUser(user.userId);
      setUsers((current) => current.map((item) => item.userId === user.userId ? { ...item, status: "INACTIVE" } : item));
      logActivity({ type: "user_created", userId: "admin", userName: "Admin", description: `Soft deleted user: ${user.fullName}` });
      toast.success(t("admin.users.deleteSuccess"));
    } catch { toast.error(t("admin.users.deleteError")); }
  };

  const handleUpdateUser = async (userId: string, data: Record<string, unknown>) => {
    if (!isAdmin) return;
    try {
      setUpdating(true);
      setUpdateFieldErrors({});
      const { data: response } = await userService.adminUpdateUser(userId, data);
      const updatedUser = response.data.updatedResult;
      setUsers((current) => current.map((item) => item.userId === userId ? { ...item, ...updatedUser } : item));
      logActivity({ type: "user_created", userId: "admin", userName: "Admin", description: `Updated user: ${updatedUser.fullName || userId}` });
      toast.success(t("admin.users.updateSuccess"));
      setUserToUpdate(null);
    } catch (error) {
      // Same treatment as the create form: field-scoped validation errors are
      // rendered inline, everything else uses the backend wording.
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setUpdateFieldErrors(fieldErrors);
      } else {
        const message = extractApiErrorMessage(error);
        toast.error(message || t("admin.users.updateError"));
      }
    }
    finally { setUpdating(false); }
  };

  const clearUpdateFieldError = useCallback((field: string) => {
    setUpdateFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const openUpdateModal = useCallback((user: ApiUser) => {
    setUpdateFieldErrors({});
    setUserToUpdate(user);
  }, []);

  const handleCreateUser = async (data: Record<string, unknown>) => {
    if (!isAdmin) return;
    try {
      setCreating(true);
      setCreateFieldErrors({});
      await authService.adminRegister(data as unknown as Parameters<typeof authService.adminRegister>[0]);
      logActivity({ type: "user_created", userId: "admin", userName: "Admin", description: `Created new user: ${String(data.fullName)} (${String(data.username)})` });
      toast.success(t("admin.users.createSuccess"));
      setShowCreateModal(false);
      await loadUsers();
    } catch (error) {
      // Field-scoped validation errors (duplicate email/username, bad phone…)
      // are rendered inline next to the matching input; everything else is
      // reported with the backend's own wording.
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setCreateFieldErrors(fieldErrors);
      } else {
        const message = extractApiErrorMessage(error);
        toast.error(message || t("admin.users.createError"));
      }
    } finally { setCreating(false); }
  };

  const openCreateModal = useCallback(() => {
    setCreateFieldErrors({});
    setShowCreateModal(true);
  }, []);

  const clearCreateFieldError = useCallback((field: string) => {
    setCreateFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  return {
    t, isAdmin, users: sortedUsers, rawUsers: users, loading, error, searchTerm, setSearchTerm,
    searchPending,
    statusFilter, setStatusFilter, roleFilter, setRoleFilter, page, setPage,
    totalUsersEstimate, totalPages, stats, statsLoading, hasActiveFilters, apiRoles, roleNameMap,
    roleDropdownOptions, updating, creating, selectedUser, setSelectedUser,
    userToUpdate, setUserToUpdate, showCreateModal, setShowCreateModal,
    sortField, sortDirection,
    createFieldErrors, openCreateModal, clearCreateFieldError,
    updateFieldErrors, openUpdateModal, clearUpdateFieldError,
    handleSort, handleResetFilters, handleViewUser, handleStatusChange, handleRoleChange,
    confirmDeleteUser, handleUpdateUser, handleCreateUser, refresh: loadUsers,
  };
}

export type AdminUsersController = ReturnType<typeof useAdminUsers>;
