import { useEffect } from "react";
import { BrowserRouter } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "../shared/components/ui/sonner";
import { queryClient } from "../lib/queryClient";
import { useAuthStore } from "../shared/store/auth.store";
import { useMembershipStore } from "../features/membership/store/membership.store";
import { FavoritesProvider } from "../shared/contexts/FavoritesContext";
import { AdminProvider } from "../shared/contexts/AdminContext";
import { ThemeProvider } from "../shared/contexts/ThemeContext";
import { ReportProvider } from "../shared/contexts/ReportContext";
import { NotificationProvider } from "../shared/contexts/NotificationContext";
import { ReviewProvider } from "../shared/contexts/ReviewContext";
import { CartProvider } from "../shared/contexts/CartContext";
import { LanguageProvider } from "../shared/contexts/LanguageContext";
import { NotificationInit } from "../shared/components/NotificationInit";
import { AppRouter } from "../routes/AppRouter";
import { CartToastHost } from "../features/cart/CartToastHost";
import { OrderToastHost } from "../features/orders/components/OrderToastHost";
import { RankUpHost } from "../shared/components/membership/RankUpHost";
import { useIsMobile } from "../shared/hooks/useMediaQuery";

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const initializeMembership = useMembershipStore((s) => s.initialize);
  const resetMembership = useMembershipStore((s) => s.reset);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.userId);
  // The devtools' floating logo sits bottom-right on top of the tab bar.
  const isMobile = useIsMobile();

  // Run initialize once on mount only - do NOT re-run on re-render
  // (login() already handles the full auth flow, no need to re-initialize)
  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Membership follows the signed-in user: load on login / account switch,
  // wipe on logout so the next user never sees the previous one's data.
  useEffect(() => {
    resetMembership();
    if (isAuthenticated && userId) {
      initializeMembership();
    }
  }, [isAuthenticated, userId, initializeMembership, resetMembership]);

  // Google OAuth Client ID from FE/.env (on Vercel: set it as a project env var).
  // Only mount GoogleOAuthProvider when a Client ID is actually configured.
  // Mounting it with an empty clientId makes @react-oauth/google's GoogleLogin
  // call google.accounts.id.initialize({ client_id: "" }), which the route
  // ErrorBoundary catches and turns into a blank "We couldn't load this page"
  // screen on deployments where the env var is missing (e.g. Vercel without it set).
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";
  const isGoogleConfigured = Boolean(GOOGLE_CLIENT_ID);

  const app = (
    <QueryClientProvider client={queryClient}>
      {import.meta.env.DEV && !isMobile && <ReactQueryDevtools initialIsOpen={false} />}
      <LanguageProvider>
        <ThemeProvider>
          <AdminProvider>
            <ReportProvider>
              <NotificationProvider>
                <ReviewProvider>
                  <FavoritesProvider>
                    <CartProvider>
                      <Toaster />
                      <BrowserRouter>
                        {/* Inside the router so notification toasts can navigate */}
                        <NotificationInit />
                        <AppRouter />
                        <CartToastHost placement="anchor" />
                        <OrderToastHost />
                        <RankUpHost />
                      </BrowserRouter>
                    </CartProvider>
                  </FavoritesProvider>
                </ReviewProvider>
              </NotificationProvider>
            </ReportProvider>
          </AdminProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );

  return isGoogleConfigured ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{app}</GoogleOAuthProvider>
  ) : (
    app
  );
}
