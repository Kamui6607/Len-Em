// ============================================================
// useAddToCart — add to cart + the right feedback in one call.
//   · checks stock first (the cart silently caps at stock, which used to
//     show "Đã thêm vào giỏ hàng" even when nothing was added)
//   · success / low-stock warning / out-of-stock error toasts
//   · "Hoàn tác" restores the exact previous quantity
// ============================================================

import { useCallback } from "react";
import {
  useCart,
  type AddDIYToCartPayload,
  type AddKitToCartPayload,
  type AddToCartPayload,
} from "../../shared/contexts/CartContext";
import { getValidHex, isDefaultVariant } from "../../shared/components/ProductVariantSelector";
import { cartToast, useCartToastStore, type CartToastItem } from "./cartToastStore";

/** Remaining stock at or below this shows the low-stock warning. */
const LOW_STOCK = 3;

interface AddOptions {
  /** Skip the toast (used by bulk adds, which show one summary instead). */
  silent?: boolean;
}

export interface AddResult {
  added: number;
  item: CartToastItem;
  undo: () => void;
}

export function useAddToCart() {
  const {
    cartItems,
    cartKits,
    cartDIYs,
    addDIYToCart,
    removeDIYFromCart,
    updateDIYQuantity,
    addToCart,
    addKitToCart,
    removeFromCart,
    updateQuantity,
    removeKitFromCart,
    updateKitQuantity,
  } = useCart();
  const push = useCartToastStore((s) => s.push);

  const addProduct = useCallback(
    (product: AddToCartPayload, quantity = 1, { silent = false }: AddOptions = {}): AddResult | null => {
      const stock = Number.isFinite(product.stock) ? product.stock : Infinity;
      const existing = cartItems.find(
        (item) => item.productId === product.productId && item.variantId === product.variantId,
      );
      const had = existing?.quantity ?? 0;
      // Placeholder "Mặc định" variants / invalid hex → no color label or dot
      // (same rule the product cards use for their swatches).
      const realColor = product.color && !isDefaultVariant({ color: product.color });
      const item: CartToastItem = {
        name: product.name,
        image: product.image,
        variantLabel: realColor ? product.color : undefined,
        hexCode: realColor ? getValidHex(product.hexCode) : undefined,
        quantity,
        price: product.price * quantity,
      };

      // Bulk adds (silent) report skipped items in their own summary toast.
      if (stock <= 0) {
        if (!silent) cartToast.error("Sản phẩm đã hết hàng", "Bạn có thể lưu vào yêu thích để mua sau.", item);
        return null;
      }
      const room = stock - had;
      if (room <= 0) {
        if (!silent) cartToast.warning(
          `Giỏ hàng đã có đủ ${stock} sản phẩm còn lại`,
          "Không thể thêm vượt quá số lượng trong kho.",
          { ...item, quantity: had, price: product.price * had },
        );
        return null;
      }

      const added = Math.min(quantity, room);
      addToCart(product, added);

      const undo = () =>
        had > 0
          ? updateQuantity(product.productId, product.variantId, had)
          : removeFromCart(product.productId, product.variantId);
      const addedItem = { ...item, quantity: added, price: product.price * added };

      if (!silent) {
        const remaining = stock - had - added;
        const capped = added < quantity;
        const low = Number.isFinite(remaining) && remaining <= LOW_STOCK;
        push({
          variant: capped || low ? "warning" : "success",
          title: capped ? `Chỉ thêm được ${added} sản phẩm` : "Đã thêm vào giỏ hàng",
          message: capped
            ? "Kho không còn đủ số lượng bạn chọn."
            : low
              ? remaining === 0
                ? "Bạn vừa lấy những sản phẩm cuối cùng trong kho."
                : `Chỉ còn ${remaining} sản phẩm trong kho.`
              : undefined,
          items: [addedItem],
          added: true,
          undo,
        });
      }
      return { added, item: addedItem, undo };
    },
    [cartItems, addToCart, updateQuantity, removeFromCart, push],
  );

  const addKit = useCallback(
    (kit: AddKitToCartPayload, { silent = false }: AddOptions = {}): AddResult | null => {
      // Combo thiếu sản phẩm (chưa có món / món đã bị xoá) → không thêm vào giỏ.
      if (!kit.products.length || kit.products.some((p) => !p.productId)) {
        if (!silent) cartToast.error("Combo đang thiếu sản phẩm", "Combo này tạm thời chưa thể thêm vào giỏ hàng.");
        return null;
      }
      const had = cartKits.find((k) => k.kitId === kit.kitId)?.quantity ?? 0;
      const quantity = kit.quantity || 1;
      addKitToCart(kit);
      const undo = () => (had > 0 ? updateKitQuantity(kit.kitId, had) : removeKitFromCart(kit.kitId));
      const item: CartToastItem = {
        name: kit.name,
        image: kit.thumbnail,
        variantLabel: `Combo · ${kit.products.length} món`,
        quantity,
        price: kit.price * quantity,
      };
      if (!silent) {
        push({ variant: "success", title: "Đã thêm combo vào giỏ hàng", items: [item], added: true, undo });
      }
      return { added: quantity, item, undo };
    },
    [cartKits, addKitToCart, updateKitQuantity, removeKitFromCart, push],
  );

  /** Add several products, then show ONE summary toast with a single undo. */
  const addProducts = useCallback(
    (products: AddToCartPayload[], title?: string) => {
      const results = products
        .map((product) => addProduct(product, 1, { silent: true }))
        .filter(Boolean) as AddResult[];
      if (!results.length) return;
      const total = results.reduce((sum, r) => sum + r.added, 0);
      push({
        variant: "success",
        title: title ?? `Đã thêm ${total} sản phẩm vào giỏ hàng`,
        items: results.map((r) => r.item),
        added: true,
        undo: () => results.forEach((r) => r.undo()),
      });
    },
    [addProduct, push],
  );

  /**
   * Add products (each with its own quantity) and combos together — e.g. every
   * material of a DIY post — then show ONE summary toast with a single undo.
   * Returns how many lines went in and how many were skipped (out of stock).
   */
  const addBundle = useCallback(
    ({
      products = [],
      kits = [],
      title,
    }: {
      products?: { product: AddToCartPayload; quantity: number }[];
      kits?: AddKitToCartPayload[];
      title?: string;
    }) => {
      const results = [
        ...products.map(({ product, quantity }) => addProduct(product, quantity, { silent: true })),
        ...kits.map((kit) => addKit(kit, { silent: true })),
      ];
      const added = results.filter(Boolean) as AddResult[];
      if (added.length) {
        const capped = products.some(({ quantity }, i) => results[i] && (results[i] as AddResult).added < quantity);
        push({
          variant: capped || added.length < results.length ? "warning" : "success",
          title: title ?? `Đã thêm ${added.length} món vào giỏ hàng`,
          message:
            added.length < results.length
              ? `${results.length - added.length} món hết hàng hoặc combo thiếu sản phẩm nên chưa được thêm.`
              : capped
                ? "Một vài món chỉ thêm được theo số lượng còn trong kho."
                : undefined,
          items: added.map((r) => r.item),
          added: true,
          undo: () => added.forEach((r) => r.undo()),
        });
      }
      return { added: added.length, skipped: results.length - added.length };
    },
    [addProduct, addKit, push],
  );

  /** Thêm bài DIY (chính bài DIY: title / ảnh / giá của bài) vào giỏ. */
  const addDIY = useCallback(
    (diy: AddDIYToCartPayload, quantity = 1): AddResult => {
      const had = cartDIYs.find((d) => d.diyId === diy.diyId)?.quantity ?? 0;
      addDIYToCart(diy, quantity);
      const undo = () => (had > 0 ? updateDIYQuantity(diy.diyId, had) : removeDIYFromCart(diy.diyId));
      const item: CartToastItem = {
        name: diy.title,
        image: diy.image,
        variantLabel: "DIY",
        quantity,
        price: diy.price * quantity,
      };
      push({ variant: "success", title: "Đã thêm DIY vào giỏ hàng", items: [item], added: true, undo });
      return { added: quantity, item, undo };
    },
    [cartDIYs, addDIYToCart, updateDIYQuantity, removeDIYFromCart, push],
  );

  return { addProduct, addKit, addProducts, addBundle, addDIY };
}
