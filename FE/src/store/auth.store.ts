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
 * Refresh the access token by calling the backend /auth/refresh endpoint.
 * Returns the new access token string, or null if refresh failed.
 */
async function refreshAccessToken(): Promise<string | null> {
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

export const useAuthStore = create<AuthState>((set) => ({
  // ---- Initial state ----
  user: null,
  accessToken: tokenStorage.getAccess(),
  refreshToken: tokenStorage.getRefresh(),
  isAuthenticated:
    !!tokenStorage.getAccess() &&
    (() => {
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
   * Validates existing tokens and restores state from JWT payload.
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
        const newDecoded = jwtDecode<DecodedToken>(newAccessToken);
        const user = buildUserFromToken(newDecoded);
        set({
          user,
          accessToken: newAccessToken,
          refreshToken: tokenStorage.getRefresh(),
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }

      // Token still valid — restore from JWT
      const user = buildUserFromToken(decoded);
      set({ user, isAuthenticated: true, isLoading: false });
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

  /**
   * Login with email/username + password.
   *
   * The API accepts either `email` or `username` — we detect which one
   * the user typed and send only the relevant field.
   */
  login: async (credentials: LoginRequest) => {
    set({ isLoading: true });
    try {
      // Build the minimal payload: send email OR username, never both
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
      throw error;
    }
  },

  /**
   * Register a new account.
   */
  register: async (data: RegisterRequest) => {
    set({ isLoading: true });
    try {
      const { data: response } = await authService.register(data);
      const tokens = response.data;

      tokenStorage.setAccess(tokens.accessToken);
      tokenStorage.setRefresh(tokens.refreshToken);

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
   */
  logout: () => {
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

  setUser: (user: User) => {
    set({ user });
    localStorage.setItem("cozyStitch_user", JSON.stringify(user));
  },

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