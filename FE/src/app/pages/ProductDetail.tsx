import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Package,
  Check,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Minus,
  Plus,
  ChevronDown,
} from "lucide-react";
import { motion } from "motion/react";
import { products, getTotalStock } from "../data/products";
import { ProductVariantSelector } from "../../shared/components/ProductVariantSelector";
import { useAuth } from "../../shared/hooks/useAuth";
import { useCart } from "../../shared/contexts/CartContext";
import { useFavorites } from "../../shared/contexts/FavoritesContext";
import { cn } from "../../shared/components/ui/utils";
import { formatPrice } from "../../lib/formatPrice";
import { fetchProductById } from "../../features/shop/services/product.service";
import type { ProductVariantUI } from "../../shared/components/ProductVariantSelector";
import type { Product } from "../data/products";

const difficultyBadgeColors: Record<string, string> = {
  beginner: "bg-[var(--success-bg)] text-[var(--success-text)]",
  intermediate: "bg-[var(--warning-bg)] text-[var(--warning-text)]",
  advanced: "bg-[var(--error-bg)] text-[var(--error-text)]",
};

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              "w-4 h-4",
              i < Math.floor(rating)
                ? "fill-amber-400 text-amber-400"
                : i < rating
                  ? "fill-amber-400/50 text-amber-400"
                  : "fill-muted-foreground/20 text-muted-foreground/30",
            )}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {rating.toFixed(1)} ({count} reviews)
      </span>
    </div>
  );
}

/**
 * Stock status thresholds:
 * >70%  -> success (xanh lá)  "Còn nhiều hàng"
 * 30-70% -> warning (cam)     "Số lượng có hạn"
 * <30%  -> error (đỏ)         "Sắp hết hàng"
 * 0     -> muted (xám)        "Hết hàng"
 */
function getStockStatus(stock: number, percent: number) {
  if (stock === 0) {
    return {
      key: "empty",
      colorVar: "var(--muted-foreground)",
      label: "Hết hàng",
    };
  }
  if (percent > 70) {
    return {
      key: "high",
      colorVar: "var(--success-text)",
      label: "Còn nhiều hàng",
    };
  }
  if (percent >= 30) {
    return {
      key: "mid",
      colorVar: "var(--warning-text)",
      label: "Số lượng có hạn",
    };
  }
  return { key: "low", colorVar: "var(--error-text)", label: "Sắp hết hàng" };
}

/** Thanh tồn kho hình một đoạn dây len — vân xoắn nhẹ, đổi màu theo mức tồn kho. */
function YarnStockMeter({
  stock,
  maxStock,
}: {
  stock: number;
  maxStock: number;
}) {
  const percent =
    maxStock > 0
      ? Math.min(100, Math.max(0, Math.round((stock / maxStock) * 100)))
      : 0;
  const status = getStockStatus(stock, percent);

  return (
    <div className="flex items-center gap-3">
      <div
        className="relative h-3 w-full max-w-[200px] overflow-hidden rounded-full"
        style={{ background: "var(--muted)" }}
      >
        {/* nền dây - vân xoắn mờ */}
        <svg
          className="absolute inset-0 h-full w-full"
          style={{ opacity: 0.35 }}
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="yarn-twist-track"
              width="7"
              height="7"
              patternTransform="rotate(35)"
              patternUnits="userSpaceOnUse"
            >
              <rect width="3.5" height="7" className="fill-foreground/25" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#yarn-twist-track)" />
        </svg>

        {/* phần dây đã "xe" theo % tồn kho */}
        <div
          className="relative h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%`, backgroundColor: status.colorVar }}
        >
          <svg
            className="absolute inset-0 h-full w-full"
            style={{ opacity: 0.3 }}
            preserveAspectRatio="none"
          >
            <defs>
              <pattern
                id={`yarn-twist-${status.key}`}
                width="6"
                height="6"
                patternTransform="rotate(35)"
                patternUnits="userSpaceOnUse"
              >
                <rect width="3" height="6" fill="white" />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill={`url(#yarn-twist-${status.key})`}
            />
          </svg>
          {/* đầu dây - đánh dấu mốc hiện tại */}
          {percent > 0 && (
            <span
              className="absolute -right-0.5 top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-background"
              style={{ backgroundColor: status.colorVar }}
            />
          )}
        </div>
      </div>
      <span
        className="whitespace-nowrap text-xs font-medium"
        style={{ color: status.colorVar }}
      >
        {status.label}
      </span>
    </div>
  );
}

/** Card thông số dạng accordion — gọn hơn trên mobile, người dùng có thể thu lại. */
function CollapsibleSpecCard({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 text-left"
        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      >
        <h3 className="text-sm font-semibold">{title}</h3>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="px-5 pb-5 -mt-1 space-y-3">{children}</div>}
    </div>
  );
}

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, cartItems } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantUI | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);

  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const mobileCarouselRef = useRef<HTMLDivElement>(null);

  const currentCartItem = useMemo(() => {
    if (!selectedVariant) return null;
    return cartItems.find(
      (item) =>
        item.productId === product?.id && item.variantId === selectedVariant.id,
    );
  }, [cartItems, product?.id, selectedVariant]);

  const maxAvailableQuantity = useMemo(() => {
    if (!selectedVariant) return 0;
    const inCart = currentCartItem?.quantity || 0;
    return Math.max(0, selectedVariant.stock - inCart);
  }, [selectedVariant, currentCartItem]);

  useEffect(() => {
    if (!id) return;
    const mockProduct = products.find((p) => p.id === id);
    if (mockProduct) {
      setProduct(mockProduct);
      setLoading(false);
      return;
    }
    fetchProductById(id)
      .then((apiProduct) => {
        if (apiProduct) {
          setProduct(apiProduct);
        } else {
          setProduct(null);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;
      setScrolledToBottom(scrollHeight - scrollTop - clientHeight < 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const variantItems: ProductVariantUI[] = useMemo(() => {
    return (
      product?.variants?.map((v) => ({
        id: v.id,
        color: v.color,
        hexCode: v.hexCode,
        stock: v.stock,
        price: v.price,
        images: v.images,
      })) ?? []
    );
  }, [product]);

  const galleryImages = useMemo(() => {
    if (selectedVariant?.images?.length) return selectedVariant.images;
    return product?.image ? [product.image] : [];
  }, [selectedVariant, product]);

  const currentImage = galleryImages[activeImageIndex] ?? galleryImages[0] ?? "";
  const currentPrice = selectedVariant?.price ?? variantItems[0]?.price ?? 0;
  const currentStock = selectedVariant?.stock ?? 0;
  const currentColor = selectedVariant?.color;
  const totalStock = product ? getTotalStock(product as Product) : 0;

  // Mốc "đầy dây" để so tỉ lệ: lấy biến thể có tồn kho cao nhất làm chuẩn
  const maxVariantStock = useMemo(() => {
    if (variantItems.length === 0) return currentStock || 1;
    return Math.max(...variantItems.map((v) => v.stock), 1);
  }, [variantItems, currentStock]);

  const handleVariantChange = useCallback((variant: ProductVariantUI) => {
    setSelectedVariant(variant);
    setActiveImageIndex(0);
    if (mobileCarouselRef.current) {
      mobileCarouselRef.current.scrollTo({ left: 0, behavior: "auto" });
    }
  }, []);

  const handleMobileCarouselScroll = useCallback(() => {
    const el = mobileCarouselRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveImageIndex(idx);
  }, []);

  const scrollMobileTo = useCallback((idx: number) => {
    const el = mobileCarouselRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
    setActiveImageIndex(idx);
  }, []);

  const handleAddToCart = () => {
    if (!product) return;
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    const variant = selectedVariant || product.variants?.[0];
    if (variant) {
      addToCart(
        {
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          image: variant.images?.[0] || product.image,
          color: variant.color || "",
          hexCode: variant.hexCode || "#ccc",
          price: variant.price,
          stock: variant.stock,
        },
        quantity,
      );
    } else {
      addToCart(
        {
          productId: product.id,
          variantId: "default",
          name: product.name,
          image: product.image,
          color: "",
          hexCode: "#ccc",
          price: 0,
          stock: 999,
        },
        quantity,
      );
    }
    toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const hasMultipleImages =
    selectedVariant?.images && selectedVariant.images.length > 1;
  const hasMultipleGalleryImages = galleryImages.length > 1;
  const isLongDescription = (product.description?.length ?? 0) > 140;

  const glassBadgeStyle = {
    background: "var(--card-glass)",
    backdropFilter: "blur(14px) saturate(160%)",
    WebkitBackdropFilter: "blur(14px) saturate(160%)",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-md)",
  } as const;

  return (
    <div className="min-h-screen bg-background pt-0 md:pt-12 pb-[calc(env(safe-area-inset-bottom)+180px)] md:pb-12">
      <div className="max-w-6xl mx-auto md:px-4">
        <Link
          to="/shop"
          className="hidden md:inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>

        <div className="grid md:grid-cols-2 gap-0 md:gap-12 lg:gap-16">
          {/* ================= MOBILE — ảnh dạng carousel vuốt, tràn viền ================= */}
          <div className="md:hidden relative -mx-0">
            <div
              ref={mobileCarouselRef}
              onScroll={handleMobileCarouselScroll}
              className="flex w-full aspect-square overflow-x-auto snap-x snap-mandatory scrollbar-none bg-muted"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {galleryImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-full h-full shrink-0 snap-center"
                  style={{ scrollSnapAlign: "center" }}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.fallback) {
                        target.dataset.fallback = "true";
                        target.src = `https://picsum.photos/seed/${product.id}-${idx}/800/800`;
                      }
                    }}
                  />
                </div>
              ))}
            </div>

            {/* favorite button — không thêm nút back ở đây vì Navigation đã hiển thị
                sẵn nút back cho route này trên mobile, tránh 2 nút back chồng nhau */}
            <button
              type="button"
              onClick={() => {
                if (!product) return;
                toggleFavorite(product.id);
                toast.success(
                  isFavorite(product.id)
                    ? "Removed from favorites"
                    : "Added to favorites",
                );
              }}
              title={
                isFavorite(product?.id || "")
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
              className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center"
              style={{ ...glassBadgeStyle, touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-colors",
                  isFavorite(product?.id || "")
                    ? "fill-destructive text-destructive"
                    : "text-muted-foreground",
                )}
              />
            </button>

            {currentColor && selectedVariant?.hexCode && (
              <div
                className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                style={glassBadgeStyle}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedVariant.hexCode }}
                />
                {currentColor}
              </div>
            )}

            {/* dots indicator */}
            {hasMultipleGalleryImages && (
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
                {galleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Ảnh ${idx + 1}`}
                    onClick={() => scrollMobileTo(idx)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      idx === activeImageIndex ? "w-5 bg-white" : "w-1.5 bg-white/55",
                    )}
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ================= DESKTOP — ảnh + dải thumbnail ================= */}
          <div className="hidden md:block space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden bg-muted relative group">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = "true";
                    target.src = `https://picsum.photos/seed/${product.id}/800/800`;
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!product) return;
                  toggleFavorite(product.id);
                  toast.success(
                    isFavorite(product.id)
                      ? "Removed from favorites"
                      : "Added to favorites",
                  );
                }}
                title={
                  isFavorite(product?.id || "")
                    ? "Remove from favorites"
                    : "Add to favorites"
                }
                className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center transition-colors"
                style={{
                  ...glassBadgeStyle,
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Heart
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isFavorite(product?.id || "")
                      ? "fill-destructive text-destructive"
                      : "text-muted-foreground hover:text-destructive",
                  )}
                />
              </button>
              {currentColor && selectedVariant?.hexCode && (
                <div
                  className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                  style={glassBadgeStyle}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedVariant.hexCode }}
                  />
                  {currentColor}
                </div>
              )}
            </div>

            {hasMultipleImages && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {selectedVariant?.images?.map((img, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                      activeImageIndex === idx
                        ? "border-primary"
                        : "border-border hover:border-primary/40",
                    )}
                    style={{
                      touchAction: "manipulation",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= Product Info (dùng chung mobile + desktop) ================= */}
          <div className="space-y-5 md:space-y-6 px-4 pt-5 md:px-0 md:pt-0">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-xl sm:text-3xl mb-1">{product.name}</h1>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full capitalize">
                      {product.category}
                    </span>
                    {product.difficulty && (
                      <span
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full capitalize",
                          difficultyBadgeColors[product.difficulty],
                        )}
                      >
                        {product.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <StarRating rating={product.rating} count={product.reviewCount} />

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-primary">
                  {formatPrice(currentPrice)}
                </span>
                {selectedVariant &&
                  variantItems.length > 1 &&
                  selectedVariant.price !== variantItems[0].price && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(variantItems[0].price)}
                    </span>
                  )}
              </div>
            </div>

            {/* Mô tả — rút gọn 3 dòng trên mobile, có nút "Xem thêm" */}
            <div>
              <p
                className={cn(
                  "text-muted-foreground leading-relaxed",
                  !descExpanded && "line-clamp-3 md:line-clamp-none",
                )}
              >
                {product.description}
              </p>
              {isLongDescription && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className="md:hidden mt-1 text-sm font-medium text-primary"
                  style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                >
                  {descExpanded ? "Thu gọn" : "Xem thêm"}
                </button>
              )}
            </div>

            {/* Variant Selector + Stock — một khối thống nhất, không tách rời */}
            {variantItems.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <ProductVariantSelector
                  variants={variantItems}
                  onVariantChange={handleVariantChange}
                />

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="mb-2.5 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tồn kho</span>
                    <span className="font-medium">
                      {currentStock > 0
                        ? `${currentStock} sản phẩm`
                        : "Hết hàng"}
                    </span>
                  </div>
                  <YarnStockMeter
                    stock={currentStock}
                    maxStock={maxVariantStock}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {totalStock} sản phẩm trên tất cả màu
                  </p>
                </div>
              </div>
            )}

            {/* Yarn-specific details — accordion, gọn hơn trên mobile */}
            {product.category === "yarn" && (
              <CollapsibleSpecCard title="Yarn Specifications">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {product.material && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">
                        Material
                      </span>
                      <p className="font-medium">{product.material}</p>
                    </div>
                  )}
                  {product.weight && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">
                        Weight
                      </span>
                      <p className="font-medium">{product.weight}</p>
                    </div>
                  )}
                  {product.yardage && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">
                        Yardage
                      </span>
                      <p className="font-medium">{product.yardage} yards</p>
                    </div>
                  )}
                  {product.difficulty && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">
                        Skill Level
                      </span>
                      <p className="font-medium capitalize">
                        {product.difficulty}
                      </p>
                    </div>
                  )}
                </div>
              </CollapsibleSpecCard>
            )}

            {/* Kit-specific details — accordion */}
            {product.category === "kit" && (
              <CollapsibleSpecCard title="Kit Details">
                {product.difficulty && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Difficulty:</span>
                    <span
                      className={cn(
                        "px-3 py-0.5 rounded-full text-xs font-medium",
                        difficultyBadgeColors[product.difficulty],
                      )}
                    >
                      {product.difficulty.charAt(0).toUpperCase() +
                        product.difficulty.slice(1)}
                    </span>
                  </div>
                )}
                {product.estimatedTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      Estimated time:
                    </span>
                    <span className="font-medium">{product.estimatedTime}</span>
                  </div>
                )}
                {product.materials && product.materials.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">
                      What's included:
                    </span>
                    <ul className="space-y-1.5">
                      {product.materials.map((material, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">
                            {material}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CollapsibleSpecCard>
            )}

            {/* Quantity + Add to cart — chỉ hiện trên desktop.
                Trên mobile, số lượng + nút thêm giỏ đã gộp vào thanh sticky dưới cùng. */}
            <div className="hidden md:block space-y-3 pt-2">
              {currentStock > 0 && (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantity</span>
                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      whileHover={quantity > 1 ? { scale: 1.08 } : undefined}
                      whileTap={quantity > 1 ? { scale: 0.88 } : undefined}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      className={cn(
                        "w-10 h-10 rounded-full border flex items-center justify-center transition-colors duration-200",
                        quantity <= 1
                          ? "border-border/50 text-muted-foreground/50 cursor-not-allowed"
                          : "border-border text-foreground hover:border-primary hover:text-primary hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] active:shadow-[0_0_0_5px_var(--glow-primary)]",
                      )}
                    >
                      <Minus className="w-4 h-4" />
                    </motion.button>
                    <span className="w-8 text-center font-medium">
                      {quantity}
                    </span>
                    <motion.button
                      type="button"
                      onClick={() =>
                        setQuantity(Math.min(maxAvailableQuantity, quantity + 1))
                      }
                      disabled={quantity >= maxAvailableQuantity}
                      whileHover={
                        quantity < maxAvailableQuantity ? { scale: 1.08 } : undefined
                      }
                      whileTap={
                        quantity < maxAvailableQuantity ? { scale: 0.88 } : undefined
                      }
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      className={cn(
                        "w-10 h-10 rounded-full border flex items-center justify-center transition-colors duration-200",
                        quantity >= maxAvailableQuantity
                          ? "border-border/50 text-muted-foreground/50 cursor-not-allowed"
                          : "border-border text-foreground hover:border-primary hover:text-primary hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] active:shadow-[0_0_0_5px_var(--glow-primary)]",
                      )}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              )}

              <motion.button
                type="button"
                onClick={handleAddToCart}
                disabled={currentStock === 0}
                className="card-add-btn"
                aria-label={`Add ${product.name} to cart`}
                whileHover={currentStock > 0 ? { scale: 1.015 } : undefined}
                whileTap={currentStock > 0 ? { scale: 0.97 } : undefined}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                  mass: 0.6,
                }}
                style={{
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span className="card-add-btn__icon" aria-hidden="true">
                  <ShoppingCart size={15} strokeWidth={2.2} />
                </span>
                <span className="card-add-btn__label">
                  {currentStock > 0 ? "Add to Cart" : "Sold Out"}
                </span>
                <span className="card-add-btn__shine" aria-hidden="true" />
              </motion.button>
            </div>

            {/* Trust badges */}
            <div className="pt-4 border-t border-border grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center text-center gap-1.5 bg-muted/50 rounded-xl py-3 px-2">
                <Truck className="w-5 h-5 text-primary" />
                <p className="text-[11px] leading-tight text-muted-foreground">
                  Free shipping over $50
                </p>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5 bg-muted/50 rounded-xl py-3 px-2">
                <RotateCcw className="w-5 h-5 text-primary" />
                <p className="text-[11px] leading-tight text-muted-foreground">30-day returns</p>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5 bg-muted/50 rounded-xl py-3 px-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <p className="text-[11px] leading-tight text-muted-foreground">Secure checkout</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 md:mt-16 px-4 md:px-0">
          <h2 className="text-lg md:text-xl mb-4 md:mb-6">You Might Also Like</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 scrollbar-none">
            {(() => {
              const currentColors = new Set(
                product.variants
                  ?.flatMap((variant) => [variant.color, variant.hexCode])
                  .filter(Boolean),
              );

              return products
                .filter((related) => {
                  if (related.id === product.id) return false;
                  if (related.category === product.category) return true;

                  return related.variants?.some(
                    (variant) =>
                      Boolean(
                        variant.color && currentColors.has(variant.color),
                      ) ||
                      Boolean(
                        variant.hexCode && currentColors.has(variant.hexCode),
                      ),
                  );
                })
                .slice(0, 4)
                .map((related) => {
                  const relatedPrice =
                    related.variants?.[0]?.price ?? (related as any).price ?? 0;
                  return (
                    <Link
                      key={related.id}
                      to={`/shop/product/${related.id}`}
                      className="group bg-card rounded-2xl overflow-hidden border border-border transition-all hover:border-primary/20 shrink-0 w-[160px] sm:w-[180px] md:w-auto"
                      style={{ boxShadow: "0 0 0 transparent" }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.boxShadow =
                          "0 14px 36px color-mix(in srgb, var(--primary) 8%, transparent)";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.boxShadow = "0 0 0 transparent";
                      }}
                    >
                      <div className="aspect-square overflow-hidden bg-muted">
                        <img
                          src={related.image}
                          alt={related.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3 md:p-4">
                        <h4 className="line-clamp-2 text-sm mb-1">{related.name}</h4>
                        {relatedPrice > 0 && (
                          <p className="text-sm font-semibold text-primary">
                            {formatPrice(relatedPrice)}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                });
            })()}
          </div>
        </div>
      </div>

      {/* Thanh sticky mobile: số lượng + tạm tính + nút thêm giỏ trong CÙNG một hàng */}
      {!scrolledToBottom && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+92px)] left-3 right-[84px] z-40 rounded-[26px] border border-[var(--border-light)] bg-background/97 backdrop-blur-xl px-3 py-2.5 md:hidden shadow-[0_10px_30px_rgba(24,24,27,0.14)]">
          <div className="flex items-center gap-3">
            {currentStock > 0 && (
              <div className="flex items-center gap-1 shrink-0 rounded-full border border-border p-0.5">
                <motion.button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  whileHover={quantity > 1 ? { scale: 1.1 } : undefined}
                  whileTap={quantity > 1 ? { scale: 0.85 } : undefined}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    quantity <= 1
                      ? "text-muted-foreground/40"
                      : "text-foreground hover:text-primary hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] active:shadow-[0_0_0_4px_var(--glow-primary)]",
                  )}
                  style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                >
                  <Minus className="w-3.5 h-3.5" />
                </motion.button>
                <span className="w-6 text-center text-sm font-semibold">
                  {quantity}
                </span>
                <motion.button
                  type="button"
                  onClick={() =>
                    setQuantity(Math.min(maxAvailableQuantity, quantity + 1))
                  }
                  disabled={quantity >= maxAvailableQuantity}
                  whileHover={
                    quantity < maxAvailableQuantity ? { scale: 1.1 } : undefined
                  }
                  whileTap={
                    quantity < maxAvailableQuantity ? { scale: 0.85 } : undefined
                  }
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    quantity >= maxAvailableQuantity
                      ? "text-muted-foreground/40"
                      : "text-foreground hover:text-primary hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] active:shadow-[0_0_0_4px_var(--glow-primary)]",
                  )}
                  style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            )}

            <motion.button
              onClick={handleAddToCart}
              disabled={currentStock === 0}
              className="card-add-btn flex-1"
              aria-label={`Add ${product.name} to cart`}
              whileHover={currentStock > 0 ? { scale: 1.015 } : undefined}
              whileTap={currentStock > 0 ? { scale: 0.97 } : undefined}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 30,
                mass: 0.6,
              }}
            >
              <span className="card-add-btn__icon" aria-hidden="true">
                <ShoppingCart size={15} strokeWidth={2.2} />
              </span>
              <span className="card-add-btn__label">
                {currentStock > 0
                  ? `Thêm · ${formatPrice(currentPrice * quantity)}`
                  : "Sold Out"}
              </span>
              <span className="card-add-btn__shine" aria-hidden="true" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}