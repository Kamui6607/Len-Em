import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "../context/FavoritesContext";
import { products } from "../data/products";
import { ProductCard } from "../components/ProductCard";

interface LoveProps {
  onAddToCart?: (productId: string) => void;
}

export function Love({ onAddToCart }: LoveProps) {
  const { favorites } = useFavorites();
  const favoriteProducts = products.filter((p) => favorites.includes(p.id));
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

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

  const addAllToCart = () => {
    if (!onAddToCart) return;
    favoriteProducts.forEach((product) => onAddToCart(product.id));
    toast.success(`Added all ${favoriteProducts.length} items to cart`);
  };

  if (favoriteProducts.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="mb-3">Your Wishlist is Empty</h2>
          <p className="text-muted-foreground mb-6">
            Start adding products you love by clicking the heart icon on any product!
          </p>
          <Link
            to="/shop"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 pb-[calc(env(safe-area-inset-bottom)+130px)] md:pb-0">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-primary fill-primary" />
            <h1>My Wishlist</h1>
          </div>
          <p className="text-muted-foreground">
            {favoriteProducts.length} {favoriteProducts.length === 1 ? "item" : "items"} saved for later
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
          ))}
        </div>
      </div>

      {/* ── Mobile sticky bottom bar ── */}
      {!scrolledToBottom && onAddToCart && (
        <div className="fixed bottom-[66px] left-0 right-0 z-40 bg-background/90 backdrop-blur-xl px-4 py-4 md:hidden safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Wishlist:</p>
              <p className="text-base font-bold text-primary">{favoriteProducts.length} items</p>
            </div>
            <button
              onClick={addAllToCart}
              className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-lg active:scale-[0.97] transition-all duration-200 shadow-sm"
            >
              <ShoppingCart className="size-4" />
              Add all to cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
