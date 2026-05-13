import { Link } from "react-router";
import { Heart } from "lucide-react";
import type { Product } from "../data/products";
import { useFavorites } from "../context/FavoritesContext";
import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        to={`/product/${product.id}`}
        className="group block bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-300"
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(product.id);
            }}
            className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite(product.id)
                  ? "fill-destructive text-destructive"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-medium text-foreground truncate">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-lg font-semibold text-primary">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {product.category}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}