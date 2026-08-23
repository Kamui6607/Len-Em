import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { userService, type ApiUser, type UserStatus, type UserStatistics } from "../../users/services/user.service";
import { authService } from "../../../shared/api/authService";
import { roleService, normalizeRoles } from "../../../shared/api/roleService";
import type { Role } from "../../../shared/types/role";
import { useAdmin } from "../../../shared/contexts/AdminContext";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import type { AdminUsersSortDirection, AdminUsersSortField } from "../types/adminUsers.types";

export const ADMIN_USERS_PAGE_SIZE = 20;

export interface AdminUserOption {
  value: string;
  label: string;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
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

export function useAdminUsers() {
  const { t } = useLanguage();
  const { logActivity } = useAdmin();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalUsersEstimate, setTotalUsersEstimate] = useState(0);
  const [sortField, setSortField] = useState<AdminUsersSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<AdminUsersSortDirection>("asc");
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [userToUpdate, setUserToUpdate] = useState<ApiUser | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
      const { data: response } = await roleService.getAll({ limit: 100 });
      setApiRoles(normalizeRoles(response.data?.data?.roles ?? []));
    } catch {
      setError(true);
      console.error("Failed to load roles for user admin");
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
        // @ts-expect-error Backend search support is retained from the existing implementation.
        search: debouncedSearch || undefined,
      });
      const fetchedUsers = response.data.result.users || [];
      setUsers(fetchedUsers);
      const total = (response.data.result as { total?: number }).total;
      setTotalUsersEstimate(total ?? (page - 1) * ADMIN_USERS_PAGE_SIZE + fetchedUsers.length);
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
    setSearchTerm("");
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
      const { data: response } = await userService.adminUpdateUser(userId, data);
      const updatedUser = response.data.updatedResult;
      setUsers((current) => current.map((item) => item.userId === userId ? { ...item, ...updatedUser } : item));
      logActivity({ type: "user_created", userId: "admin", userName: "Admin", description: `Updated user: ${updatedUser.fullName || userId}` });
      toast.success(t("admin.users.updateSuccess"));
      setUserToUpdate(null);
    } catch { toast.error(t("admin.users.updateError")); }
    finally { setUpdating(false); }
  };

  const handleCreateUser = async (data: Record<string, unknown>) => {
    if (!isAdmin) return;
    try {
      setCreating(true);
      await authService.adminRegister(data as unknown as Parameters<typeof authService.adminRegister>[0]);
      logActivity({ type: "user_created", userId: "admin", userName: "Admin", description: `Created new user: ${String(data.fullName)} (${String(data.username)})` });
      toast.success(t("admin.users.createSuccess"));
      setShowCreateModal(false);
      await loadUsers();
    } catch { toast.error(t("admin.users.createError")); }
    finally { setCreating(false); }
  };

  return {
    t, isAdmin, users: sortedUsers, rawUsers: users, loading, error, searchTerm, setSearchTerm,
    statusFilter, setStatusFilter, roleFilter, setRoleFilter, page, setPage,
    totalUsersEstimate, stats, statsLoading, hasActiveFilters, apiRoles, roleNameMap,
    roleDropdownOptions, updating, creating, selectedUser, setSelectedUser,
    userToUpdate, setUserToUpdate, showCreateModal, setShowCreateModal,
    handleSort, handleResetFilters, handleViewUser, handleStatusChange, handleRoleChange,
    confirmDeleteUser, handleUpdateUser, handleCreateUser, refresh: loadUsers,
  };
}

export type AdminUsersController = ReturnType<typeof useAdminUsers>;
