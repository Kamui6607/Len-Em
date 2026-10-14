// ============================================================
// Cart toast store — the "added to cart" feedback system.
// Kept separate from the app-wide Sonner toaster because these toasts are
// anchored to the cart icon, carry product details + actions, and stack /
// merge on their own rules.
// ============================================================

import { create } from "zustand";

export type CartToastVariant = "success" | "warning" | "error" | "info";

export interface CartToastItem {
  name: string;
  image?: string;
  /** Selected color / variant label (or "5 món" for a kit). */
  variantLabel?: string;
  hexCode?: string;
  quantity: number;
  /** Line total for this add (unit price × quantity). */
  price: number;
}

export interface CartToast {
  id: number;
  variant: CartToastVariant;
  /** Short status line, e.g. "Đã thêm vào giỏ hàng". */
  title: string;
  /** Optional detail, e.g. "Chỉ còn 2 sản phẩm trong kho". */
  message?: string;
  items: CartToastItem[];
  /** "added" toasts get cart actions and are merged when they pile up. */
  added: boolean;
  undo?: () => void;
  duration: number;
}

/** Visible at once; a 4th "added" toast merges the added ones into a summary. */
export const MAX_CART_TOASTS = 3;
export const CART_TOAST_DURATION = 4000;

let nextId = 1;

interface CartToastState {
  toasts: CartToast[];
  /** Incremented on every "added" toast — the cart badge bounces on change. */
  bump: number;
  push: (toast: Omit<CartToast, "id" | "duration"> & { duration?: number }) => void;
  dismiss: (id: number) => void;
  dismissNewest: () => void;
}

export const useCartToastStore = create<CartToastState>((set, get) => ({
  toasts: [],
  bump: 0,

  push: (input) => {
    const toast: CartToast = {
      ...input,
      duration: input.duration ?? (input.variant === "error" ? 6000 : CART_TOAST_DURATION),
      id: nextId++,
    };

    set((state) => {
      let toasts = state.toasts;
      const addedOnes = toasts.filter((t) => t.added);

      if (toast.added && addedOnes.length >= MAX_CART_TOASTS) {
        // Rapid adds: fold every visible "added" toast + the new one into one summary.
        const all = [toast, ...addedOnes];
        const items = all.flatMap((t) => t.items);
        const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
        const undos = all.map((t) => t.undo).filter(Boolean) as (() => void)[];
        const merged: CartToast = {
          id: nextId++,
          variant: "success",
          title: `Đã thêm ${totalQty} sản phẩm vào giỏ hàng`,
          items,
          added: true,
          undo: undos.length ? () => undos.forEach((undo) => undo()) : undefined,
          duration: CART_TOAST_DURATION,
        };
        toasts = [merged, ...toasts.filter((t) => !t.added)];
      } else {
        toasts = [toast, ...toasts];
      }

      return {
        toasts: toasts.slice(0, MAX_CART_TOASTS),
        bump: toast.added ? state.bump + 1 : state.bump,
      };
    });
  },

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  dismissNewest: () => {
    const newest = get().toasts[0];
    if (newest) get().dismiss(newest.id);
  },
}));

/** Imperative helpers for non-"added" notices. */
export const cartToast = {
  error: (title: string, message?: string, item?: CartToastItem) =>
    useCartToastStore.getState().push({ variant: "error", title, message, items: item ? [item] : [], added: false }),
  warning: (title: string, message?: string, item?: CartToastItem) =>
    useCartToastStore.getState().push({ variant: "warning", title, message, items: item ? [item] : [], added: false }),
  info: (title: string, message?: string) =>
    useCartToastStore.getState().push({ variant: "info", title, message, items: [], added: false, duration: 2500 }),
};
