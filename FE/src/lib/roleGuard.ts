// ============================================================
// Role Guard Helpers — pure logic, no React, no UI
// ============================================================
// USAGE: replace FE/src/lib/roleGuard.ts with this file
// ============================================================

import { getUserRole, isAuthenticated } from "./authUtils";
import type { UserRole } from "../types/auth.types";

/**
 * Admin-only routes.
 * Allowed roles: admin
 */
export function canAccessAdminRoute(): boolean {
  return isAuthenticated() && getUserRole() === "admin";
}

/**
 * Staff-level routes.
 * Allowed roles: admin, staff
 */
export function canAccessStaffRoute(): boolean {
  if (!isAuthenticated()) return false;
  const role = getUserRole();
  return role === "admin" || role === "staff";
}

/**
 * Regular user routes — any authenticated user.
 * Allowed roles: admin, staff, user
 */
export function canAccessUserRoute(): boolean {
  return isAuthenticated();
}

/**
 * Generic check — pass any combination of roles.
 *
 * @example
 *   canAccessRoute(["admin", "staff"]) // same as canAccessStaffRoute()
 */
export function canAccessRoute(allowedRoles: UserRole[]): boolean {
  if (!isAuthenticated()) return false;
  const role = getUserRole();
  if (!role) return false;
  return allowedRoles.includes(role);
}

/**
 * Returns the default dashboard path for a given role after login.
 */
export function getDefaultRouteForRole(role: UserRole | null): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "staff":
      return "/staff";
    case "user":
    default:
      return "/shop";
  }
}

/**
 * Redirect path when an unauthenticated user hits a protected route.
 */
export function getUnauthorizedRedirect(): string {
  return "/";
}