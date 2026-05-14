// ============================================================
// Role Guard Helper Functions — pure logic, no React, no UI
// ============================================================
//
// Usage in route components:
//   if (!canAccessAdminRoute()) redirect("/")
//   if (!canAccessStaffRoute()) redirect("/")
//   if (!canAccessUserRoute()) redirect("/login")
//
// ============================================================

import { getUserRole, isAuthenticated } from "./authUtils";
import type { UserRole } from "../types/auth.types";

/**
 * Check if current user can access admin-only routes.
 * Allowed: admin
 */
export function canAccessAdminRoute(): boolean {
  if (!isAuthenticated()) return false;
  return getUserRole() === "admin";
}

/**
 * Check if current user can access staff routes.
 * Allowed: admin, staff
 */
export function canAccessStaffRoute(): boolean {
  if (!isAuthenticated()) return false;
  const role = getUserRole();
  return role === "admin" || role === "staff";
}

/**
 * Check if current user can access regular user routes.
 * Allowed: any authenticated user (admin, staff, user)
 */
export function canAccessUserRoute(): boolean {
  return isAuthenticated();
}

/**
 * Generic role check — pass any combination of allowed roles.
 * Returns true if the current user's role is in the allowed list.
 *
 * Example:
 *   canAccessRoute(["admin", "staff"]) // same as canAccessStaffRoute()
 */
export function canAccessRoute(allowedRoles: UserRole[]): boolean {
  if (!isAuthenticated()) return false;
  const role = getUserRole();
  if (!role) return false;
  return allowedRoles.includes(role);
}

/**
 * Determine the default redirect path for a given role after login.
 * Returns the path the user should be sent to.
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
 * Get the redirect path for an unauthenticated user
 * trying to access a protected route.
 */
export function getUnauthorizedRedirect(): string {
  return "/";
}