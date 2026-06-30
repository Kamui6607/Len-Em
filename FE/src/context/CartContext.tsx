// ============================================================
// CartContext — manages cart state in localStorage
// ============================================================
// Cart is stored entirely client-side. No cart API exists.
// Prices/stocks shown are from the variant selected at add-to-cart time.
// The backend recalculates prices when the order is created.
//
// UNIQUE KEY: productId + variantId (not color alone, because
// two variants can share the same color but differ in size).
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";

export interface CartItem {
  productId: string;
  variantId: string;       // _idVariants from backend
  name: string;
  image: string;           // variant image (fallback to product image)
  color: string;
  hexCode: string;
  size?: string;
  price: number;
  quantity: number;
  stock: number;
}

interface AddToCartPayload {
  productId: string;
  variantId: string;
  name: string;
  image: string;
  color: string;
  hexCode: string;
  size?: string;
  price: number;
  stock: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: AddToCartPayload, quantity?: number) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string, variantId: string) => boolean;
  totalItems: number;
  totalPrice: number;
}

const CART_STORAGE_KEY = "yarn_shop_cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function makeKey(productId: string, variantId: string): string {
  return `${productId}::${variantId}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(loadCart);

  // Sync to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback(
    (product: AddToCartPayload, quantity: number = 1) => {
      setCartItems((prev) => {
        const key = makeKey(product.productId, product.variantId);
        const existing = prev.find(
          (item) => makeKey(item.productId, item.variantId) === key
        );
        if (existing) {
          // Cộng dồn số lượng, không vượt quá stock
          const newQty = Math.min(existing.quantity + quantity, product.stock);
          return prev.map((item) =>
            makeKey(item.productId, item.variantId) === key
              ? { ...item, quantity: newQty, price: product.price, stock: product.stock }
              : item
          );
        }
        return [
          ...prev,
          {
            productId: product.productId,
            variantId: product.variantId,
            name: product.name,
            image: product.image,
            color: product.color,
            hexCode: product.hexCode,
            size: product.size,
            price: product.price,
            quantity: Math.min(quantity, product.stock),
            stock: product.stock,
          },
        ];
      });
    },
    []
  );

  const removeFromCart = useCallback((productId: string, variantId: string) => {
    const key = makeKey(productId, variantId);
    setCartItems((prev) =>
      prev.filter((item) => makeKey(item.productId, item.variantId) !== key)
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, variantId: string, quantity: number) => {
      const key = makeKey(productId, variantId);
      setCartItems((prev) =>
        prev.map((item) =>
          makeKey(item.productId, item.variantId) === key
            ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
            : item
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const isInCart = useCallback(
    (productId: string, variantId: string): boolean => {
      const key = makeKey(productId, variantId);
      return cartItems.some((item) => makeKey(item.productId, item.variantId) === key);
    },
    [cartItems]
  );

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}