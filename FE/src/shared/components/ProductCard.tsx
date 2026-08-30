import { memo } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { Product } from "../../app/data/products";
import { getBasePrice } from "../../app/data/products";
import { useFavorites } from "../contexts/FavoritesContext";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../contexts/CartContext";
import { LevelBadge } from "./LevelBadge";
import { formatPrice } from "../../lib/formatPrice";
import { ResponsiveImage } from "./ui/ResponsiveImage";

interface ProductCardProps {
  product: Product;
  relatedLessonId?: string;
  relatedCourseId?: string;
}

// ── Star rating ──
function Stars({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path
            d="M5.5 1L6.7 4.1H10L7.4 6.1L8.4 9.2L5.5 7.4L2.6 9.2L3.6 6.1L1 4.1H4.3Z"
            fill={
              s <= Math.round(value) ? "var(--rating-star)" : "var(--border)"
            }
          />
        </svg>
      ))}
    </div>
  );
}

export const ProductCard = memo(function ProductCard({
  product,
  relatedLessonId,
  relatedCourseId,
}: ProductCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const prices = product.variants?.map((variant) => variant.price) ?? [
    getBasePrice(product),
  ];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const hasPriceRange = minPrice !== maxPrice;

  const formattedPrice = hasPriceRange
    ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
    : formatPrice(minPrice);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    action();
  };

  const handleAddClick = (event: React.MouseEvent) => {
    event.preventDefault();
    requireAuth(() => {
      const variant = product.variants?.[0];
      if (!variant) return;
      addToCart({
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        image: variant.images?.[0] || product.image,
        color: variant.color || "",
        hexCode: variant.hexCode || "#ccc",
        price: variant.price,
        stock: variant.stock,
      });
      toast.success("Đã thêm vào giỏ hàng");
    });
  };

  const handleProductClick = (event: React.MouseEvent) => {
    if (!isAuthenticated) {
      event.preventDefault();
      navigate("/auth/login");
    }
  };

  return (
    // NOTE ON LAYOUT STABILITY (no gaps in sibling cards on hover):
    // 1. Lift/scale on hover chạy bằng `transform` qua CSS thuần
    //    (.product-card:hover trong globals.css — chỉ trên thiết bị có chuột),
    //    không đụng width/height/margin → grid track không đổi kích thước.
    // 2. `isolation: isolate` + `contain: layout` scope z-index & repaint
    //    vào đúng card này.
    // 3. Rating + "Add to cart" hiển thị MỌI LÚC (đã bỏ hover-to-reveal) —
    //    mọi card cùng chiều cao, grid dùng align-items: start.
    <article
      className="product-card"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--card)",
        borderRadius: "24px",
        overflow: "hidden",
        position: "relative",
        isolation: "isolate",
        contain: "layout",
        transformOrigin: "center bottom",
      }}
    >
      {/* ── Image area ── */}
      <Link
        to={`/shop/product/${product.id}`}
        className="block"
        onClick={handleProductClick}
        style={{ position: "relative" }}
      >
        <div
          style={{
            position: "relative",
            aspectRatio: "1 / 1",
            overflow: "hidden",
            background: "var(--surface)",
            flexShrink: 0,
          }}
        >
          <div
            className="product-card__img"
            style={{ width: "100%", height: "100%" }}
          >
            <ResponsiveImage
              src={product.image}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                transition: "filter 0.4s ease",
              }}
            />
          </div>

          {/* Ambient image vignette — subtle, keeps top badges legible */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--bg-vignette)",
              pointerEvents: "none",
            }}
          />

          {/* Soft glow sweep on hover — CSS-only, không tốn JS mỗi frame */}
          <div
            aria-hidden
            className="product-card__sweep"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "45%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 1,
              opacity: 0,
              background:
                "linear-gradient(75deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
              transform: "translateX(-120%) skewX(-12deg)",
            }}
          />

          {/* Heart button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            onClick={(event) => {
              event.preventDefault();
              toggleFavorite(product.id);
            }}
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "var(--bg-overlay-88)",
              backdropFilter: "blur(6px)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 5,
              boxShadow: "var(--shadow-sm)",
            }}
            aria-label={
              isFavorite(product.id)
                ? "Remove from favorites"
                : "Add to favorites"
            }
          >
            <motion.span
              animate={
                isFavorite(product.id) ? { scale: [1, 1.35, 1] } : { scale: 1 }
              }
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{ display: "flex" }}
            >
              <Heart
                size={14}
                strokeWidth={isFavorite(product.id) ? 0 : 1.8}
                style={{
                  fill: isFavorite(product.id) ? "var(--decor-heart)" : "none",
                  stroke: isFavorite(product.id)
                    ? "var(--decor-heart)"
                    : "var(--color-text-muted)",
                }}
              />
            </motion.span>
          </motion.button>

          {/* Level badge */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              zIndex: 3,
            }}
          >
            <LevelBadge level={product.difficulty} />
          </div>

          {/* In a lesson badge */}
          {relatedLessonId && relatedCourseId && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                navigate(`/learn/${relatedCourseId}/lesson/${relatedLessonId}`);
              }}
              style={{
                position: "absolute",
                bottom: "12px",
                right: "12px",
                padding: "2px 9px",
                borderRadius: "999px",
                background: "var(--primary)",
                border: "none",
                fontFamily: "'Caveat', cursive",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "var(--primary-foreground)",
                cursor: "pointer",
                boxShadow: "0 2px 8px var(--glow-primary)",
                zIndex: 5,
              }}
            >
              📹 Lesson
            </button>
          )}
        </div>
      </Link>

      {/* ── Card body ── */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Row 1: Category + Price */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "6px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 10px",
              borderRadius: "999px",
              background: "var(--accent-pink)",
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.62rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-accent)",
            }}
          >
            {product.category}
          </div>

          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "var(--primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {formattedPrice}
          </div>
        </div>

        <Link
          to={`/shop/product/${product.id}`}
          className="block"
          onClick={handleProductClick}
        >
          {/* Product name */}
          <div
            className="product-card__name"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.05rem",
              fontWeight: 600,
              color: "var(--foreground)",
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
              marginBottom: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {product.name}
          </div>

          {/* Description */}
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.75rem",
              color: "var(--foreground-muted)",
              lineHeight: 1.4,
              marginBottom: "8px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.description}
          </div>
        </Link>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            marginBottom: "8px",
          }}
        >
          {product.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                padding: "2px 8px",
                borderRadius: "999px",
                background: "var(--background)",
                border: "1px solid var(--border)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.6rem",
                color: "var(--foreground-muted)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* ── Rating + Add to cart — hiển thị MỌI LÚC trên mọi thiết bị ──
            Đã bỏ cơ chế hover-to-reveal: rating và nút luôn nằm trong card,
            không còn animation height/opacity khi hover. */}
        <div style={{ marginTop: "2px" }}>
          {/* Rating */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "10px",
            }}
          >
            <Stars value={product.rating} />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.68rem",
                color: "var(--foreground-muted)",
              }}
            >
              {product.rating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>

          {/* Add to cart button */}
          <motion.button
            type="button"
            className="card-add-btn"
            onClick={handleAddClick}
            aria-label={`Add ${product.name} to cart`}
            whileTap={{ scale: 0.97 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 30,
              mass: 0.6,
            }}
          >
            <span className="card-add-btn__icon" aria-hidden="true">
              <ShoppingBag size={15} strokeWidth={2.2} />
            </span>
            <span className="card-add-btn__label">Add to cart</span>
            <span className="card-add-btn__shine" aria-hidden="true" />
          </motion.button>
        </div>
      </div>
    </article>
  );
});
