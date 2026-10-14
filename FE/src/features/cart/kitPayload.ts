import type { Kit } from "../../shared/api/kitService";
import type { AddKitToCartPayload } from "../../shared/contexts/CartContext";

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
