import { useEffect } from "react";
import { BrowserRouter } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
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

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const initializeMembership = useMembershipStore((s) => s.initialize);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Run initialize once on mount only - do NOT re-run on re-render
  // (login() already handles the full auth flow, no need to re-initialize)
  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize membership when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initializeMembership();
    }
  }, [isAuthenticated, initializeMembership]);

  return (
    <QueryClientProvider client={queryClient}>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    <LanguageProvider>
      <ThemeProvider>
        <AdminProvider>
          <ReportProvider>
            <NotificationProvider>
              <NotificationInit />
              <ReviewProvider>
                <FavoritesProvider>
                  <CartProvider>
                    <Toaster
                      position="top-right"
                      richColors
                      visibleToasts={5}
                      gap={8}
                      offset={{ right: 16, top: 16 }}
                    />
                    <BrowserRouter>
                      <AppRouter />
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
}
