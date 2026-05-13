import axiosClient from "../lib/axiosClient";
import type {
  LoginRequest,
  RegisterRequest,
  AuthTokens,
  User,
  ApiResponse,
} from "../types/auth.types";

// ============================================================
// Auth Service — all API calls related to authentication
// ============================================================

const AUTH_BASE = "/auth";

export const authService = {
  /**
   * Login with email/username + password.
   * POST /auth/login → { accessToken, refreshToken }
   */
  login: (credentials: LoginRequest) =>
    axiosClient.post<ApiResponse<AuthTokens>>(`${AUTH_BASE}/login`, credentials),

  /**
   * Register a new user.
   * POST /auth/register → { accessToken, refreshToken }
   */
  register: (data: RegisterRequest) =>
    axiosClient.post<ApiResponse<AuthTokens>>(`${AUTH_BASE}/register`, data),

  /**
   * Refresh access token using refresh token.
   * POST /auth/refresh → { accessToken, refreshToken }
   */
  refreshToken: (refreshToken: string) =>
    axiosClient.post<ApiResponse<AuthTokens>>(`${AUTH_BASE}/refresh`, { refreshToken }),

  /**
   * Get current user profile.
   * GET /auth/me → User
   */
  getCurrentUser: () =>
    axiosClient.get<ApiResponse<User>>(`${AUTH_BASE}/me`),

  /**
   * Logout (invalidate tokens on server).
   * POST /auth/logout
   */
  logout: () =>
    axiosClient.post(`${AUTH_BASE}/logout`),
};