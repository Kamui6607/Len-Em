import type { Kit } from "../../shared/api/kitService";
import type { AddKitToCartPayload } from "../../shared/contexts/CartContext";

/**
 * Combo "thiếu sản phẩm" → không được thêm vào giỏ:
 *   · combo chưa có món nào
 *   · món bị xoá (productId null) hoặc đã ngừng bán (isActive = false)
 * productId chưa populate (string id, từ GET /kits) thì chưa biết → không tính là thiếu;
 * nơi thêm giỏ sẽ lấy chi tiết combo rồi kiểm tra lại.
 */
export function isKitIncomplete(kit: Kit): boolean {
  const items = kit.products || [];
  if (!items.length) return true;
  return items.some(({ productId: product }) =>
    !product || (typeof product === "object" && product.isActive === false),
  );
}

/**
 * Kit (GET /kits/:id, products populated) → payload thêm combo vào giỏ.
 * Ảnh / giá lấy theo ĐÚNG biến thể của kit (không phải variants[0]).
 */
export function kitToCartPayload(kit: Kit): AddKitToCartPayload {
  return {
    kitId: kit._id,
    name: kit.name,
    thumbnail: kit.thumbnail,
    price: kit.price,
    products: (kit.products || []).map(({ productId: product, variantId }) => {
      const variant = product?.variants?.find((v) => v._id === variantId) ?? product?.variants?.[0];
      return {
        productId: product?._id ?? "",
        variantId,
        name: product?.name ?? "",
        image: variant?.image || product?.image || "",
        price: variant?.price || 0,
      };
    }),
  };
}
