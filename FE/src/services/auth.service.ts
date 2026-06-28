// ============================================================
// Auth Service — all API calls related to authentication
// ============================================================

import axiosClient from "../lib/axiosClient";
import type {
  LoginRequest, RegisterRequest, AuthTokens, ApiResponse,
  LoginResponseData, RegisterResponseData,
  ApiUserProfile, ChangePasswordRequest, ForgotPasswordResetRequest, MessageResponseData,
} from "../types/auth.types";

const AUTH_BASE = "/auth";

export const authService = {
  /** POST /auth/login  → { status, data: { accessToken, refreshToken, subscription?, user? } } */
  login: (credentials: LoginRequest) =>
    axiosClient.post<ApiResponse<LoginResponseData>>(`${AUTH_BASE}/login`, credentials),

  /** POST /auth/signup  → { status, data: { username, email, ... } }  (no tokens) */
  register: (data: RegisterRequest) =>
    axiosClient.post<ApiResponse<RegisterResponseData>>(`${AUTH_BASE}/signup`, data),

  /** POST /auth/refresh-token  → { status, data: { accessToken, refreshToken } }
   *  Body: { oldRefreshToken } — token rotation (old one revoked) */
  refreshToken: (oldRefreshToken: string) =>
    axiosClient.post<ApiResponse<AuthTokens>>(`${AUTH_BASE}/refresh-token`, { oldRefreshToken }),

  /** GET /users/me  → { status, data: { userProfile: ApiUserProfile } } */
  getCurrentUser: () =>
    axiosClient.get<ApiResponse<{ userProfile: ApiUserProfile }>>(`/users/me`),

  /** DELETE /auth/logout  → revoke refresh token, requires auth */
  logout: () =>
    axiosClient.delete(`${AUTH_BASE}/logout`),

  /** PATCH /auth/change-password → Change user password after OTP verification */
  changePassword: (data: ChangePasswordRequest) =>
    axiosClient.patch<ApiResponse<MessageResponseData>>(`${AUTH_BASE}/change-password`, data),

  /** PATCH /auth/forgot-password → Reset password using verified reset link */
  forgotPassword: (data: ForgotPasswordResetRequest) =>
    axiosClient.patch<ApiResponse<MessageResponseData>>(`${AUTH_BASE}/forgot-password`, data),

  /** POST /mail/forgot-password → Send forgot password email with reset link */
  sendForgotPasswordEmail: (email: string) =>
    axiosClient.post<ApiResponse<MessageResponseData>>(`/mail/forgot-password`, { email }),
};
