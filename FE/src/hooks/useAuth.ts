// ============================================================
// useAuth hook — thin bridge between Zustand store and
// the rest of the app (AuthContext consumers).
// ============================================================
// USAGE: add to FE/src/hooks/useAuth.ts
//
// Components that currently call useAuth() from AuthContext will
// continue to work if you swap the import to this hook.
// ============================================================

import { useCallback } from "react";
import { useAuthStore } from "../store/auth.store";
import { getUserRole } from "../lib/authUtils";
import type { UserRole } from "../types/auth.types";

export function useAuth() {
  const store = useAuthStore();

  /**
   * Sign in with email-or-phone / password.
   * Mirrors the AuthContext.signIn(emailOrPhone, password) signature.
   */
  const signIn = useCallback(
    async (emailOrPhone: string, password: string): Promise<boolean> => {
      try {
        const isEmail = emailOrPhone.includes("@");
        await store.login(
          isEmail
            ? { email: emailOrPhone, password }
            : { username: emailOrPhone, password },
        );
        return true;
      } catch {
        return false;
      }
    },
    [store],
  );

  const signOut = useCallback(() => store.logout(), [store]);

  /**
   * Returns true if the user holds at least one of the supplied roles.
   */
  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      const current = getUserRole();
      if (!current) return false;
      return Array.isArray(role) ? role.includes(current) : current === role;
    },
    [],
  );

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    signIn,
    signOut,
    hasRole,
    // expose raw store actions too
    login: store.login,
    logout: store.logout,
    initialize: store.initialize,
  };
}