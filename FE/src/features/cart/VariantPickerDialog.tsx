// ============================================================
// VariantPickerDialog — chọn nhanh màu / phân loại (+ số lượng) mà không
// phải vào trang chi tiết sản phẩm.
//   · mode "add":    từ thẻ sản phẩm (/shop, /love…) → thêm vào giỏ
//   · mode "change": từ /cart → đổi dòng hàng sang biến thể khác
// Dữ liệu biến thể luôn lấy mới (giá / tồn kho trong giỏ có thể đã cũ).
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../shared/components/ui/dialog";
import {
  ProductVariantSelector,
  getVariantLabel,
  isDefaultVariant,
  type ProductVariantUI,
} from "../../shared/components/ProductVariantSelector";
import { formatPrice } from "../../lib/formatPrice";
import { products as mockProducts, type Product } from "../../app/data/products";
import { fetchProductById } from "../shop/services/product.service";
import type { AddToCartPayload } from "../../shared/contexts/CartContext";
import "../../styles/variant-picker.css";

/** Sản phẩm theo id: dữ liệu mẫu trước, không có thì hỏi API. */
export async function resolveProduct(id: string): Promise<Product | null> {
  const mock = mockProducts.find((p) => p.id === id);
  if (mock) return mock;
  try {
    return await fetchProductById(id);
  } catch {
    return null;
  }
}

/** Có thật sự phải chọn không: ≥ 2 biến thể (1 biến thể "Mặc định" thì không). */
export function needsVariantChoice(product: Pick<Product, "variants">): boolean {
  return (product.variants?.length ?? 0) > 1;
}

/** Biến thể mặc định hợp lý: biến thể còn hàng đầu tiên (không phải variants[0] đã hết). */
export function firstAvailableVariant<T extends { stock: number }>(variants: T[] | undefined): T | undefined {
  return variants?.find((v) => v.stock > 0) ?? variants?.[0];
}

/** Biến thể của sản phẩm → payload thêm / đổi trong giỏ. */
export function toCartPayload(product: Product, variant: ProductVariantUI): AddToCartPayload {
  return {
    productId: product.id,
    variantId: variant.id,
    name: product.name,
    image: variant.images?.[0] || product.image,
    color: variant.color || "",
    hexCode: variant.hexCode || "",
    price: variant.price,
    stock: variant.stock,
  };
}

export interface VariantPickerResult {
  variant: ProductVariantUI;
  quantity: number;
}

interface VariantPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Đã có sẵn (thẻ sản phẩm) — hoặc chỉ có id thì dialog tự tải (giỏ hàng). */
  product?: Product | null;
  productId?: string;
  mode: "add" | "change";
  /** Biến thể chọn sẵn (vd. màu hiện tại trong giỏ, hoặc chấm màu vừa bấm). */
  initialVariantId?: string;
  /** Dòng phụ dưới tên sản phẩm (mặc định theo mode). */
  hint?: string;
  onConfirm: (product: Product, result: VariantPickerResult) => void;
}

export function VariantPickerDialog({
  open,
  onOpenChange,
  product: givenProduct,
  productId,
  mode,
  initialVariantId,
  hint,
  onConfirm,
}: VariantPickerDialogProps) {
  const [loaded, setLoaded] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<ProductVariantUI | null>(null);
  const [quantity, setQuantity] = useState(1);

  const product = givenProduct ?? loaded;

  // Giỏ hàng chỉ có id → tải sản phẩm mỗi lần mở để có tồn kho mới nhất.
  useEffect(() => {
    if (!open || givenProduct || !productId) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    resolveProduct(productId).then((p) => {
      if (cancelled) return;
      setLoaded(p);
      setFailed(!p);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, givenProduct, productId]);

  useEffect(() => {
    if (!open) return;
    setQuantity(1);
    setSelected(null);
  }, [open]);

  const variants = useMemo<ProductVariantUI[]>(() => product?.variants ?? [], [product]);
  const defaultVariantId = useMemo(() => {
    const preferred = variants.find((v) => v.id === initialVariantId && (mode === "change" || v.stock > 0));
    return (preferred ?? firstAvailableVariant(variants))?.id;
  }, [variants, initialVariantId, mode]);

  // ProductVariantSelector gọi lại mỗi khi callback đổi → giữ callback cố định.
  const handleVariantChange = useCallback((variant: ProductVariantUI) => {
    setSelected(variant);
    setQuantity((q) => Math.max(1, Math.min(q, variant.stock || 1)));
  }, []);

  const variant = selected && variants.some((v) => v.id === selected.id) ? selected : null;
  const soldOut = !variant || variant.stock <= 0;
  const unchanged = mode === "change" && variant?.id === initialVariantId;
  const image = variant?.images?.[0] || product?.image;
  const isColor = variants.some((v) => !isDefaultVariant(v));

  const confirm = () => {
    if (!product || !variant || soldOut || unchanged) return;
    onConfirm(product, { variant, quantity });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="vp-dialog glass-panel-solid max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        {!product ? (
          <div className="vp-state" aria-busy={loading}>
            <DialogTitle className="sr-only">Chọn phân loại</DialogTitle>
            <DialogDescription className="sr-only">Đang tải thông tin sản phẩm</DialogDescription>
            {loading || !failed ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Đang tải màu len…
              </>
            ) : (
              "Không tải được sản phẩm. Vui lòng thử lại."
            )}
          </div>
        ) : (
          <div className="grid gap-5">
            <DialogHeader>
              <div className="vp-head">
                <span className="vp-thumb">
                  {image ? <img src={image} alt="" /> : <ShoppingBag className="size-6" />}
                </span>
                <div className="min-w-0 text-left">
                  <DialogTitle className="vp-name">{product.name}</DialogTitle>
                  <DialogDescription className="vp-sub">
                    {hint ??
                      (mode === "change"
                        ? `Đổi ${isColor ? "màu" : "phân loại"} cho sản phẩm trong giỏ`
                        : `Chọn ${isColor ? "màu len" : "phân loại"} bạn muốn`)}
                  </DialogDescription>
                  {variant && (
                    <p className="vp-price">
                      {formatPrice(variant.price)}
                      <span className={`vp-stock${variant.stock <= 0 ? " is-out" : variant.stock <= 5 ? " is-low" : ""}`}>
                        {variant.stock <= 0 ? "Hết hàng" : `Còn ${variant.stock}`}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </DialogHeader>

            <ProductVariantSelector
              key={`${product.id}-${defaultVariantId}`}
              variants={variants}
              defaultVariantId={defaultVariantId}
              onVariantChange={handleVariantChange}
            />

            {mode === "add" && (
              <div className="vp-qty-row">
                <span className="vp-label">Số lượng</span>
                <div className="vp-stepper" role="group" aria-label="Số lượng">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Giảm số lượng"
                  >
                    <Minus size={14} strokeWidth={2.4} />
                  </button>
                  <output aria-live="polite">{quantity}</output>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    disabled={soldOut || quantity >= (variant?.stock ?? 1)}
                    aria-label="Tăng số lượng"
                  >
                    <Plus size={14} strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            )}

            <div className="vp-actions">
              <Link to={`/shop/product/${product.id}`} className="vp-link" onClick={() => onOpenChange(false)}>
                Xem chi tiết
              </Link>
              <button type="button" className="vp-confirm" onClick={confirm} disabled={soldOut || unchanged}>
                {mode === "change" ? (
                  unchanged ? (
                    "Đang chọn màu này"
                  ) : (
                    `Đổi sang ${variant ? getVariantLabel(variant) : ""}`
                  )
                ) : (
                  <>
                    <ShoppingBag className="size-4" />
                    {soldOut ? "Hết hàng" : `Thêm vào giỏ · ${formatPrice((variant?.price ?? 0) * quantity)}`}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
