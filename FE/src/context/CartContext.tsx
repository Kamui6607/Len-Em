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

export interface CartKitItem {
  kitId: string;
  name: string;
  thumbnail: string;
  price: number;
  productCount: number;
  products: {
    productId: string;
    variantId: string;
    name: string;
    image: string;
    price: number;
  }[];
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

interface AddKitToCartPayload {
  kitId: string;
  name: string;
  thumbnail: string;
  price: number;
  products: {
    productId: string;
    variantId: string;
    name: string;
    image: string;
    price: number;
  }[];
}

interface CartContextType {
  cartItems: CartItem[];
  cartKits: CartKitItem[];
  addToCart: (product: AddToCartPayload, quantity?: number) => void;
  addKitToCart: (kit: AddKitToCartPayload) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  removeKitFromCart: (kitId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string, variantId: string) => boolean;
  isKitInCart: (kitId: string) => boolean;
  totalItems: number;
  totalPrice: number;
}

const CART_STORAGE_KEY = "yarn_shop_cart";
const CART_KITS_STORAGE_KEY = "yarn_shop_cart_kits";

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function loadCartKits(): CartKitItem[] {
  try {
    const saved = localStorage.getItem(CART_KITS_STORAGE_KEY);
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
  const [cartKits, setCartKits] = useState<CartKitItem[]>(loadCartKits);

  // Sync to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem(CART_KITS_STORAGE_KEY, JSON.stringify(cartKits));
  }, [cartKits]);

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
    // Clear both React state AND localStorage synchronously
    // so that even if window.location.href navigates away immediately,
    // the cart data is already removed from localStorage.
    setCartItems([]);
    setCartKits([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_KITS_STORAGE_KEY);
  }, []);

  const isInCart = useCallback(
    (productId: string, variantId: string): boolean => {
      const key = makeKey(productId, variantId);
      return cartItems.some((item) => makeKey(item.productId, item.variantId) === key);
    },
    [cartItems]
  );

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0) + cartKits.length,
    [cartItems, cartKits]
  );

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) + cartKits.reduce((sum, kit) => sum + kit.price, 0),
    [cartItems, cartKits]
  );

  const addKitToCart = useCallback((kit: AddKitToCartPayload) => {
    setCartKits((prev) => {
      const existing = prev.find((item) => item.kitId === kit.kitId);
      if (existing) {
        return prev.map((item) =>
          item.kitId === kit.kitId ? { ...kit, productCount: kit.products.length } : item
        );
      }
      return [...prev, { ...kit, productCount: kit.products.length }];
    });
  }, []);

  const removeKitFromCart = useCallback((kitId: string) => {
    setCartKits((prev) => prev.filter((item) => item.kitId !== kitId));
  }, []);

  const isKitInCart = useCallback(
    (kitId: string): boolean => {
      return cartKits.some((item) => item.kitId === kitId);
    },
    [cartKits]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartKits,
        addToCart,
        addKitToCart,
        removeFromCart,
        removeKitFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        isKitInCart,
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