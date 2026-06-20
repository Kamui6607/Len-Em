import { memo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import type { Product } from "../data/products";
import { getBasePrice } from "../data/products";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "./ui/button";
import { LevelBadge } from "./LevelBadge";
import { formatPrice } from "../../lib/formatPrice";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  relatedLessonId?: string;
  relatedCourseId?: string;
}

export const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
  relatedLessonId,
  relatedCourseId,
}: ProductCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const prices = product.variants?.map((variant) => variant.price) ?? [getBasePrice(product)];
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
    requireAuth(() => onAddToCart?.(product.id));
  };

  const handleProductClick = (event: React.MouseEvent) => {
    if (!isAuthenticated) {
      event.preventDefault();
      navigate("/auth/login");
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="card-hover group overflow-hidden"
    >
      <Link to={`/shop/product/${product.id}`} className="block" onClick={handleProductClick}>
        <div className="relative aspect-square overflow-hidden bg-[var(--color-bg)]">
          <motion.div
            animate={{ scale: isHovered ? 1.07 : 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="h-full w-full"
          >
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          </motion.div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={(event) => {
              event.preventDefault();
              toggleFavorite(product.id);
            }}
            className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-card)_88%,transparent)] text-[var(--color-text-muted)] shadow-sm backdrop-blur-md transition-colors hover:text-[var(--color-primary)]"
            aria-label={isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={
                isFavorite(product.id)
                  ? "size-5 fill-[var(--color-primary)] text-[var(--color-primary)]"
                  : "size-5"
              }
            />
          </motion.button>

          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <LevelBadge level={product.difficulty} />
            <span className="rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-card)_88%,transparent)] px-3 py-1 text-xs font-bold capitalize text-[var(--color-text)] shadow-sm backdrop-blur-md">
              {product.category}
            </span>
            {relatedLessonId && relatedCourseId && (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  navigate(`/learn/${relatedCourseId}/lesson/${relatedLessonId}`);
                }}
                className="rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-bold text-white shadow-sm transition-transform hover:scale-[1.02]"
              >
                📹 In a lesson
              </button>
            )}
          </div>
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <Link to={`/shop/product/${product.id}`} className="block" onClick={handleProductClick}>
          <h3 className="truncate text-base font-bold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {product.description}
          </p>
        </Link>

        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="font-heading text-xl font-bold text-[var(--color-primary)]">
            {formattedPrice}
          </span>
          <Button
            type="button"
            size="sm"
            onClick={handleAddClick}
            className="rounded-full bg-[var(--color-primary)] px-4 font-bold text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-[var(--color-primary-light)]"
            disabled={!onAddToCart}
          >
            <ShoppingCart className="size-4" />
            Add
          </Button>
        </div>
      </div>
    </motion.article>
  );
});