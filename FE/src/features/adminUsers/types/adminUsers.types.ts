import type { ApiUser, UserStatus, UserStatistics } from "../../users/services/user.service";
import type { Role } from "../../../shared/types/role";

export type AdminUsersSortField = "name" | "email" | "phone" | "role" | "status";
export type AdminUsersSortDirection = "asc" | "desc";

export interface AdminUsersState {
  users: ApiUser[];
  loading: boolean;
  searchTerm: string;
  statusFilter: "all" | UserStatus;
  roleFilter: string;
  page: number;
  totalUsersEstimate: number;
  selectedUser: ApiUser | null;
  userToUpdate: ApiUser | null;
  stats: UserStatistics | null;
  statsLoading: boolean;
  apiRoles: Role[];
  updating: boolean;
  creating: boolean;
}
