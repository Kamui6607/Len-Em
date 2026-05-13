import { useState } from "react";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { AdminProvider } from "./context/AdminContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthPanel } from "./components/AuthPanel";
import { AppRouter } from "../routes/AppRouter";

export interface CartItem {
  productId: string;
  quantity: number;
}

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [authPanelOpen, setAuthPanelOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

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

  const handleOpenSignIn = () => {
    setAuthMode("signin");
    setAuthPanelOpen(true);
  };

  const handleOpenSignUp = () => {
    setAuthMode("signup");
    setAuthPanelOpen(true);
  };

  const handleCloseAuth = () => {
    setAuthPanelOpen(false);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
          <FavoritesProvider>
            <Toaster position="top-right" richColors />
            <BrowserRouter>
              <AppRouter
                cartItems={cartItems}
                authPanelOpen={authPanelOpen}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                cartCount={cartCount}
                onOpenSignIn={handleOpenSignIn}
                onOpenSignUp={handleOpenSignUp}
              />
              <AuthPanel
                isOpen={authPanelOpen}
                onClose={handleCloseAuth}
                initialMode={authMode}
              />
            </BrowserRouter>
          </FavoritesProvider>
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}