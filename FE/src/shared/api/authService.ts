// ============================================================
// Auth Service â€” all API calls related to authentication
// ============================================================

import axiosClient from "../../lib/axiosClient";
import type {
  LoginRequest, RegisterRequest, AuthTokens, ApiResponse,
  LoginResponseData, RegisterResponseData,
  ApiUserProfile, ChangePasswordRequest, ForgotPasswordResetRequest, MessageResponseData,
} from "../types/auth.types";

const AUTH_BASE = "/auth";

export const authService = {
  /** POST /auth/login  â†’ { status, data: { accessToken, refreshToken, subscription?, user? } } */
  login: (credentials: LoginRequest) =>
    axiosClient.post<ApiResponse<LoginResponseData>>(`${AUTH_BASE}/login`, credentials),

  /** POST /auth/google  -> same response shape as /auth/login.
   *  Body: { token } = the Google access_token from useGoogleLogin().
   *  Handles BOTH login and signup (BE auto-creates the account when the
   *  email has never been seen). */
  googleLogin: (token: string) =>
    axiosClient.post<ApiResponse<LoginResponseData>>(`${AUTH_BASE}/google`, { token }),

  /** POST /auth/signup  â†’ { status, data: { username, email, ... } }  (no tokens) */
  register: (data: RegisterRequest) =>
    axiosClient.post<ApiResponse<RegisterResponseData>>(`${AUTH_BASE}/signup`, data),

  /** POST /auth/register  â†’ { status, data: { userId, username, email, subscription } } (Admin only) */
  adminRegister: (data: RegisterRequest & { roleId: string }) =>
    axiosClient.post<ApiResponse<RegisterResponseData>>(`${AUTH_BASE}/register`, data),

  /** POST /auth/refresh-token  â†’ { status, data: { accessToken, refreshToken } }
   *  Body: { oldRefreshToken } â€” token rotation (old one revoked) */
  refreshToken: (oldRefreshToken: string) =>
    axiosClient.post<ApiResponse<AuthTokens>>(`${AUTH_BASE}/refresh-token`, { oldRefreshToken }),

  /** GET /users/me  â†’ { status, data: { userProfile: ApiUserProfile } } */
  getCurrentUser: () =>
    axiosClient.get<ApiResponse<{ userProfile: ApiUserProfile }>>(`/users/me`),

  /** DELETE /auth/logout  â†’ revoke refresh token, requires auth */
  logout: () =>
    axiosClient.delete(`${AUTH_BASE}/logout`),

  /** PATCH /auth/change-password â†’ Change user password after OTP verification */
  changePassword: (data: ChangePasswordRequest) =>
    axiosClient.patch<ApiResponse<MessageResponseData>>(`${AUTH_BASE}/change-password`, data),

  /** PATCH /auth/forgot-password â†’ Reset password using verified reset link */
  forgotPassword: (data: ForgotPasswordResetRequest) =>
    axiosClient.patch<ApiResponse<MessageResponseData>>(`${AUTH_BASE}/forgot-password`, data),

  /** POST /mail/forgot-password/send â†’ Send forgot password email with reset link */
  sendForgotPasswordEmail: (email: string) =>
    axiosClient.post<ApiResponse<MessageResponseData>>(`/mail/forgot-password/send`, { email }),

  /** POST /mail/forgot-password/verify â†’ Verify password reset link UUID */
  verifyForgotPasswordLink: (uuid: string) =>
    axiosClient.post<ApiResponse<{ isValid: string }>>(`/mail/forgot-password/verify?uuid=${uuid}`),
};
