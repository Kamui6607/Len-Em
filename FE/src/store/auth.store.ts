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
import { mapRoleNameToUserRole } from "../types/auth.types";
import { toast } from "sonner";

// ---- Demo Accounts (fallback when backend is unavailable) ----

interface DemoAccount {
  email: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  roleId: "admin" | "staff" | "user";
}

const demoAccounts: DemoAccount[] = [
  {
    email: "admin@gmail.com",
    username: "admin",
    password: "123",
    fullName: "Admin User",
    phone: "123456789",
    roleId: "admin",
  },
  {
    email: "staff@gmail.com",
    username: "staff",
    password: "123",
    fullName: "Staff User",
    phone: "987654321",
    roleId: "staff",
  },
  {
    email: "tranngoc5979@gmail.com",
    username: "tranngoc",
    password: "123",
    fullName: "Tran Ngoc",
    phone: "0703339186",
    roleId: "user",
  },
  {
    email: "kamuikatzzz@gmail.com",
    username: "kamuikatzzz",
    password: "123",
    fullName: "Kamui Katz",
    phone: "0909315708",
    roleId: "user",
  },
];

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
    fullName: decoded.fullName,
    roleId: mapRoleNameToUserRole(decoded.roleName),
  };
}

/**
 * Try to match credentials against demo accounts.
 * Returns a User object if matched, null otherwise.
 */
function matchDemoAccount(emailOrUsername: string, password: string): User | null {
  const account = demoAccounts.find(
    (acc) =>
      (acc.email === emailOrUsername || acc.username === emailOrUsername) &&
      acc.password === password,
  );
  if (!account) return null;
  return {
    id: `demo-${account.roleId}-${Date.now()}`,
    email: account.email,
    username: account.username,
    fullName: account.fullName,
    phone: account.phone,
    address: "",
    gender: "OTHER",
    dateOfBirth: "",
    roleId: account.roleId,
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

      // Build user from JWT payload (backend JWT contains fullName, roleName, userId)
      const user = buildUserFromToken(decoded) as User;

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

    const user = buildUserFromToken(decoded) as User;

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
   * First tries API login. If backend is unavailable, falls back to demo accounts.
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

      // Try API login first
      const { data } = await authService.login(payload);
      const tokens = data.data;

      tokenStorage.setAccess(tokens.accessToken);
      tokenStorage.setRefresh(tokens.refreshToken);

      // Decode JWT for user info
      const decoded = safeDecode(tokens.accessToken);
      if (!decoded) throw new Error("Invalid token received from server");

      // Build user from JWT payload (contains fullName, roleName, userId)
      const user = buildUserFromToken(decoded) as User;

      set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      // Persist for page refreshes
      localStorage.setItem("cozyStitch_user", JSON.stringify(user));
      toast.success("Welcome back!");
    } catch (apiError) {
      // API call failed — try demo account fallback
      const identifier = credentials.email || credentials.username || "";
      const demoUser = matchDemoAccount(identifier, credentials.password);

      if (demoUser) {
        set({
          user: demoUser,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: true,
          isLoading: false,
        });
        localStorage.setItem("cozyStitch_user", JSON.stringify(demoUser));
        toast.success("Welcome back! (Demo mode)");
        return;
      }

      set({ isLoading: false });
      throw apiError; // let the UI handle the error message
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

      const decoded = safeDecode(tokens.accessToken);
      const user = decoded ? (buildUserFromToken(decoded) as User) : null;

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