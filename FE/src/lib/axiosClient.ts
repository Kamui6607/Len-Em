// ============================================================
// Axios Client — JWT injection + silent token refresh
// ============================================================
// USAGE: replace FE/src/lib/axiosClient.ts with this file
// ============================================================

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

// ─── API Base URL ────────────────────────────────────────
// VITE_API_BASE_URL (from .env) is NOT committed to git, so on Vercel/many
// production hosts the env var may be missing at build time. Use an absolute
// production fallback so requests never hit the static host (which would
// return 405 Method Not Allowed for POST/PATCH/DELETE).
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? "https://yarn-shop-be.onrender.com/api/v1"
    : "/api/v1");

// ---- Token storage ----
// Security: if the user does NOT tick "Remember me", tokens are stored in
// sessionStorage (cleared when the tab closes) instead of localStorage.
// This prevents tokens persisting on shared/public machines.

const TOKEN_KEY = "lenEm_accessToken";
const REFRESH_KEY = "lenEm_refreshToken";
const VOLUNTARY_LOGOUT_KEY = "lenEm_voluntaryLogout";
const PERSIST_KEY = "lenEm_rememberMe";

export function markVoluntaryLogout(): void {
  sessionStorage.setItem(VOLUNTARY_LOGOUT_KEY, "true");
  window.setTimeout(() => sessionStorage.removeItem(VOLUNTARY_LOGOUT_KEY), 2000);
}

function isVoluntaryLogout(): boolean {
  return sessionStorage.getItem(VOLUNTARY_LOGOUT_KEY) === "true";
}

/** Whether the user chose "Remember me" (persist sessions across browser restarts). */
function shouldPersist(): boolean {
  return localStorage.getItem(PERSIST_KEY) === "true";
}

function storage(): Storage {
  return shouldPersist() ? localStorage : sessionStorage;
}

export const tokenStorage = {
  getAccess: (): string | null => storage().getItem(TOKEN_KEY),
  setAccess: (token: string): void => storage().setItem(TOKEN_KEY, token),
  getRefresh: (): string | null => storage().getItem(REFRESH_KEY),
  setRefresh: (token: string): void => storage().setItem(REFRESH_KEY, token),
  setRememberMe: (remember: boolean): void => {
    if (remember) {
      localStorage.setItem(PERSIST_KEY, "true");
    } else {
      localStorage.removeItem(PERSIST_KEY);
    }
  },
  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(PERSIST_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};

// ---- Axios instance ----

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ---- Refresh-queue state ----

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null): void {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  pendingQueue = [];
}

// ---- Request interceptor: attach Bearer token ----

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccess();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---- Response interceptor: handle 401 + silent refresh ----

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Skip 401 handling for login requests — the caller (LoginPage) handles the error
    if (error.response?.status !== 401 || original._retry) {
      return handleAxiosError(error);
    }

    const requestUrl = original.url ?? "";
    // Skip for login + Google auth — the callers (LoginPage / RegisterPage /
    // GoogleAuthButton) display those errors themselves
    if (
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/google")
    ) {
      return handleAxiosError(error);
    }

    if (isRefreshing) {
      // Queue subsequent 401s until refresh completes
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newToken) => {
        if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) {
      isRefreshing = false;
      forceLogout();
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        oldRefreshToken: refreshToken,
      });

      // Support both { data: { accessToken } } and { accessToken } response shapes
      const newAccessToken = data.data?.accessToken ?? data.accessToken;
      const newRefreshToken = data.data?.refreshToken ?? data.refreshToken;

      tokenStorage.setAccess(newAccessToken);
      if (newRefreshToken) tokenStorage.setRefresh(newRefreshToken);

      flushQueue(null, newAccessToken);
      if (original.headers)
        original.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosClient(original);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ---- Error handler ----

function handleAxiosError(error: AxiosError): Promise<never> {
  if (isVoluntaryLogout()) {
    return Promise.reject(error);
  }

  const status = error.response?.status;
  const data = error.response?.data as Record<string, unknown> | undefined;
  const message =
    (data?.message as string) ||
    (data?.error as string) ||
    error.message ||
    "Something went wrong";

  // Debug logging for 403 errors
  if (status === 403) {
    console.error("403 Forbidden - Full error details:", {
      url: error.config?.url,
      method: error.config?.method,
      status,
      data,
      message,
    });
  }

  // Skip toast for logout endpoint — backend may return 400 if no session
  const url = error.config?.url ?? "";
  if (url.includes("/auth/logout")) {
    return Promise.reject(error);
  }

  if (status && status !== 401) {
    // Skip toast for /kits 404s — combos may not exist on backend yet
    if (status === 404 && url.includes("/kits/")) {
      return Promise.reject(error);
    }
    const mapped: Record<number, string> = {
      400: "Invalid input. Please check your data.",
      403: "You don't have permission to do that.",
      404: "Resource not found.",
      409: "This resource already exists.",
      429: "Too many requests. Please slow down.",
      500: "Server error. Please try again later.",
    };
    toast.error(mapped[status] ?? message);
  }

  return Promise.reject(error);
}

function forceLogout(): void {
  tokenStorage.clear();
  localStorage.removeItem("lenEm_user");

  if (isVoluntaryLogout()) {
    return;
  }

  // Only show toast if not already on the login page
  if (!window.location.pathname.startsWith("/auth/")) {
    toast.error("Session expired. Please sign in again.");
  }
  // Use replace to avoid keeping the error page in history
  // and avoid a full page reload when already on the auth page
  const currentPath = window.location.pathname;
  if (!currentPath.startsWith("/auth/")) {
    window.location.replace("/auth/login");
  }
}

export default axiosClient;
export { API_BASE_URL };