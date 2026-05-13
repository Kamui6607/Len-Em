import { create } from "zustand";
import { authService } from "../services/auth.service";
import { tokenStorage } from "../lib/axiosClient";
import type {
  AuthState,
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/auth.types";
import { toast } from "sonner";

// ============================================================
// Zustand Auth Store
// ============================================================

export const useAuthStore = create<AuthState>((set) => ({
  // ---- Initial state ----
  user: null,
  accessToken: tokenStorage.getAccess(),
  refreshToken: tokenStorage.getRefresh(),
  isAuthenticated: !!tokenStorage.getAccess(),
  isLoading: true, // true until initialize() completes

  // ---- Actions ----

  /**
   * Initialize auth state on app mount.
   * Checks for existing tokens, validates them, and fetches user profile.
   */
  initialize: async () => {
    const accessToken = tokenStorage.getAccess();
    const refreshToken = tokenStorage.getRefresh();

    if (!accessToken || !refreshToken) {
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const { data } = await authService.getCurrentUser();
      const user = data.data;
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      // Token is invalid or expired — clear everything
      tokenStorage.clear();
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  /**
   * Login with email/username + password.
   * Stores tokens in localStorage and sets user data.
   */
  login: async (credentials: LoginRequest) => {
    set({ isLoading: true });
    try {
      const { data } = await authService.login(credentials);
      const tokens = data.data;

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
      toast.success(`Welcome back, ${user.fullName || user.username}!`);
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
    set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isAuthenticated: true });
  },
}));