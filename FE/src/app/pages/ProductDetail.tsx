import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Heart,
  Check,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Layers3,
  Ruler,
  Gauge,
  Clock,
  Gift,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { products, getTotalStock } from "../data/products";
import {
  ProductVariantSelector,
  getValidHex,
  getVariantLabel,
  isDefaultVariant,
  shouldHideVariantPicker,
} from "../../shared/components/ProductVariantSelector";
import { ProductCard } from "../../shared/components/ProductCard";
import { LevelBadge } from "../../shared/components/LevelBadge";
import { useAuth } from "../../shared/hooks/useAuth";
import { useCart } from "../../shared/contexts/CartContext";
import { useFavorites } from "../../shared/contexts/FavoritesContext";
import { cn } from "../../shared/components/ui/utils";
import { formatPrice } from "../../lib/formatPrice";
import { fetchProductById } from "../../features/shop/services/product.service";
import {
  getCategoryMeta,
  SHOP_LEVELS,
  YarnBallIcon,
} from "../../features/shop/shopMeta";
import type { ProductVariantUI } from "../../shared/components/ProductVariantSelector";
import type { Product } from "../data/products";
import { EmptyHoopIllustration } from "./shop/CartPage";
import { ProductBuyControls } from "../../features/shop/components/ProductBuyControls";
import "../../styles/craft.css";
import "../../styles/product-detail.css";
import { useAddToCart } from "../../features/cart/useAddToCart";

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
                ? "fill-[var(--rating-star)] text-[var(--rating-star)]"
                : i < rating
                  ? "fill-[var(--rating-star-half)] text-[var(--rating-star)]"
                  : "fill-muted-foreground/20 text-muted-foreground/30",
            )}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        <strong className="text-foreground">{rating.toFixed(1)}</strong> · {count} đánh giá
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
        className="relative h-3 w-full max-w-[220px] overflow-hidden rounded-full"
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
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pd-band">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="pd-band-head"
        aria-expanded={open}
      >
        <span className="pd-band-icon">{icon}</span>
        <h3 className="pd-band-title">{title}</h3>
        <ChevronDown
          className={cn(
            "ml-auto w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="pd-band-body">{children}</div>}
    </div>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="pd-spec">
      <span className="pd-spec-icon">{icon}</span>
      <div className="min-w-0">
        <p className="pd-spec-label">{label}</p>
        <p className="pd-spec-value">{value}</p>
      </div>
    </div>
  );
}

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cartItems } = useCart();
  const { addProduct } = useAddToCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariantUI | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);

  // Mobile (< md): khối mua inline bị ẩn, thay bằng thanh nổi cạnh nút FAB "+".
  // Chỉ mount thanh nổi trên mobile để desktop không có thêm phần tử/animation nào.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );

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
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
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
  const showVariantPicker = !shouldHideVariantPicker(variantItems);
  // "X sản phẩm trên tất cả màu" chỉ có nghĩa khi ≥ 2 màu và khác số của màu đang chọn
  const showTotalStock = variantItems.length >= 2 && totalStock !== currentStock;

  // Mốc "đầy dây" để so tỉ lệ: lấy biến thể có tồn kho cao nhất làm chuẩn
  const maxVariantStock = useMemo(() => {
    if (variantItems.length === 0) return currentStock || 1;
    return Math.max(...variantItems.map((v) => v.stock), 1);
  }, [variantItems, currentStock]);

  // Gợi ý: cùng danh mục, hoặc trùng màu len với sản phẩm đang xem
  const relatedProducts = useMemo(() => {
    if (!product) return [];
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
            Boolean(variant.color && currentColors.has(variant.color)) ||
            Boolean(variant.hexCode && currentColors.has(variant.hexCode)),
        );
      })
      .slice(0, 4);
  }, [product]);

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
      addProduct(
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
      addProduct(
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
  };

  const handleToggleFavorite = () => {
    if (!product) return;
    toggleFavorite(product.id);
    toast.success(
      isFavorite(product.id) ? "Đã bỏ khỏi yêu thích" : "Đã thêm vào yêu thích",
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 pt-8">
        <div className="pd-wrap">
          <div className="craft-skeleton mb-6 h-4 w-56" />
          <div className="grid gap-10 md:grid-cols-2">
            <div className="craft-skeleton aspect-square rounded-[28px]" />
            <div className="space-y-4">
              <div className="craft-skeleton h-5 w-32" />
              <div className="craft-skeleton h-10 w-4/5" />
              <div className="craft-skeleton h-8 w-40" />
              <div className="craft-skeleton h-24 w-full" />
              <div className="craft-skeleton h-40 w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="craft-empty w-full max-w-lg">
          <EmptyHoopIllustration size={150} />
          <p className="craft-empty-title">Không tìm thấy sản phẩm</p>
          <p className="craft-empty-desc">
            Sản phẩm này không tồn tại hoặc đã được gỡ khỏi cửa hàng.
          </p>
          <Link to="/shop" className="craft-btn">
            <ArrowLeft className="w-4 h-4" />
            Về cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  const hasMultipleGalleryImages = galleryImages.length > 1;
  const isLongDescription = (product.description?.length ?? 0) > 140;
  const category = getCategoryMeta(product.category);
  const CategoryIcon = category.Icon;
  const favorite = isFavorite(product.id);
  const level = product.difficulty ? SHOP_LEVELS[product.difficulty] : null;

  const favButton = (
    <button
      type="button"
      onClick={handleToggleFavorite}
      aria-label={favorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      aria-pressed={favorite}
      className={cn("pd-fav", favorite && "is-active")}
    >
      <Heart className="w-5 h-5" />
    </button>
  );

  const chipHex =
    selectedVariant && !isDefaultVariant(selectedVariant)
      ? getValidHex(selectedVariant.hexCode)
      : undefined;
  const colorChip =
    currentColor && chipHex && selectedVariant ? (
      <div className="pd-color-chip">
        <span style={{ backgroundColor: chipHex }} />
        {getVariantLabel(selectedVariant)}
      </div>
    ) : null;

  return (
    <div className="pd-page min-h-screen bg-background pt-0 md:pt-8">
      <div className="pd-wrap md:px-4">
        {/* ── Breadcrumb ── */}
        <nav className="pd-crumbs" aria-label="Breadcrumb">
          <Link to="/shop">Cửa hàng</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to={`/shop?category=${product.category}`}>{category.label}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="pd-grid">
          {/* ================= MOBILE — ảnh dạng carousel vuốt, tràn viền ================= */}
          <div className="md:hidden relative">
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
            <div className="absolute top-4 right-4">{favButton}</div>
            {colorChip && <div className="absolute bottom-4 left-4">{colorChip}</div>}

            {/* dots indicator */}
            {hasMultipleGalleryImages && (
              <div className="absolute bottom-5 right-4 flex items-center gap-1.5">
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

          {/* ================= DESKTOP — ảnh trong khung vải + dải thumbnail ================= */}
          <div className="pd-gallery hidden md:block">
            <div className="pd-stage group">
              <img
                src={currentImage}
                alt={product.name}
                className="transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = "true";
                    target.src = `https://picsum.photos/seed/${product.id}/800/800`;
                  }
                }}
              />
              <div className="absolute top-4 right-4 z-[2]">{favButton}</div>
              {colorChip && <div className="absolute bottom-4 left-4 z-[2]">{colorChip}</div>}
            </div>

            {hasMultipleGalleryImages && (
              <div className="pd-thumbs">
                {galleryImages.map((img, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn("pd-thumb", activeImageIndex === idx && "is-active")}
                    aria-label={`Xem ảnh ${idx + 1}`}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= Thông tin (dùng chung mobile + desktop) ================= */}
          <div className="pd-info">
            <div>
              <span className="pd-eyebrow">
                <CategoryIcon size={16} />
                {category.label}
                {product.material && <> · {product.material}</>}
              </span>
              <h1 className="pd-title">{product.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StarRating rating={product.rating} count={product.reviewCount} />
                <LevelBadge level={product.difficulty} />
              </div>
            </div>

            {/* Giá — như mác treo trên cuộn len */}
            <div className="pd-price-row">
              <span className="pd-price">{formatPrice(currentPrice)}</span>
              {selectedVariant &&
                variantItems.length > 1 &&
                selectedVariant.price !== variantItems[0].price && (
                  <span className="pd-price-old">{formatPrice(variantItems[0].price)}</span>
                )}
            </div>

            {/* Mô tả — rút gọn 3 dòng trên mobile, có nút "Xem thêm" */}
            <div>
              <p className={cn("pd-desc", !descExpanded && "line-clamp-3 md:line-clamp-none")}>
                {product.description}
              </p>
              {isLongDescription && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className="md:hidden mt-1 text-sm font-medium text-primary"
                >
                  {descExpanded ? "Thu gọn" : "Xem thêm"}
                </button>
              )}
            </div>

            {/* Variant Selector + Stock — một khối thống nhất, không tách rời */}
            {variantItems.length > 0 && (
              <div className="pd-panel">
                <ProductVariantSelector
                  variants={variantItems}
                  onVariantChange={handleVariantChange}
                />

                {showVariantPicker && <div className="pd-panel-divider" />}
                <div className="mb-2.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tồn kho</span>
                  <span className="font-medium">
                    {currentStock > 0 ? `${currentStock} sản phẩm` : "Hết hàng"}
                  </span>
                </div>
                <YarnStockMeter stock={currentStock} maxStock={maxVariantStock} />
                {showTotalStock && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {totalStock} sản phẩm trên tất cả màu
                  </p>
                )}
              </div>
            )}

            {/* Nhãn cuộn len — thông số dạng "ball band" */}
            {product.category === "yarn" && (
              <CollapsibleSpecCard title="Nhãn cuộn len" icon={<YarnBallIcon size={16} />}>
                <div className="pd-spec-grid">
                  {product.material && (
                    <SpecItem
                      icon={<Layers3 size={15} />}
                      label="Chất liệu"
                      value={product.material}
                    />
                  )}
                  {product.weight && (
                    <SpecItem icon={<Gauge size={15} />} label="Độ dày sợi" value={product.weight} />
                  )}
                  {product.yardage && (
                    <SpecItem
                      icon={<Ruler size={15} />}
                      label="Chiều dài"
                      value={`${product.yardage} yards`}
                    />
                  )}
                  {level && (
                    <SpecItem icon={<level.Icon size={15} />} label="Trình độ" value={level.label} />
                  )}
                </div>
              </CollapsibleSpecCard>
            )}

            {/* Kit-specific details — accordion */}
            {product.category === "kit" && (
              <CollapsibleSpecCard title="Trong hộp có gì" icon={<Gift size={16} />}>
                <div className="pd-spec-grid">
                  {level && (
                    <SpecItem icon={<level.Icon size={15} />} label="Trình độ" value={level.label} />
                  )}
                  {product.estimatedTime && (
                    <SpecItem
                      icon={<Clock size={15} />}
                      label="Thời gian dự kiến"
                      value={product.estimatedTime}
                    />
                  )}
                </div>
                {product.materials && product.materials.length > 0 && (
                  <ul className="pd-materials">
                    {product.materials.map((material, index) => (
                      <li key={index}>
                        <Check className="w-4 h-4 shrink-0" />
                        <span>{material}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CollapsibleSpecCard>
            )}

            {/* Desktop (≥ md): khối mua inline. Mobile dùng thanh nổi ở cuối trang. */}
            <ProductBuyControls
              variant="inline"
              quantity={quantity}
              onChange={setQuantity}
              onAdd={handleAddToCart}
              price={currentPrice}
              stock={currentStock}
              max={maxAvailableQuantity}
              productName={product.name}
            />

            {/* Cam kết */}
            <div className="pd-trust">
              <div>
                <Truck className="w-5 h-5" />
                <p>Giao toàn quốc qua GHN</p>
              </div>
              <div>
                <RotateCcw className="w-5 h-5" />
                <p>Đổi trả trong 30 ngày</p>
              </div>
              <div>
                <ShieldCheck className="w-5 h-5" />
                <p>Thanh toán an toàn</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Gợi ý ── */}
        {relatedProducts.length > 0 && (
          <section className="mt-14 px-4 md:mt-20 md:px-0">
            <div className="craft-section-head">
              <span className="craft-section-icon">
                <YarnBallIcon size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="craft-section-title">Có thể bạn cũng thích</h2>
                <p className="craft-section-sub">Cùng loại hoặc cùng tông màu len</p>
              </div>
              <span className="craft-section-thread" aria-hidden />
            </div>
            <div className="pd-related">
              {relatedProducts.map((related) => (
                <div key={related.id} className="pd-related-item">
                  <ProductCard product={related} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile (< md): thanh mua nổi, cùng hàng & ngay bên trái nút FAB "+" */}
      <AnimatePresence>
        {isMobile && (
          <ProductBuyControls
            key="floating-buy"
            variant="floating"
            quantity={quantity}
            onChange={setQuantity}
            onAdd={handleAddToCart}
            price={currentPrice}
            stock={currentStock}
            max={maxAvailableQuantity}
            productName={product.name}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
