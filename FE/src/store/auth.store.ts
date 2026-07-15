// ============================================================
// Auth Store — Zustand store for authentication state
// ============================================================

import { create } from "zustand";
import { authService } from "../services/auth.service";
import { markVoluntaryLogout, tokenStorage } from "../lib/axiosClient";
import { isAuthenticated as hasValidToken } from "../lib/authUtils";
import type { AuthState, LoginRequest, RegisterRequest, User } from "../types/auth.types";
import { normalizeApiUserProfile } from "../types/auth.types";

let _initialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    // Guard: prevent double-execution from StrictMode or re-renders
    if (_initialized) return;
    _initialized = true;

    set({ isLoading: true });
    try {
      if (!hasValidToken()) {
        set({ isLoading: false, isAuthenticated: false, user: null });
        return;
      }

      const { data } = await authService.getCurrentUser();
      const user = normalizeApiUserProfile(data.data.userProfile);

      set({
        user,
        accessToken: tokenStorage.getAccess(),
        refreshToken: tokenStorage.getRefresh(),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      tokenStorage.clear();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true });
    try {
      const { data } = await authService.login(credentials);
      const { accessToken, refreshToken } = data.data;

      tokenStorage.setAccess(accessToken);
      tokenStorage.setRefresh(refreshToken);

      // Mark initialized so if App re-renders and calls initialize(), it's a no-op
      _initialized = true;

      // Fetch full user profile and normalize backend role object for app routing
      const profileRes = await authService.getCurrentUser();
      const user = normalizeApiUserProfile(profileRes.data.data.userProfile);

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true });
    try {
      const { data: res } = await authService.register(data);
      set({ isLoading: false });
      return res.message || "Registration successful";
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    _initialized = false;
    // Local logout only. Mark it so pending protected requests do not show
    // session-expired toasts or force a second redirect while the app moves to Login.
    markVoluntaryLogout();
    tokenStorage.clear();
    localStorage.removeItem("lenEm_user");
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setUser: (user: User) => {
    set({ user });
  },

  setTokens: (tokens) => {
    tokenStorage.setAccess(tokens.accessToken);
    tokenStorage.setRefresh(tokens.refreshToken);
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
  },
}));