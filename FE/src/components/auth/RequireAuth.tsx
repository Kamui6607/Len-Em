import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "../../store/auth.store";
import { LoadingFallback } from "../../app/components/LoadingFallback";

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * Component that protects routes behind authentication.
 * - Shows loading spinner while auth is initializing
 * - Redirects to /auth/login if not authenticated
 * - Renders children if authenticated
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingFallback fullPage />;
  }

  if (!isAuthenticated) {
    // Save the attempted URL so we can redirect back after login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}