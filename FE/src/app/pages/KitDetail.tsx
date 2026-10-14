// ============================================================
// Kit Detail Page — route /kits/:id
// Fetches kit data from GET /api/v1/kits/{id}
// Bố cục + style dùng chung với /shop/product/:id (product-detail.css);
// phần riêng của combo (hộp nguyên liệu, giá lẻ) nằm trong kit-detail.css.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Heart,
  ChevronRight,
  ChevronDown,
  Gift,
  Boxes,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { formatPrice } from "../../lib/formatPrice";
import { kitService, type Kit, type KitProduct } from "../../shared/api/kitService";
import { useAuth } from "../../shared/hooks/useAuth";
import { useFavorites } from "../../shared/contexts/FavoritesContext";
import { cn } from "../../shared/components/ui/utils";
import { LevelBadge } from "../../shared/components/LevelBadge";
import { getValidHex, isDefaultVariant } from "../../shared/components/ProductVariantSelector";
import { YarnBallIcon } from "../../features/shop/shopMeta";
import { EmptyHoopIllustration } from "./shop/CartPage";
import "../../styles/craft.css";
import "../../styles/product-detail.css";
import "../../styles/kit-detail.css";
import { useAddToCart } from "../../features/cart/useAddToCart";

/** Số món hiện sẵn trong hộp — phần còn lại mở bằng "Xem thêm". */
const VISIBLE_ITEMS = 4;

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
        {count > 0 ? (
          <>
            <strong className="text-foreground">{rating.toFixed(1)}</strong> · {count} đánh giá
          </>
        ) : (
          "Chưa có đánh giá"
        )}
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
    return { key: "empty", colorVar: "var(--muted-foreground)", label: "Hết hàng" };
  }
  if (percent > 70) {
    return { key: "high", colorVar: "var(--success-text)", label: "Còn nhiều hàng" };
  }
  if (percent >= 30) {
    return { key: "mid", colorVar: "var(--warning-text)", label: "Số lượng có hạn" };
  }
  return { key: "low", colorVar: "var(--error-text)", label: "Sắp hết hàng" };
}

/** Thanh tồn kho hình một đoạn dây len — vân xoắn nhẹ, đổi màu theo mức tồn kho. */
function YarnStockMeter({ stock, maxStock }: { stock: number; maxStock: number }) {
  const percent =
    maxStock > 0 ? Math.min(100, Math.max(0, Math.round((stock / maxStock) * 100))) : 0;
  const status = getStockStatus(stock, percent);

  return (
    <div className="flex items-center gap-3">
      <div
        className="relative h-3 w-full max-w-[220px] overflow-hidden rounded-full"
        style={{ background: "var(--muted)" }}
      >
        {/* nền dây - vân xoắn mờ */}
        <svg className="absolute inset-0 h-full w-full" style={{ opacity: 0.35 }} preserveAspectRatio="none">
          <defs>
            <pattern id="yarn-twist-track" width="7" height="7" patternTransform="rotate(35)" patternUnits="userSpaceOnUse">
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
          <svg className="absolute inset-0 h-full w-full" style={{ opacity: 0.3 }} preserveAspectRatio="none">
            <defs>
              <pattern id={`yarn-twist-${status.key}`} width="6" height="6" patternTransform="rotate(35)" patternUnits="userSpaceOnUse">
                <rect width="3" height="6" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#yarn-twist-${status.key})`} />
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
      <span className="whitespace-nowrap text-xs font-medium" style={{ color: status.colorVar }}>
        {status.label}
      </span>
    </div>
  );
}

/** Biến thể đã chọn trong kit (theo variantId), fallback biến thể đầu. */
function getKitVariant(kitProduct: KitProduct) {
  const product = kitProduct.productId;
  return product?.variants?.find((v) => v._id === kitProduct.variantId) || product?.variants?.[0];
}

/** 1 món trong hộp: ảnh, tên, màu, số lượng, thành tiền lẻ. */
function KitItemRow({ kitProduct, index }: { kitProduct: KitProduct; index: number }) {
  const product = kitProduct.productId;
  const variant = getKitVariant(kitProduct);
  const hex =
    variant && !isDefaultVariant(variant) ? getValidHex(variant.hexCode) : undefined;
  const colorLabel = variant && !isDefaultVariant(variant) ? variant.color.trim() : "Mặc định";
  const lineTotal = (variant?.price ?? 0) * kitProduct.quantity;

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, delay: Math.min(index, 6) * 0.03 }}
    >
      <Link to={`/shop/product/${product._id}`} className="kd-item">
        <span className="kd-item-thumb">
          <img
            src={variant?.image || product.image}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.fallback) {
                target.dataset.fallback = "true";
                target.src = `https://picsum.photos/seed/${product._id}/200/200`;
              }
            }}
          />
          {kitProduct.quantity > 1 && <span className="kd-item-qty">×{kitProduct.quantity}</span>}
        </span>
        <span className="kd-item-info">
          <span className="kd-item-name">{product.name}</span>
          <span className="kd-item-meta">
            <span
              className={cn("kd-item-dot", !hex && "is-default")}
              style={hex ? { backgroundColor: hex } : undefined}
            />
            {colorLabel}
          </span>
        </span>
        <span className="kd-item-price">
          {lineTotal > 0 ? formatPrice(lineTotal) : ""}
          <ChevronRight className="w-4 h-4" />
        </span>
      </Link>
    </motion.li>
  );
}

export function KitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addKit } = useAddToCart();
  const { isFavoriteKit, toggleFavoriteKit } = useFavorites();
  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllProducts, setShowAllProducts] = useState(false);
  // Mobile (< md): nút thêm giỏ chuyển thành thanh nổi cạnh FAB "+" (như trang sản phẩm)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );

  const isKitFavorite = kit ? isFavoriteKit(kit._id) : false;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleToggleFavorite = () => {
    if (!kit) return;
    toggleFavoriteKit(kit._id);
    toast.success(
      isKitFavorite
        ? "Đã xoá khỏi danh sách yêu thích"
        : "Đã thêm vào danh sách yêu thích",
    );
  };

  useEffect(() => {
    if (!id) return;
    kitService
      .getById(id)
      .then((res) => setKit(res.data.data?.kit ?? null))
      .catch(() => {
        toast.error("Không thể tải thông tin kit");
        setKit(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Tổng giá nếu mua lẻ từng món (giá biến thể × số lượng) — để hiện mức tiết kiệm
  const retailTotal = useMemo(
    () =>
      (kit?.products ?? []).reduce(
        (sum, kitProduct) => sum + (getKitVariant(kitProduct)?.price ?? 0) * kitProduct.quantity,
        0,
      ),
    [kit],
  );

  const handleAddAllToCart = () => {
    if (!kit || !isAuthenticated) {
      if (!isAuthenticated) navigate("/auth/login");
      return;
    }

    // Use kit.products which has the correct structure
    const products = kit.products.map((kitProduct) => {
      const product = kitProduct.productId;
      const selectedVariant = getKitVariant(kitProduct);

      return {
        productId: product._id,
        variantId: kitProduct.variantId,
        name: product.name,
        image: selectedVariant?.image || product.image,
        price: selectedVariant?.price || 0,
      };
    });

    addKit({
      kitId: kit._id,
      name: kit.name,
      thumbnail: kit.thumbnail,
      price: kit.price,
      products,
    });
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
              <div className="craft-skeleton h-16 w-full" />
              <div className="craft-skeleton h-64 w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="craft-empty w-full max-w-lg">
          <EmptyHoopIllustration size={150} />
          <p className="craft-empty-title">Không tìm thấy combo</p>
          <p className="craft-empty-desc">Combo không tồn tại hoặc đã được gỡ khỏi cửa hàng.</p>
          <Link to="/shop?view=combo" className="craft-btn">
            <ArrowLeft className="w-4 h-4" />
            Quay lại cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  const items = kit.products || [];
  const itemCount = items.length;
  const visibleItems = showAllProducts ? items : items.slice(0, VISIBLE_ITEMS);
  const hiddenCount = itemCount - VISIBLE_ITEMS;
  const savings = retailTotal - kit.price;
  const showSavings = savings > 0 && retailTotal > 0;
  const soldOut = kit.stock === 0;

  const addButton = (floating: boolean) => (
    <motion.button
      type="button"
      onClick={handleAddAllToCart}
      disabled={soldOut}
      className={cn("card-add-btn pd-add", floating && "pd-float-add")}
      aria-label={soldOut ? `${kit.name} đã hết hàng` : `Thêm combo ${kit.name} vào giỏ, ${formatPrice(kit.price)}`}
      whileTap={!soldOut ? { scale: 0.97 } : undefined}
      transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.6 }}
    >
      <span className="card-add-btn__icon" aria-hidden="true">
        <ShoppingCart size={15} strokeWidth={2.2} />
      </span>
      {soldOut ? (
        <span className="card-add-btn__label">Hết hàng</span>
      ) : (
        <span className="card-add-btn__label pd-add-label" aria-hidden="true">
          <span className="pd-add-label-long">Thêm combo vào giỏ · {formatPrice(kit.price)}</span>
          <span className="pd-add-label-short">Thêm · {formatPrice(kit.price)}</span>
          <span className="pd-add-label-tiny">{formatPrice(kit.price)}</span>
        </span>
      )}
      <span className="card-add-btn__shine" aria-hidden="true" />
    </motion.button>
  );

  return (
    <div className="pd-page min-h-screen bg-background pt-0 md:pt-8">
      <div className="pd-wrap md:px-4">
        {/* ── Breadcrumb ── */}
        <nav className="pd-crumbs" aria-label="Breadcrumb">
          <Link to="/shop">Cửa hàng</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/shop?view=combo">Combo</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span aria-current="page">{kit.name}</span>
        </nav>

        <div className="pd-grid">
          {/* ── Ảnh combo trong khung vải ── */}
          <div className="pd-gallery kd-gallery">
            <div className="pd-stage kd-stage group">
              <img
                src={kit.thumbnail}
                alt={kit.name}
                className="transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = "true";
                    target.src = `https://picsum.photos/seed/${kit._id}/800/800`;
                  }
                }}
              />
              <div className="absolute top-4 right-4 z-[2]">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  aria-label={isKitFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                  aria-pressed={isKitFavorite}
                  className={cn("pd-fav", isKitFavorite && "is-active")}
                >
                  <Heart className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute top-4 left-4 z-[2]">
                <LevelBadge level={kit.level} />
              </div>
              {/* Mác "trong hộp có N món" treo ở góc ảnh */}
              <span className="kd-box-tag">
                <Gift className="w-3.5 h-3.5" />
                {itemCount} món trong hộp
              </span>
            </div>
          </div>

          {/* ── Thông tin ── */}
          <div className="pd-info">
            <div>
              <span className="pd-eyebrow">
                <Gift size={16} />
                Combo DIY · {itemCount} món
              </span>
              <h1 className="pd-title">{kit.name}</h1>
              <div className="mt-3">
                <StarRating rating={kit.averageRating} count={kit.totalRatings} />
              </div>
            </div>

            {/* Giá combo + so với mua lẻ */}
            <div className="pd-price-row kd-price-row">
              <span className="pd-price">{formatPrice(kit.price)}</span>
              {showSavings && (
                <>
                  <span className="pd-price-old">{formatPrice(retailTotal)}</span>
                  <span className="kd-save">
                    <Sparkles className="w-3.5 h-3.5" />
                    Tiết kiệm {formatPrice(savings)}
                  </span>
                </>
              )}
            </div>
            {showSavings && (
              <p className="kd-price-note">so với mua lẻ từng món trong hộp</p>
            )}

            {kit.description && <p className="pd-desc">{kit.description}</p>}

            {/* ── Hộp nguyên liệu ── */}
            <section className="kd-box" aria-labelledby="kd-box-title">
              <div className="kd-box-head">
                <span className="pd-band-icon">
                  <Boxes size={16} />
                </span>
                <div className="min-w-0">
                  <h2 id="kd-box-title" className="pd-band-title">
                    Trong hộp có gì
                  </h2>
                  <p className="kd-box-sub">
                    {itemCount} món · bấm vào từng món để xem chi tiết
                  </p>
                </div>
              </div>

              {itemCount > 0 ? (
                <ul className="kd-items">
                  <AnimatePresence initial={false}>
                    {visibleItems.map((kitProduct, index) => (
                      <KitItemRow
                        key={`${kitProduct.productId._id}-${kitProduct.variantId}`}
                        kitProduct={kitProduct}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              ) : (
                <p className="kd-box-empty">Combo này chưa có sản phẩm nào.</p>
              )}

              {hiddenCount > 0 && (
                <button
                  type="button"
                  className="kd-more"
                  onClick={() => setShowAllProducts((v) => !v)}
                  aria-expanded={showAllProducts}
                >
                  {showAllProducts ? "Thu gọn" : `Xem thêm ${hiddenCount} món`}
                  <ChevronDown
                    className={cn("w-4 h-4 transition-transform", showAllProducts && "rotate-180")}
                  />
                </button>
              )}

              {retailTotal > 0 && (
                <div className="kd-box-total">
                  <span>Tổng nếu mua lẻ</span>
                  <span>{formatPrice(retailTotal)}</span>
                </div>
              )}
            </section>

            {/* Tồn kho */}
            <div className="pd-panel">
              <div className="mb-2.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tồn kho</span>
                <span className="font-medium">
                  {kit.stock > 0 ? `${kit.stock} combo` : "Hết hàng"}
                </span>
              </div>
              <YarnStockMeter stock={kit.stock} maxStock={100} />
            </div>

            {/* Desktop (≥ md): nút thêm giỏ inline. Mobile dùng thanh nổi cạnh FAB. */}
            <div className="pd-buy">{addButton(false)}</div>

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

        {/* Gợi ý tự làm — nhắc sang Góc sáng tạo */}
        <section className="kd-cta">
          <span className="craft-section-icon">
            <YarnBallIcon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="kd-cta-title">Làm xong rồi? Khoe thành phẩm nhé!</p>
            <p className="kd-cta-sub">
              Chia sẻ tác phẩm từ combo này ở Góc sáng tạo để cộng đồng cùng xem.
            </p>
          </div>
          <Link to="/diy" className="craft-btn-ghost">
            Góc sáng tạo
            <ChevronRight className="w-4 h-4" />
          </Link>
        </section>
      </div>

      {/* Mobile (< md): thanh mua nổi, cùng hàng & ngay bên trái nút FAB "+" */}
      <AnimatePresence>
        {isMobile && (
          <motion.div
            key="kit-floating-buy"
            className="pd-float kd-float md:hidden"
            role="region"
            aria-label="Mua combo"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {addButton(true)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
