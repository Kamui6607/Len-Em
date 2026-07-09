// ============================================================
// User Service — all API calls related to user management
// ============================================================

import axiosClient from "../../../lib/axiosClient";
import type { ApiResponse } from "../../../types/auth.types";

const USERS_BASE = "/users";

export type UserStatus = "ACTIVE" | "INACTIVE" | "LOCKED";
export type UserGender = "MALE" | "FEMALE" | "OTHER";

export interface UserRoleRef {
  _id: string;
  roleName: string;
}

export interface ApiUser {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  gender?: UserGender;
  dateOfBirth?: string;
  status: UserStatus;
  roleId: UserRoleRef | string;
  avatar?: string | { url: string; publicId: string };
}

export interface UsersListResponse {
  result: {
    users: ApiUser[];
    totalUsers: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface UserDetailResponse {
  result: ApiUser;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  gender?: UserGender;
  dateOfBirth?: string;
  subscription?: string;
}

export interface UpdateStatusRequest {
  status: UserStatus;
  description?: string;
}

export interface UpdateRoleRequest {
  roleId: string;
}

export interface UsersByRole {
  count: number;
  roleName: string;
}

export interface UsersByStatus {
  count: number;
  status: string;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  lockedUsers: number;
  usersByRole: UsersByRole[];
  usersByStatus: UsersByStatus[];
}

export const userService = {
  /** GET /users — Get all users with pagination & filters (Admin only) */
  getAllUsers: (params?: { page?: number; limit?: number; status?: UserStatus; roleId?: string }) =>
    axiosClient.get<ApiResponse<UsersListResponse>>(USERS_BASE, { params }),

  /** GET /users/{userId} — Get user by ID (Admin only) */
  getUserById: (userId: string) =>
    axiosClient.get<ApiResponse<UserDetailResponse>>(`${USERS_BASE}/${userId}`),

  /** GET /users/me — Get current user profile */
  getMe: () =>
    axiosClient.get<ApiResponse<{ userProfile: UserDetailResponse["result"] }>>(`${USERS_BASE}/me`),

  /** PATCH /users/{userId} — Update user data (self only) */
  updateUser: (userId: string, data: UpdateUserRequest) =>
    axiosClient.patch<ApiResponse<{ updatedResult: UserDetailResponse["result"] }>>(
      `${USERS_BASE}/${userId}`, { userData: data }
    ),

  /** PATCH /users/admin-update/{queryUserId} — Admin/Staff update any user's data (except role & status) */
  adminUpdateUser: (queryUserId: string, data: UpdateUserRequest) =>
    axiosClient.patch<ApiResponse<{ updatedResult: UserDetailResponse["result"] }>>(
      `${USERS_BASE}/admin-update/${queryUserId}`, { userData: data }
    ),

  /** DELETE /users/{userId} — Soft delete user (Admin only) */
  deleteUser: (userId: string) =>
    axiosClient.delete<ApiResponse<{ deletedUser: { userId: string; username: string; status: string } }>>(
      `${USERS_BASE}/${userId}`
    ),

  /** PATCH /users/upload-avatar/{userId} — Upload avatar (self only) */
  uploadAvatar: (userId: string, file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return axiosClient.patch<ApiResponse<{ updatedUser: { userId: string; avatar: { url: string; publicId: string } } }>>(
      `${USERS_BASE}/upload-avatar/${userId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  },

  /** PATCH /users/update-status/{userId} — Update user status (Admin only) */
  updateUserStatus: (userId: string, data: UpdateStatusRequest) =>
    axiosClient.patch<ApiResponse<{ updateResult: UserDetailResponse["result"] }>>(
      `${USERS_BASE}/update-status/${userId}`, data
    ),

  /** PATCH /users/{userId}/role — Update user role (Admin only) */
  updateUserRole: (userId: string, data: UpdateRoleRequest) =>
    axiosClient.patch<ApiResponse<{ updateResult: UserDetailResponse["result"] }>>(
      `${USERS_BASE}/${userId}/role`, data
    ),

  /** GET /users/statistics — Get user statistics */
  getStatistics: () =>
    axiosClient.get<ApiResponse<UserStatistics>>(`${USERS_BASE}/statistics`),
};

