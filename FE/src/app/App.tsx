import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";
import { useAuthStore } from "../store/auth.store";
import { FavoritesProvider } from "./context/FavoritesContext";
import { AdminProvider } from "./context/AdminContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppRouter } from "../routes/AppRouter";

export interface CartItem {
  productId: string;
  quantity: number;
}

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleAddToCart = (productId: string) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId, quantity: 1 }];
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
        <FavoritesProvider>
          <Toaster position="top-right" richColors />
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
      </AdminProvider>
    </ThemeProvider>
  );
}
