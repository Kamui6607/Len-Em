// ============================================================
// Nguyên liệu của một bài DIY (chỉ để hiển thị trên /diy/:id) + payload
// "thêm DIY vào giỏ" (chính bài DIY, không phải nguyên liệu).
//  - linkedProduct mang { productId, variantId, quantity }: dùng đúng biến
//    thể creator chọn; hết hàng / bị xoá → màu còn hàng đầu tiên (substituted).
// ============================================================

import { toId } from "../../lib/displayText";
import { kitService, type Kit } from "../../shared/api/kitService";
import { fetchProductById } from "../shop/services/product.service";
import { firstAvailableVariant } from "../cart/VariantPickerDialog";
import type { ProductVariantUI } from "../../shared/components/ProductVariantSelector";
import type { AddDIYToCartPayload } from "../../shared/contexts/CartContext";
import type { Product } from "../../app/data/products";
import type { DIYPost } from "./types/diy.types";

export interface MaterialProduct {
  key: string;
  productId: string;
  product: Product | null;
  variant: ProductVariantUI | null;
  /** Số lượng trong một bộ (theo creator). */
  quantity: number;
  /** Bị xoá / ẩn / hết sạch hàng. */
  unavailable: boolean;
  /** Màu creator chọn đã hết → đang dùng màu khác. */
  substituted: boolean;
}

export interface MaterialKit {
  key: string;
  kitId: string;
  kit: Kit | null;
  unavailable: boolean;
}

export async function loadMaterial(item: DIYPost["linkedProduct"][number], index: number): Promise<MaterialProduct> {
  const productId = toId(item.productId);
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const base = { key: `p-${productId}-${index}`, productId, quantity };
  try {
    const product = await fetchProductById(productId);
    if (!product || product.isActive === false) {
      return { ...base, product, variant: null, unavailable: true, substituted: false };
    }
    const wantedId = toId(item.variantId);
    const chosen = product.variants?.find((v) => v.id === wantedId);
    // Còn hàng: đúng màu creator chọn, không thì màu còn hàng đầu tiên.
    const inStock = chosen && chosen.stock > 0 ? chosen : product.variants?.find((v) => v.stock > 0);
    return {
      ...base,
      product,
      // Hết sạch → vẫn hiện màu creator dùng để khách biết là màu nào.
      variant: inStock ?? chosen ?? firstAvailableVariant(product.variants) ?? null,
      unavailable: !inStock,
      substituted: Boolean(wantedId && inStock && inStock.id !== wantedId),
    };
  } catch {
    return { ...base, product: null, variant: null, unavailable: true, substituted: false };
  }
}

export async function loadKit(item: DIYPost["linkedCombo"][number], index: number): Promise<MaterialKit> {
  const kitId = toId(item.comboId);
  try {
    const { data } = await kitService.getById(kitId);
    const kit = data.data?.kit ?? null;
    return { key: `k-${kitId}-${index}`, kitId, kit, unavailable: !kit || kit.isActive === false };
  } catch {
    return { key: `k-${kitId}-${index}`, kitId, kit: null, unavailable: true };
  }
}

export async function loadDIYMaterials(post: DIYPost) {
  const [products, kits] = await Promise.all([
    Promise.all((post.linkedProduct ?? []).map(loadMaterial)),
    Promise.all((post.linkedCombo ?? []).map(loadKit)),
  ]);
  return { products, kits };
}

export const isBuyable = (m: MaterialProduct) => !m.unavailable && !!m.product && !!m.variant && m.variant.stock > 0;

/**
 * Bài DIY → dòng trong giỏ: lấy thông tin CỦA BÀI DIY (title, description,
 * images, price) — không lấy nguyên liệu linkedProduct / linkedCombo.
 */
export function toDIYCartPayload(post: DIYPost): AddDIYToCartPayload {
  const images = (post.images ?? []).filter(Boolean);
  return {
    diyId: post._id,
    title: post.title,
    description: post.description ?? "",
    image: images[0] ?? "",
    images,
    price: Math.max(0, Number(post.price) || 0),
  };
}
