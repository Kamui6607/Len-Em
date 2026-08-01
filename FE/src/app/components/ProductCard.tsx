import { memo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, Plus, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import type { Product } from "../data/products";
import { getBasePrice } from "../data/products";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { LevelBadge } from "./LevelBadge";
import { formatPrice } from "../../lib/formatPrice";
import { ResponsiveImage } from "../../components/ui/ResponsiveImage";

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
            fill={s <= Math.round(value) ? "var(--rating-star)" : "var(--border)"}
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
  const [isHovered, setIsHovered] = useState(false);
  const [quickViewHovered, setQuickViewHovered] = useState(false);

  // Thiết bị có chuột thật (desktop) mới dùng cơ chế hover-to-reveal.
  // Trên mobile/tablet cảm ứng, luôn hiện sẵn phần Add to cart + rating
  // vì không có sự kiện hover nào từng xảy ra.
  const supportsHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const showReveal = supportsHover ? isHovered : true;

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
    // 1. The lift/scale effect below is done with `transform` (translateY +
    //    scale) and a bumped `z-index`, never with width/height/margin, so
    //    the CSS Grid track this card lives in never resizes.
    // 2. `isolation: isolate` + `contain: layout` scope the raised z-index
    //    and repaint to this card only.
    // 3. The rating + "Add to cart" row has a height-animated wrapper that
    //    only affects this card's own box (grid uses align-items: start).
    <motion.article
      initial={{ opacity: 1, y: 0 }}
      animate={{
        opacity: 1,
        y: isHovered ? -6 : 0,
        scale: isHovered ? 1.02 : 1,
      }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setQuickViewHovered(false);
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--card)",
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: isHovered ? "var(--shadow-card-hover)" : "var(--shadow-card)",
        transition: "box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
        isolation: "isolate",
        contain: "layout",
        zIndex: isHovered ? 10 : 1,
        transformOrigin: "center bottom",
        willChange: "transform",
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
          <motion.div
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
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
          </motion.div>

          {/* Ambient image vignette — subtle, keeps top badges legible */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--bg-vignette)",
              pointerEvents: "none",
            }}
          />

          {/* Single soft glow sweep on hover — the one decorative flourish we keep */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0, x: "-120%" }}
            animate={{
              x: isHovered ? "120%" : "-120%",
              opacity: isHovered ? 0.35 : 0,
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "45%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 1,
              background:
                "linear-gradient(75deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
              transform: "skewX(-12deg)",
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

          {/* Quick view — always mounted, opacity/scale driven only */}
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{
              opacity: showReveal ? 1 : 0,
              scale: showReveal ? 1 : 0.85,
            }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={() => setQuickViewHovered(true)}
            onMouseLeave={() => setQuickViewHovered(false)}
            onClick={(event) => {
              event.preventDefault();
              navigate(`/shop/product/${product.id}`);
            }}
            style={{
              position: "absolute",
              bottom: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              padding: "9px 18px",
              minWidth: "128px",
              borderRadius: "999px",
              background: quickViewHovered ? "var(--primary)" : "var(--bg-overlay-92)",
              backdropFilter: "blur(10px)",
              border: quickViewHovered
                ? "1.5px solid var(--primary)"
                : "1px solid var(--border)",
              boxShadow: quickViewHovered
                ? "0 8px 22px var(--glow-primary)"
                : "var(--shadow-sm)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              zIndex: 6,
              pointerEvents: showReveal ? "auto" : "none",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.74rem",
              fontWeight: 700,
              color: quickViewHovered ? "var(--primary-foreground)" : "var(--foreground)",
              letterSpacing: "0.01em",
              transition: "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease",
            }}
          >
            <Eye
              size={14}
              strokeWidth={2}
              style={{
                color: quickViewHovered ? "var(--primary-foreground)" : "var(--primary)",
                flexShrink: 0,
                transition: "color 0.2s ease",
              }}
            />
            <span>Quick view</span>
          </motion.button>
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

          <motion.div
            animate={{ scale: isHovered ? 1.06 : 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "var(--primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              transformOrigin: "right center",
            }}
          >
            {formattedPrice}
          </motion.div>
        </div>

        <Link
          to={`/shop/product/${product.id}`}
          className="block"
          onClick={handleProductClick}
        >
          {/* Product name */}
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.05rem",
              fontWeight: 600,
              color: isHovered ? "var(--primary)" : "var(--foreground)",
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
              marginBottom: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              transition: "color 0.25s ease",
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

        {/* ── Rating + Add to cart zone ──
            Compact by default — only reveals content (and only grows its own
            height) when THIS card is hovered/touched. Because the parent
            grid uses align-items: start, this never disturbs sibling rows. */}
        <div style={{ marginTop: showReveal ? "2px" : "0" }}>
          <AnimatePresence initial={false}>
            {showReveal && (
              <motion.div
                key="reveal"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ paddingTop: "2px" }}>
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
                  <button
                    type="button"
                    className="add-to-cart-btn"
                    onClick={handleAddClick}
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <div className="btn-text">
                      <Plus size={14} strokeWidth={2.5} />
                      Add to cart
                    </div>
                    <div className="btn-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
});