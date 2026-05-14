// ============================================================
// Auth Utility Functions — pure helpers, no React, no UI
// ============================================================

import { jwtDecode } from "jwt-decode";
import { tokenStorage } from "./axiosClient";
import type { DecodedToken, UserRole } from "../types/auth.types";

const STORAGE_USER_KEY = "cozyStitch_user";

// ---- Token helpers ----

/**
 * Check if the user has a valid (non-expired) access token.
 */
export function isAuthenticated(): boolean {
  const token = tokenStorage.getAccess();
  if (!token) return false;
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/**
 * Get the current access token from storage.
 */
export function getAccessToken(): string | null {
  return tokenStorage.getAccess();
}

/**
 * Decode the JWT access token and return its payload.
 * Returns `null` if token is missing or malformed.
 */
export function getDecodedToken(): DecodedToken | null {
  const token = tokenStorage.getAccess();
  if (!token) return null;
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

/**
 * Get the user's role from the decoded JWT.
 */
export function getUserRole(): UserRole | null {
  const decoded = getDecodedToken();
  return decoded?.role ?? null;
}

/**
 * Check whether the access token is expired (server-time independent).
 * Relies on the `exp` claim embedded in the JWT.
 */
export function isTokenExpired(): boolean {
  const decoded = getDecodedToken();
  if (!decoded) return true;
  return decoded.exp * 1000 <= Date.now();
}

/**
 * Fully log out: clear token storage, remove cached user, redirect.
 */
export function logout(): void {
  tokenStorage.clear();
  localStorage.removeItem(STORAGE_USER_KEY);
}

// ---- Role-based helpers ----

/**
 * Check if the decoded token's role satisfies at least one of the
 * required roles.
 */
export function canAccess(requiredRoles: UserRole[]): boolean {
  const role = getUserRole();
  if (!role) return false;
  return requiredRoles.includes(role);
}

/**
 * Returns `true` if the current user has the "admin" role.
 */
export function isAdmin(): boolean {
  return getUserRole() === "admin";
}

/**
 * Returns `true` if the current user has "admin" or "staff" role.
 */
export function isStaff(): boolean {
  const role = getUserRole();
  return role === "admin" || role === "staff";
}

/**
 * Returns `true` if the user is authenticated (any role).
 */
export function isUser(): boolean {
  return isAuthenticated();
}