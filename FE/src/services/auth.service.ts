// ============================================================
// Auth Service — all API calls related to authentication
// ============================================================
// USAGE: replace FE/src/services/auth.service.ts with this file
// ============================================================

import axiosClient from "../lib/axiosClient";
import type {
  LoginRequest,
  RegisterRequest,
  AuthTokens,
  User,
  ApiResponse,
} from "../types/auth.types";

const AUTH_BASE = "/auth";

export const authService = {
  /**
   * Login with email/username + password.
   * POST /auth/login → { status, data: { accessToken, refreshToken } }
   *
   * The backend accepts EITHER email OR username (not both required).
   * Send only the field the user provided.
   */
  login: (credentials: LoginRequest) =>
    axiosClient.post<ApiResponse<AuthTokens>>(`${AUTH_BASE}/login`, credentials),

  /**
   * Register a new user.
   * POST /auth/register → { status, data: { accessToken, refreshToken } }
   */
  register: (data: RegisterRequest) =>
    axiosClient.post<ApiResponse<AuthTokens>>(`${AUTH_BASE}/register`, data),

  /**
   * Refresh the access token.
   * POST /auth/refresh → { status, data: { accessToken, refreshToken } }
   */
  refreshToken: (refreshToken: string) =>
    axiosClient.post<ApiResponse<AuthTokens>>(`${AUTH_BASE}/refresh`, { refreshToken }),

  /**
   * Fetch the currently authenticated user's profile.
   * GET /auth/me → { status, data: User }
   */
  getCurrentUser: () =>
    axiosClient.get<ApiResponse<User>>(`${AUTH_BASE}/me`),

  /**
   * Invalidate tokens on the server.
   * POST /auth/logout
   */
  logout: () =>
    axiosClient.post(`${AUTH_BASE}/logout`),
};