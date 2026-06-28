import { useState, useEffect } from "react";
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
import { AppRouter } from "../routes/AppRouter";

export interface CartItem {
  productId: string;
  quantity: number;
  metadata?: {
    source?: "learn";
    lessonId?: string;
    courseId?: string;
  };
}

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
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

  const handleAddToCart = (productId: string, metadata?: CartItem["metadata"]) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.productId === productId &&
          item.metadata?.lessonId === metadata?.lessonId &&
          item.metadata?.courseId === metadata?.courseId,
      );
      if (existing) {
        return prev.map((item) =>
          item.productId === productId &&
          item.metadata?.lessonId === metadata?.lessonId &&
          item.metadata?.courseId === metadata?.courseId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId, quantity: 1, metadata }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ThemeProvider>
      <AdminProvider>
        <ReportProvider>
          <NotificationProvider>
            <ReviewProvider>
              <FavoritesProvider>
                <Toaster
                  position="top-right"
                  richColors
                  visibleToasts={5}
                  gap={8}
                  offset={{ right: 16, top: 16 }}
                />
                <BrowserRouter>
                  <AppRouter
                    cartItems={cartItems}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onClearCart={handleClearCart}
                    cartCount={cartCount}
                  />
                </BrowserRouter>
              </FavoritesProvider>
            </ReviewProvider>
          </NotificationProvider>
        </ReportProvider>
      </AdminProvider>
    </ThemeProvider>
  );
}
