import { memo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, Plus, Eye, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import type { Product } from "../data/products";
import { getBasePrice } from "../data/products";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { LevelBadge } from "./LevelBadge";
import { formatPrice } from "../../lib/formatPrice";

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

// Fixed (non-random) confetti burst layout — computed once so every render
// and every hover is identical, no per-render jitter. Each piece bursts out
// from the knot at its own angle/distance/rotation, like a party popper.
const CONFETTI_PIECES = (() => {
  const defs: Array<{
    angle: number; // degrees, 0 = right, negative = up (SVG y-down)
    dist: number;
    rotate: number;
    shape: "rect" | "circle" | "strip";
    size: number;
    tone: "accent" | "color" | "gold" | "white";
    delay: number;
  }> = [
    {
      angle: -100,
      dist: 92,
      rotate: 340,
      shape: "rect",
      size: 7,
      tone: "gold",
      delay: 0,
    },
    {
      angle: -66,
      dist: 108,
      rotate: -260,
      shape: "circle",
      size: 4.5,
      tone: "white",
      delay: 0.02,
    },
    {
      angle: -34,
      dist: 96,
      rotate: 200,
      shape: "strip",
      size: 10,
      tone: "accent",
      delay: 0.01,
    },
    {
      angle: -6,
      dist: 118,
      rotate: -180,
      shape: "rect",
      size: 6,
      tone: "color",
      delay: 0.035,
    },
    {
      angle: 26,
      dist: 100,
      rotate: 300,
      shape: "circle",
      size: 5,
      tone: "gold",
      delay: 0,
    },
    {
      angle: 58,
      dist: 92,
      rotate: -240,
      shape: "strip",
      size: 9,
      tone: "white",
      delay: 0.02,
    },
    {
      angle: 96,
      dist: 86,
      rotate: 260,
      shape: "rect",
      size: 6,
      tone: "accent",
      delay: 0.045,
    },
    {
      angle: 130,
      dist: 88,
      rotate: -300,
      shape: "circle",
      size: 5,
      tone: "color",
      delay: 0.01,
    },
    {
      angle: 158,
      dist: 102,
      rotate: 220,
      shape: "rect",
      size: 7,
      tone: "gold",
      delay: 0.03,
    },
    {
      angle: -158,
      dist: 96,
      rotate: -180,
      shape: "circle",
      size: 4,
      tone: "white",
      delay: 0.02,
    },
    {
      angle: -128,
      dist: 90,
      rotate: 320,
      shape: "strip",
      size: 10,
      tone: "accent",
      delay: 0.015,
    },
    {
      angle: -200 + 180,
      dist: 108,
      rotate: -260,
      shape: "rect",
      size: 6,
      tone: "color",
      delay: 0.04,
    },
    {
      angle: 210,
      dist: 100,
      rotate: 200,
      shape: "circle",
      size: 5,
      tone: "gold",
      delay: 0.012,
    },
    {
      angle: -14,
      dist: 132,
      rotate: 260,
      shape: "rect",
      size: 6,
      tone: "white",
      delay: 0.05,
    },
  ];
  return defs.map((d) => {
    const rad = (d.angle * Math.PI) / 180;
    return { ...d, dx: Math.cos(rad) * d.dist, dy: Math.sin(rad) * d.dist };
  });
})();

// ── Animated Gift Ribbon: a clean horizontal ribbon + hanging material tag
//    at rest (matches the "wrapped" reference look), which pops apart into
//    confetti like a party popper the moment the card is hovered. ──
function AnimatedGiftRibbon({
  isHovered,
  color = "#F0C4E0",
  accent = "#6B3FA0",
  level = "Beginner",
}: {
  isHovered: boolean;
  color?: string;
  accent?: string;
  level?: string;
}) {
  const toneColor = { accent, color, gold: "#F5C94A", white: "#FFFFFF" };
  const tagFontSize = level.length > 9 ? "6" : level.length > 6 ? "6.8" : "7.5";

  return (
    <svg
      viewBox="0 0 300 400"
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2,
      }}
      aria-hidden
    >
      <defs>
        <filter
          id="unw-ribbon-shadow"
          x="-5%"
          y="-10%"
          width="110%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="4"
            floodColor="rgba(30,10,50,0.22)"
          />
        </filter>
      </defs>

      {/* ── Ribbon band (still wrapped) — a single clean horizontal strip,
          exactly like the reference: no extra boxes crossing it. It loosens
          and droops away once the bow at the center pops. ── */}
      <motion.g
        filter="url(#unw-ribbon-shadow)"
        animate={
          isHovered
            ? {
                y: 10,
                opacity: 0,
                transition: {
                  duration: 0.35,
                  delay: 0.06,
                  ease: [0.16, 1, 0.3, 1],
                },
              }
            : {
                y: 0,
                opacity: 1,
                transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
              }
        }
      >
        {/* Shadow cast by the ribbon */}
        <path
          d="M -6,156 C 80,146 180,165 306,153 L 306,170 C 180,180 80,163 -6,172 Z"
          fill="rgba(20,5,40,0.16)"
        />
        {/* Ribbon body */}
        <path
          d="M -4,148 C 80,138 180,158 304,146 L 304,166 C 180,176 80,158 -4,168 Z"
          fill={color}
          fillOpacity="0.92"
        />
        {/* Top sheen (light reflection) */}
        <path
          d="M -4,148 C 80,138 180,158 304,146 L 304,154 C 180,166 80,146 -4,156 Z"
          fill="white"
          fillOpacity="0.28"
        />
        {/* Top / bottom edge threads */}
        <path
          d="M -4,148 C 80,138 180,158 304,146"
          stroke={accent}
          strokeWidth="0.9"
          fill="none"
          strokeOpacity="0.45"
        />
        <path
          d="M -4,168 C 80,158 180,178 304,166"
          stroke={accent}
          strokeWidth="0.9"
          fill="none"
          strokeOpacity="0.45"
        />
        {/* Loose thread tail curling away on the right */}
        <path
          d="M 304,153 C 316,150 320,146 318,140 C 316,136 310,137 308,142"
          stroke={accent}
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          strokeOpacity="0.55"
        />
      </motion.g>

      {/* ── Pop flash — a quick ring crack at the knot, like the moment a
          party popper goes off. Pure light/shadow, no fill so it never
          looks like a solid blob. ── */}
      <motion.circle
        cx="150"
        cy="148"
        r="6"
        fill="none"
        stroke={accent}
        strokeWidth="2"
        initial={false}
        animate={
          isHovered
            ? {
                r: [6, 34],
                opacity: [0.65, 0],
                transition: { duration: 0.35, ease: "easeOut" },
              }
            : {
                r: 6,
                opacity: 0,
                transition: { duration: 0.15 },
              }
        }
      />

      {/* ── Popper cap — the knot itself flicks up and away first, as if it
          just cracked open, a beat before the confetti follows. ── */}
      <motion.g
        animate={
          isHovered
            ? {
                x: 6,
                y: -46,
                rotate: 70,
                opacity: 0,
                transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
              }
            : {
                x: 0,
                y: 0,
                rotate: 0,
                opacity: 1,
                transition: { duration: 0.3, delay: 0.05 },
              }
        }
        style={{ originX: 150, originY: 148 }}
      >
        <ellipse
          cx="150"
          cy="148"
          rx="7"
          ry="5"
          fill={accent}
          fillOpacity="0.85"
        />
        <ellipse
          cx="150"
          cy="148"
          rx="3"
          ry="2"
          fill={color}
          fillOpacity="0.9"
        />
      </motion.g>

      {/* ── Confetti burst ── */}
      {CONFETTI_PIECES.map((p, i) => {
        const fill = toneColor[p.tone];
        const commonAnimate = isHovered
          ? {
              x: [0, p.dx * 0.55, p.dx, p.dx * 1.05],
              y: [0, p.dy * 0.55 - 18, p.dy, p.dy + 26],
              rotate: [0, p.rotate * 0.5, p.rotate, p.rotate * 1.15],
              opacity: [0, 1, 1, 0],
              scale: [0.3, 1, 1, 0.8],
              transition: {
                duration: 0.85,
                delay: p.delay + 0.05,
                times: [0, 0.3, 0.7, 1],
                ease: [0.22, 1, 0.36, 1],
              },
            }
          : {
              x: 0,
              y: 0,
              rotate: 0,
              opacity: 0,
              scale: 0.3,
              transition: { duration: 0.15 },
            };

        if (p.shape === "circle") {
          return (
            <motion.circle
              key={i}
              cx="150"
              cy="148"
              r={p.size / 2}
              fill={fill}
              initial={false}
              animate={commonAnimate}
              style={{ originX: 150, originY: 148 }}
            />
          );
        }
        if (p.shape === "strip") {
          return (
            <motion.rect
              key={i}
              x={150 - p.size}
              y={148 - 1.4}
              width={p.size * 2}
              height="2.8"
              rx="1.4"
              fill={fill}
              initial={false}
              animate={commonAnimate}
              style={{ originX: 150, originY: 148 }}
            />
          );
        }
        return (
          <motion.rect
            key={i}
            x={150 - p.size / 2}
            y={148 - p.size / 2}
            width={p.size}
            height={p.size}
            rx="1.5"
            fill={fill}
            initial={false}
            animate={commonAnimate}
            style={{ originX: 150, originY: 148 }}
          />
        );
      })}

      {/* ── Loose ribbon end (right) — droops down instead of stretching far
          away, consistent with "the bow came undone" rather than "pulled". ── */}
      <motion.path
        d="M 310,153 C 322,150 326,146 324,140 C 322,136 316,137 314,142"
        stroke={accent}
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        strokeOpacity="0.55"
        animate={
          isHovered
            ? {
                d: "M 310,158 C 320,162 324,168 322,174 C 320,178 315,177 314,172",
                strokeOpacity: 0.4,
                transition: {
                  duration: 0.4,
                  delay: 0.08,
                  ease: [0.16, 1, 0.3, 1],
                },
              }
            : {
                d: "M 310,153 C 322,150 326,146 324,140 C 322,136 316,137 314,142",
                strokeOpacity: 0.55,
                transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
              }
        }
      />

      {/* ── Hanging material tag — the piece the reference screenshot shows
          in the resting/"wrapped" state: string + ring + tag card with the
          product's difficulty level and "Len&Em Materials". ── */}
      <motion.g
        animate={
          isHovered
            ? {
                y: 40,
                opacity: 0,
                transition: {
                  duration: 0.4,
                  delay: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                },
              }
            : {
                y: 0,
                opacity: 1,
                transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
              }
        }
      >
        <line
          x1="150"
          y1="170"
          x2="150"
          y2="192"
          stroke={accent}
          strokeWidth="0.85"
          strokeDasharray="2.5 2"
          strokeOpacity="0.65"
        />
        <circle
          cx="150"
          cy="193"
          r="4"
          fill="white"
          fillOpacity="0.92"
          stroke={accent}
          strokeWidth="0.9"
          strokeOpacity="0.6"
        />
        <circle cx="150" cy="193" r="2" fill={color} fillOpacity="0.7" />
        <rect
          x="118"
          y="197"
          width="64"
          height="32"
          rx="4"
          fill="white"
          fillOpacity="0.94"
          stroke={accent}
          strokeWidth="0.85"
          strokeOpacity="0.5"
        />
        <text
          x="150"
          y="211"
          textAnchor="middle"
          fontFamily="'Inter', sans-serif"
          fontSize={tagFontSize}
          fontWeight="700"
          letterSpacing="1"
          fill={accent}
          fillOpacity="0.9"
        >
          {level.toUpperCase()}
        </text>
        <rect
          x="128"
          y="216"
          width="44"
          height="2"
          rx="1"
          fill={color}
          fillOpacity="0.7"
        />
        <text
          x="150"
          y="226"
          textAnchor="middle"
          fontFamily="'Inter', sans-serif"
          fontSize="5.5"
          fill={accent}
          fillOpacity="0.55"
        >
          Len&amp;Em Materials
        </text>
      </motion.g>

      <motion.path
        d="M 140,172 C 126,180 120,186 118,198"
        stroke={accent}
        strokeWidth="0.9"
        fill="none"
        strokeLinecap="round"
        strokeOpacity="0.5"
        animate={
          isHovered
            ? {
                d: "M 140,178 C 128,186 122,192 120,200",
                strokeOpacity: 0.35,
                transition: {
                  duration: 0.4,
                  delay: 0.08,
                  ease: [0.16, 1, 0.3, 1],
                },
              }
            : {
                d: "M 140,172 C 126,180 120,186 118,198",
                strokeOpacity: 0.5,
                transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
              }
        }
      />
    </svg>
  );
}

// ── Ambient sparkle accents that fade in on hover (purely decorative, absolutely positioned) ──
function HoverSparkles({ isHovered }: { isHovered: boolean }) {
  const sparkles = [
    { top: "8%", left: "10%", size: 12, delay: 0 },
    { top: "18%", left: "88%", size: 9, delay: 0.08 },
    { top: "72%", left: "6%", size: 8, delay: 0.16 },
  ];
  return (
    <>
      {sparkles.map((s, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            zIndex: 4,
            pointerEvents: "none",
            color: "#fff",
            filter: "drop-shadow(0 1px 4px rgba(107,63,160,0.5))",
          }}
          initial={false}
          animate={
            isHovered
              ? {
                  opacity: [0, 1, 0],
                  scale: [0.4, 1, 0.4],
                  transition: {
                    duration: 1.4,
                    delay: s.delay,
                    repeat: Infinity,
                    repeatDelay: 0.6,
                  },
                }
              : { opacity: 0, scale: 0.4, transition: { duration: 0.2 } }
          }
        >
          <Sparkles size={s.size} strokeWidth={1.5} fill="currentColor" />
        </motion.div>
      ))}
    </>
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
  const { isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [quickViewHovered, setQuickViewHovered] = useState(false);

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
    //    scale) and a bumped `z-index`, never with width/height/margin.
    //    `transform` is purely visual and is taken out of normal document
    //    flow calculations, so the CSS Grid track this card lives in NEVER
    //    resizes — sibling cards stay exactly where they are, no empty gaps
    //    open up anywhere in the grid, no matter which card is hovered.
    // 2. `isolation: isolate` + `contain: layout` scope the raised z-index
    //    and any repaint to this card only, so a hovered card is allowed to
    //    visually overlap the space around it (as intended — it "grows" on
    //    top of the page) without ever touching another card's own box.
    // 3. The rating + "Add to cart" row further down has a fixed-height
    //    wrapper that never changes size — its content is an absolutely
    //    positioned layer that only fades/slides inside that fixed box.
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{
        opacity: 1,
        y: isHovered ? -6 : 0,
        scale: isHovered ? 1.025 : 1,
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
        boxShadow: isHovered
          ? "0 20px 60px rgba(60,40,100,0.18)"
          : "0 2px 12px rgba(60,40,100,0.06), 0 0 0 1px rgba(107,63,160,0.04)",
        border: "1px solid var(--border-light)",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
        isolation: "isolate",
        contain: "layout",
        zIndex: isHovered ? 10 : 1,
        transformOrigin: "center bottom",
        willChange: "transform",
      }}
      className={isHovered ? "dark:border-[#9B6FD6]/40" : ""}
    >
      {/* Subtle animated gradient halo behind the card, only visible on hover */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.35 }}
        style={{
          position: "absolute",
          inset: "-1px",
          borderRadius: "21px",
          padding: "1px",
          zIndex: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--accent-pink, #F0C4E0) 50%, var(--primary) 100%)",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

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
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: "100%", height: "100%" }}
          >
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                filter: isHovered
                  ? "brightness(1.04) saturate(1.05)"
                  : "brightness(0.97) saturate(0.96)",
                transition: "filter 0.4s ease",
              }}
            />
          </motion.div>

          {/* Ambient image vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--bg-vignette)",
              pointerEvents: "none",
            }}
          />

          {/* Soft glow sweep that passes over the image on hover */}
          <motion.div
            aria-hidden
            initial={false}
            animate={{
              x: isHovered ? "120%" : "-120%",
              opacity: isHovered ? 0.5 : 0,
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
                "linear-gradient(75deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
              transform: "skewX(-12deg)",
            }}
          />

          {/* Animated Gift Ribbon */}
          <AnimatedGiftRibbon
            isHovered={isHovered}
            color="var(--accent-pink)"
            accent="var(--primary)"
            level={product.difficulty}
          />

          <HoverSparkles isHovered={isHovered} />

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
              boxShadow: "0 2px 8px rgba(107,63,160,0.15)",
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

          {/* Badge */}
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
                fontSize: "0.65rem",
                fontWeight: 700,
                color: "var(--primary-foreground)",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(107,63,160,0.2)",
                zIndex: 5,
              }}
            >
              📹 Lesson
            </button>
          )}

          {/* Quick view — always mounted (never conditionally rendered) so it can
              never affect the image container's box; purely opacity/scale driven,
              which keeps it perfectly centered and legible every time it appears. */}
          <motion.button
            type="button"
            initial={false}
            animate={{
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 0.85,
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
              left: "30%",
              transform: "translateX(-50%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              padding: "9px 18px",
              minWidth: "128px",
              borderRadius: "999px",
              background: quickViewHovered
                ? isDark
                  ? ""
                  : ""
                : isDark
                  ? "var(--foreground)"
                  : "var(--bg-overlay-96)",
              backdropFilter: "blur(10px)",
              border: quickViewHovered
                ? "1.5px solid var(--primary)"
                : "1px solid rgba(255,255,255,0.6)",
              boxShadow: quickViewHovered
                ? "0 8px 20px rgba(107,63,160,0.4)"
                : "0 6px 18px rgba(58,42,77,0.22)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              zIndex: 6,
              pointerEvents: isHovered ? "auto" : "none",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.74rem",
              fontWeight: 700,
              color: quickViewHovered
                ? isDark
                  ? "var(--foreground)"
                  : "var(--primary-foreground)"
                : isDark
                  ? "#000000"
                  : "var(--foreground)",
              letterSpacing: "0.01em",
              transition:
                "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease",
            }}
          >
            <Eye
              size={14}
              strokeWidth={2}
              style={{
                color: quickViewHovered
                  ? "var(--primary-foreground)"
                  : "var(--primary)",
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
          gap: "0",
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
              background: isDark ? "var(--primary)" : "var(--accent-pink)",
              border: "1px solid var(--border)",
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.62rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--foreground)",
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
              color: isDark ? "var(--primary)" : "#F0C4E0",
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
              color: isHovered
                ? isDark
                  ? "var(--primary)"
                  : "#F0C4E0"
                : isDark
                  ? "var(--foreground)"
                  : "#000000",
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
            Compact by default (takes NO extra space) — only reveals its
            content, and only grows its own height, when THIS card is
            hovered. `AnimatePresence` + `height: "auto"` animates the
            reveal/collapse smoothly; `overflow: hidden` keeps the
            transition clean. Because the parent grid uses
            `align-items: start` (see .product-grid in Shop.tsx), this
            card growing on hover no longer stretches its row siblings —
            so there's no need to reserve fixed empty space up front. */}
        <div style={{ marginTop: isHovered ? "2px" : "0" }}>
          <AnimatePresence initial={false}>
            {isHovered && (
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