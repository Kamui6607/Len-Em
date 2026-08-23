import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "../../store/auth.store";
import { LoadingFallback } from "../LoadingFallback";

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

  console.log("RequireAuth - Route:", location.pathname, "isAuthenticated:", isAuthenticated, "isLoading:", isLoading);

  if (isLoading) {
    return <LoadingFallback fullPage />;
  }

  if (!isAuthenticated) {
    console.warn("RequireAuth - Redirecting to login from:", location.pathname);
    // Save the attempted URL so we can redirect back after login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
