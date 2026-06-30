import { useEffect } from "react";
import { BrowserRouter } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { useAuthStore } from "../store/auth.store";
import { useMembershipStore } from "../features/membership/store/membership.store";
import { FavoritesProvider } from "./context/FavoritesContext";
import { AdminProvider } from "./context/AdminContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ReportProvider } from "../context/ReportContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ReviewProvider } from "./context/ReviewContext";
import { CartProvider } from "../context/CartContext";
import { AppRouter } from "../routes/AppRouter";

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const initializeMembership = useMembershipStore((s) => s.initialize);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize membership when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initializeMembership();
    }
  }, [isAuthenticated, initializeMembership]);

  return (
    <ThemeProvider>
      <AdminProvider>
        <ReportProvider>
          <NotificationProvider>
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
  );
}
