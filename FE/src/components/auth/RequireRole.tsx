import { Navigate } from "react-router";
import { useAuthStore } from "../../store/auth.store";
import { LoadingFallback } from "../../app/components/LoadingFallback";
import type { UserRole } from "../../types/auth.types";

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

/**
 * Component that restricts access based on user role.
 * - Shows loading spinner while auth is initializing
 * - Redirects to /auth/login if not authenticated
 * - Shows 403-like redirect to home if role doesn't match
 * - Renders children if user has an allowed role
 */
export function RequireRole({ children, allowedRoles }: RequireRoleProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingFallback fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.roleId)) {
    // Redirect to home with a message (handled by protected routes)
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}