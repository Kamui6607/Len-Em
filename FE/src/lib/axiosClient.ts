import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

// ============================================================
// Axios Client with JWT & Refresh Token Interceptors
// ============================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ---- Token storage helpers ----
const TOKEN_KEY = "cozyStitch_accessToken";
const REFRESH_KEY = "cozyStitch_refreshToken";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  setAccess: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setRefresh: (token: string) => localStorage.setItem(REFRESH_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// Prevent multiple concurrent refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  failedQueue = [];
}

// ---- Request Interceptor: attach JWT ----
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccess();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response Interceptor: handle 401 + refresh ----
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If not 401 or already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return handleError(error);
    }

    // Attempt token refresh
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return axiosClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) {
      isRefreshing = false;
      forceLogout();
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });
      const newAccessToken = data.data?.accessToken || data.accessToken;
      const newRefreshToken = data.data?.refreshToken || data.refreshToken;

      tokenStorage.setAccess(newAccessToken);
      if (newRefreshToken) tokenStorage.setRefresh(newRefreshToken);

      processQueue(null, newAccessToken);
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return axiosClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ---- Error handling ----
function handleError(error: AxiosError) {
  const status = error.response?.status;
  const data = error.response?.data as Record<string, unknown> | undefined;
  const message =
    (data?.message as string) ||
    (data?.error as string) ||
    error.message ||
    "Something went wrong";

  // Toast for user-facing errors (skip 401 — handled by interceptor)
  if (status && status !== 401) {
    const statusMessages: Record<number, string> = {
      400: "Invalid input. Please check your data.",
      403: "You don't have permission to do that.",
      404: "Resource not found.",
      409: "This resource already exists.",
      429: "Too many requests. Please slow down.",
      500: "Server error. Please try again later.",
    };
    toast.error(statusMessages[status] || message);
  }

  if (!status) {
    toast.error("Network error. Check your connection.");
  }

  return Promise.reject(error);
}

function forceLogout() {
  tokenStorage.clear();
  localStorage.removeItem("cozyStitch_user");
  // Redirect to home — the auth store will handle state reset
  window.location.href = "/";
  toast.error("Session expired. Please log in again.");
}

export default axiosClient;