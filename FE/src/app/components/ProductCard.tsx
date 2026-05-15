import { memo, useState } from "react";
import { Link } from "react-router";
import { Heart } from "lucide-react";
import type { Product } from "../data/products";
import { getBasePrice } from "../data/products";
import { useFavorites } from "../context/FavoritesContext";
import { motion } from "motion/react";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isHovered, setIsHovered] = useState(false);

  const prices = product.variants?.map((v) => v.price) ?? [getBasePrice(product)];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const hasPriceRange = minPrice !== maxPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={`/product/${product.id}`}
        className="group block bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl hover:border-primary/20 transition-all duration-300"
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          <motion.div
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Favorite button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(product.id);
            }}
            className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite(product.id)
                  ? "fill-destructive text-destructive"
                  : "text-muted-foreground"
              }`}
            />
          </motion.button>

          {/* Category badge */}
          <span className="absolute bottom-3 left-3 text-[10px] font-medium bg-white/80 backdrop-blur-sm text-foreground px-2.5 py-1 rounded-full capitalize shadow-sm">
            {product.category}
          </span>
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-medium text-foreground truncate text-base leading-tight">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {product.description}
          </p>
          <div className="flex items-center justify-between pt-1.5">
            <span className="text-lg font-semibold text-primary">
              {hasPriceRange
                ? `$${minPrice.toFixed(2)} – $${maxPrice.toFixed(2)}`
                : `$${minPrice.toFixed(2)}`}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});