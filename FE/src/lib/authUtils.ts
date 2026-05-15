// ============================================================
// Auth Utility Functions — pure helpers, no React, no UI
// ============================================================
// USAGE: replace FE/src/lib/authUtils.ts with this file
// ============================================================

import { jwtDecode } from "jwt-decode";
import { tokenStorage } from "./axiosClient";
import type { DecodedToken, UserRole } from "../types/auth.types";

// ---- Token helpers ----

/**
 * Decode JWT without throwing — returns null on any error.
 */
function safeDecode(token: string): DecodedToken | null {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

/**
 * Returns true if a valid, non-expired access token exists.
 */
export function isAuthenticated(): boolean {
  const token = tokenStorage.getAccess();
  if (!token) return false;
  const decoded = safeDecode(token);
  if (!decoded) return false;
  return decoded.exp * 1000 > Date.now();
}

/**
 * Returns the raw access token string, or null if absent.
 */
export function getAccessToken(): string | null {
  return tokenStorage.getAccess();
}

/**
 * Returns the raw refresh token string, or null if absent.
 */
export function getRefreshToken(): string | null {
  return tokenStorage.getRefresh();
}

/**
 * Decodes and returns the JWT payload, or null on failure.
 */
export function getDecodedToken(): DecodedToken | null {
  const token = tokenStorage.getAccess();
  if (!token) return null;
  return safeDecode(token);
}

/**
 * Returns the role embedded in the JWT, or null if unavailable.
 * Backend stores the role as roleName (string like "Admin", "Staff", "User").
 */
export function getUserRole(): UserRole | null {
  const decoded = getDecodedToken();
  if (!decoded) return null;
  // decoded.roleName is the backend field (e.g. "Admin", "Staff", "User")
  const roleMap: Record<string, UserRole> = {
    Admin: "admin",
    Staff: "staff",
    User: "user",
  };
  return roleMap[decoded.roleName] ?? null;
}

/**
 * Returns true when the access token is expired (or missing).
 */
export function isTokenExpired(): boolean {
  const decoded = getDecodedToken();
  if (!decoded) return true;
  return decoded.exp * 1000 <= Date.now();
}

/**
 * Returns the number of seconds until the token expires.
 * Returns 0 if already expired or token is missing.
 */
export function getTokenTtlSeconds(): number {
  const decoded = getDecodedToken();
  if (!decoded) return 0;
  const remaining = decoded.exp * 1000 - Date.now();
  return remaining > 0 ? Math.floor(remaining / 1000) : 0;
}

/**
 * Clears both tokens and removes the cached user from localStorage.
 */
export function logout(): void {
  tokenStorage.clear();
  localStorage.removeItem("cozyStitch_user");
}

// ---- Role-based access helpers ----

/**
 * Returns true if the current user's role is in the allowedRoles list.
 */
export function canAccess(allowedRoles: UserRole[]): boolean {
  const role = getUserRole();
  if (!role) return false;
  return allowedRoles.includes(role);
}

/** Admin only. */
export function isAdmin(): boolean {
  return getUserRole() === "admin";
}

/** Admin or staff. */
export function isStaff(): boolean {
  const role = getUserRole();
  return role === "admin" || role === "staff";
}

/** Any authenticated user (any role). */
export function isUser(): boolean {
  return isAuthenticated();
}