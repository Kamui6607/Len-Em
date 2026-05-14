// ============================================================
// Zustand Auth Store
// ============================================================
// USAGE: replace FE/src/store/auth.store.ts with this file
// ============================================================

import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import { authService } from "../services/auth.service";
import { tokenStorage } from "../lib/axiosClient";
import type {
  AuthState,
  LoginRequest,
  RegisterRequest,
  User,
  DecodedToken,
} from "../types/auth.types";
import { toast } from "sonner";

// ---- Helpers ----

function safeDecode(token: string): DecodedToken | null {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  const decoded = safeDecode(token);
  if (!decoded) return false;
  return decoded.exp * 1000 > Date.now();
}

/**
 * Build a minimal User shell from JWT payload.
 * The store will attempt to enrich this with a /auth/me call when possible.
 */
function buildUserFromToken(decoded: DecodedToken): Partial<User> {
  return {
    id: decoded.userId,
    roleId: decoded.role,
  };
}

/**
 * Attempt to silently refresh the access token.
 * Returns the new access token on success, null on failure.
 */
async function attemptTokenRefresh(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return null;
  try {
    const { data } = await authService.refreshToken(refreshToken);
    const tokens = data.data;
    tokenStorage.setAccess(tokens.accessToken);
    tokenStorage.setRefresh(tokens.refreshToken);
    return tokens.accessToken;
  } catch {
    return null;
  }
}

// ---- Store ----

export const useAuthStore = create<AuthState>((set) => ({
  // ---- Initial state ----
  user: null,
  accessToken: tokenStorage.getAccess(),
  refreshToken: tokenStorage.getRefresh(),
  isAuthenticated: false, // resolved properly in initialize()
  isLoading: true,

  // ---- initialize ----
  /**
   * Call once on app mount (e.g. in App.tsx useEffect).
   * Validates existing tokens, refreshes if expired, restores user state.
   */
  initialize: async () => {
    const accessToken = tokenStorage.getAccess();
    const refreshToken = tokenStorage.getRefresh();

    // No tokens at all → unauthenticated
    if (!accessToken && !refreshToken) {
      set({ isAuthenticated: false, isLoading: false, user: null });
      return;
    }

    // Try to use existing access token
    if (accessToken && isTokenValid(accessToken)) {
      const decoded = safeDecode(accessToken);
      if (!decoded) {
        tokenStorage.clear();
        set({ isAuthenticated: false, isLoading: false, user: null });
        return;
      }

      // Attempt to fetch full user profile; fall back to JWT payload
      let user: User | null = null;
      try {
        const resp = await authService.getCurrentUser();
        user = resp.data.data;
      } catch {
        user = buildUserFromToken(decoded) as User;
      }

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
      return;
    }

    // Access token expired or missing — try refresh
    const newAccessToken = await attemptTokenRefresh();
    if (!newAccessToken) {
      tokenStorage.clear();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    const decoded = safeDecode(newAccessToken);
    if (!decoded) {
      tokenStorage.clear();
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    let user: User | null = null;
    try {
      const resp = await authService.getCurrentUser();
      user = resp.data.data;
    } catch {
      user = buildUserFromToken(decoded) as User;
    }

    set({
      user,
      accessToken: newAccessToken,
      refreshToken: tokenStorage.getRefresh(),
      isAuthenticated: true,
      isLoading: false,
    });
  },

  // ---- login ----
  /**
   * POST /auth/login
   *
   * Detects whether the identifier is an email or username and sends
   * only the relevant field (backend accepts either, not both required).
   */
  login: async (credentials: LoginRequest) => {
    set({ isLoading: true });
    try {
      // Build minimal payload
      const payload: LoginRequest = { password: credentials.password };
      if (credentials.email) {
        payload.email = credentials.email;
      } else if (credentials.username) {
        payload.username = credentials.username;
      }

      const { data } = await authService.login(payload);
      const tokens = data.data;

      tokenStorage.setAccess(tokens.accessToken);
      tokenStorage.setRefresh(tokens.refreshToken);

      // Decode JWT for role / userId immediately
      const decoded = safeDecode(tokens.accessToken);
      if (!decoded) throw new Error("Invalid token received from server");

      // Enrich with full profile if backend supports /auth/me
      let user: User | null = null;
      try {
        const resp = await authService.getCurrentUser();
        user = resp.data.data;
      } catch {
        // /auth/me may not be implemented yet — fall back to JWT payload
        user = buildUserFromToken(decoded) as User;
      }

      set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      // Persist for page refreshes (used by non-Zustand parts of the app)
      localStorage.setItem("cozyStitch_user", JSON.stringify(user));
      toast.success("Welcome back!");
    } catch (error) {
      set({ isLoading: false });
      throw error; // let the UI handle the error message
    }
  },

  // ---- register ----
  register: async (data: RegisterRequest) => {
    set({ isLoading: true });
    try {
      const { data: response } = await authService.register(data);
      const tokens = response.data;

      tokenStorage.setAccess(tokens.accessToken);
      tokenStorage.setRefresh(tokens.refreshToken);

      let user: User | null = null;
      try {
        const resp = await authService.getCurrentUser();
        user = resp.data.data;
      } catch {
        const decoded = safeDecode(tokens.accessToken);
        if (decoded) user = buildUserFromToken(decoded) as User;
      }

      set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      localStorage.setItem("cozyStitch_user", JSON.stringify(user));
      toast.success("Account created! Welcome to CozyStitch.");
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // ---- logout ----
  logout: () => {
    // Best-effort server-side token invalidation
    authService.logout().catch(() => {});
    tokenStorage.clear();
    localStorage.removeItem("cozyStitch_user");
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    toast.success("Signed out. See you soon!");
  },

  setUser: (user: User) => {
    set({ user });
    localStorage.setItem("cozyStitch_user", JSON.stringify(user));
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