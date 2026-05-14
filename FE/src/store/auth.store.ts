import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import { authService } from "../services/auth.service";
import { tokenStorage } from "../lib/axiosClient";
import type {
  AuthState,
  LoginRequest,
  RegisterRequest,
  User,
  UserRole,
  DecodedToken,
} from "../types/auth.types";
import { toast } from "sonner";

// ============================================================
// Zustand Auth Store
// ============================================================

/** Build a minimal User object from the decoded JWT payload. */
function buildUserFromToken(decoded: DecodedToken): User {
  return {
    id: decoded.userId,
    email: "",
    username: "",
    fullName: "",
    phone: "",
    address: "",
    gender: "OTHER",
    dateOfBirth: "",
    roleId: decoded.role as UserRole,
  };
}

/**
 * Attempt to refresh the access token.
 * This is a stub — no backend call yet, but the hook is ready.
 * Returns the new access token, or null if refresh failed.
 */
async function refreshAccessToken(): Promise<string | null> {
  // TODO: wire up a real /auth/refresh call when the endpoint is ready
  return null;
}

export const useAuthStore = create<AuthState>((set) => ({
  // ---- Initial state ----
  user: null,
  accessToken: tokenStorage.getAccess(),
  refreshToken: tokenStorage.getRefresh(),
  isAuthenticated: !!tokenStorage.getAccess() && (() => {
    const token = tokenStorage.getAccess();
    if (!token) return false;
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  })(),
  isLoading: true, // true until initialize() completes

  // ---- Actions ----

  /**
   * Initialize auth state on app mount.
   * Checks for existing tokens, validates them, and restores state
   * from the JWT payload without an extra API call.
   */
  initialize: async () => {
    const accessToken = tokenStorage.getAccess();
    const refreshToken = tokenStorage.getRefresh();

    if (!accessToken || !refreshToken) {
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(accessToken);

      // Token expired — try refresh
      if (decoded.exp * 1000 <= Date.now()) {
        const newAccessToken = await refreshAccessToken();
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
        // Refresh succeeded — decode new token
        const newDecoded = jwtDecode<DecodedToken>(newAccessToken);
        const user = buildUserFromToken(newDecoded);
        set({
          user,
          accessToken: newAccessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }

      // Token is still valid — restore from JWT
      const user = buildUserFromToken(decoded);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      // Malformed token — clear everything
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

  /**
   * Login with email/username + password.
   * Stores tokens in localStorage and builds user from the JWT.
   */
  login: async (credentials: LoginRequest) => {
    set({ isLoading: true });
    try {
      const { data } = await authService.login(credentials);
      const tokens = data.data;

      tokenStorage.setAccess(tokens.accessToken);
      tokenStorage.setRefresh(tokens.refreshToken);

      // Decode JWT to extract user info — no extra /auth/me call
      const decoded = jwtDecode<DecodedToken>(tokens.accessToken);
      const user = buildUserFromToken(decoded);

      set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      localStorage.setItem("cozyStitch_user", JSON.stringify(user));
      toast.success("Login successful!");
    } catch (error) {
      set({ isLoading: false });
      // Toast is handled by axiosClient interceptor
      throw error;
    }
  },

  /**
   * Register a new account.
   * Stores tokens in localStorage and sets user data.
   */
  register: async (data: RegisterRequest) => {
    set({ isLoading: true });
    try {
      const { data: response } = await authService.register(data);
      const tokens = response.data;

      tokenStorage.setAccess(tokens.accessToken);
      tokenStorage.setRefresh(tokens.refreshToken);

      // Fetch user profile
      const userResponse = await authService.getCurrentUser();
      const user = userResponse.data.data;

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

  /**
   * Logout — clears tokens and user state.
   * Attempts server-side logout, but clears state regardless.
   */
  logout: () => {
    // Attempt server logout (fire & forget)
    try {
      authService.logout();
    } catch {
      // Ignore server errors on logout
    }

    tokenStorage.clear();
    localStorage.removeItem("cozyStitch_user");
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    toast.success("You've been signed out. Come back soon!");
  },

  /**
   * Set user data (e.g., after profile update).
   */
  setUser: (user: User) => {
    set({ user });
    localStorage.setItem("cozyStitch_user", JSON.stringify(user));
  },

  /**
   * Set tokens (e.g., after refresh).
   */
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => {
    tokenStorage.setAccess(tokens.accessToken);
    tokenStorage.setRefresh(tokens.refreshToken);
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
  },
}));