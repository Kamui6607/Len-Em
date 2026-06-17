/**
 * Axios API client configured for Len&Em backend.
 *
 * - Base URL from env or default to localhost:5000
 * - JWT token injection via request interceptor
 * - 401 → auto-refresh attempt (fallback to logout)
 * - Typed response helpers
 */

// NOTE: axios is not yet installed. This service is designed to be
// plugged in when the backend is ready. Currently exports a mock
// adapter that uses local data so the frontend works independently.

import type { PaginatedResponse } from "../types/api.types";

// ============================================================
// 1. Configuration
// ============================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DEFAULT_PAGE_SIZE = 12;

// ============================================================
// 2. Types
// ============================================================

// ============================================================
// 3. Request helpers
// ============================================================

/**
 * Build query string from an object, skipping undefined/null/empty values.
 * Example: { category: "yarn", color: "pink", page: 1 }
 *   → "category=yarn&color=pink&page=1"
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value) && value.length === 0) return;
    if (Array.isArray(value)) {
      searchParams.set(key, value.join(","));
    } else {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
}

/**
 * Build a full paginated URL with query params.
 */
export function buildPaginatedUrl(
  basePath: string,
  params: Record<string, unknown>,
  page: number = 1,
  limit: number = DEFAULT_PAGE_SIZE
): string {
  const query = buildQueryString({
    ...params,
    page,
    limit,
  });
  return `${basePath}${query ? `?${query}` : ""}`;
}

// ============================================================
// 4. Mock adapter (for development without backend)
// ============================================================

/**
 * Performs a mock API call that simulates network delay
 * and returns a PaginatedResponse wrapping the filtered data.
 */
export async function mockPaginatedResponse<T>(
  data: T[],
  page: number = 1,
  limit: number = DEFAULT_PAGE_SIZE,
  delay: number = 0
): Promise<PaginatedResponse<T>> {
  // Simulate network latency (0ms = instant for dev)  
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const start = (page - 1) * limit;
  const pagedData = data.slice(start, start + limit);

  return {
    data: pagedData,
    page,
    totalPages,
    totalItems,
  };
}

// ============================================================
// 5. Future axios instance (uncomment when axios is installed)
// ============================================================

/*
import axios from "axios";

const api: ApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lenEm_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired — attempt refresh
      const refreshToken = localStorage.getItem("lenEm_refresh");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem("lenEm_token", data.token);
          // Retry original request
          error.config.headers.Authorization = `Bearer ${data.token}`;
          return api(error.config);
        } catch {
          // Refresh failed — force logout
          localStorage.removeItem("lenEm_token");
          localStorage.removeItem("lenEm_refresh");
          window.location.href = "/";
        }
      } else {
        localStorage.removeItem("lenEm_token");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;
*/

export { API_BASE_URL, DEFAULT_PAGE_SIZE };