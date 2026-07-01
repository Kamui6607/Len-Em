// ============================================================
// Kit Detail Page — route /kits/:id
// Fetches kit data from GET /api/v1/kits/{id}
// ============================================================

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, ShoppingCart, Package, Star, Truck, ShieldCheck, RotateCcw, Heart, X } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../../lib/formatPrice";
import { kitService, type Kit } from "../../api/kitService";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { cn } from "../components/ui/utils";
import { motion, AnimatePresence } from "motion/react";

const levelBadgeColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
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
                : "fill-muted-foreground/20 text-muted-foreground/30"
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

export function KitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addKitToCart } = useCart();
  const { isFavoriteKit, toggleFavoriteKit } = useFavorites();
  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllProducts, setShowAllProducts] = useState(false);

  const isKitFavorite = kit ? isFavoriteKit(kit._id) : false;

  const handleToggleFavorite = () => {
    if (!kit) return;
    toggleFavoriteKit(kit._id);
    toast.success(isKitFavorite ? "Đã xoá khỏi danh sách yêu thích" : "Đã thêm vào danh sách yêu thích");
  };

  useEffect(() => {
    if (!id) return;
    kitService.getById(id)
      .then((res) => setKit(res.data.data?.kit ?? null))
      .catch(() => {
        toast.error("Không thể tải thông tin kit");
        setKit(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddAllToCart = () => {
    if (!kit || !isAuthenticated) {
      if (!isAuthenticated) navigate("/auth/login");
      return;
    }

    const products = kit.productIds.map((product) => {
      const variant = product.variants[0];
      return {
        productId: product._id,
        variantId: variant?._id || "",
        name: product.name,
        image: variant?.image || product.image,
        price: variant?.price || 0,
      };
    });

    addKitToCart({
      kitId: kit._id,
      name: kit.name,
      thumbnail: kit.thumbnail,
      price: kit.price,
      products,
    });

    toast.success(`Đã thêm combo "${kit.name}" vào giỏ hàng`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-3">Không tìm thấy kit</h2>
          <p className="text-muted-foreground mb-6">Kit không tồn tại hoặc đã bị xoá.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại shop
          </Link>
        </div>
      </div>
    );
  }

  const displayedProducts = kit.productIds.slice(0, 3);
  const remainingCount = kit.productIds.length - 3;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:py-12 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column — Image */}
          <div className="space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden bg-muted relative group">
              <img
                src={kit.thumbnail}
                alt={kit.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = "true";
                    target.src = `https://picsum.photos/seed/${kit._id}/800/800`;
                  }
                }}
              />
              {/* Favorite button overlay */}
              <button
                type="button"
                title={isKitFavorite ? "Remove from favorites" : "Add to favorites"}
                onClick={handleToggleFavorite}
                className="absolute top-4 right-4 w-11 h-11 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors shadow-sm"
                style={{
                  background: "var(--card)",
                  opacity: 0.9,
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Heart
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isKitFavorite
                      ? "fill-destructive text-destructive"
                      : "text-muted-foreground hover:text-destructive"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Right Column — Kit Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl mb-1">{kit.name}</h1>
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full capitalize",
                        levelBadgeColors[kit.level]
                      )}
                    >
                      {kit.level}
                    </span>
                  </div>
                </div>
              </div>

              <StarRating rating={4.5} count={128} />

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(kit.price)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({kit.productIds.length} products)
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">
              {kit.description}
            </p>

            {/* Kit Details */}
            <div
              className="space-y-3 p-5 rounded-2xl"
              style={{
                background: "color-mix(in srgb, var(--muted) 50%, transparent)",
                border: "1px solid var(--border)",
              }}
            >
              <h3 className="text-sm font-medium">Kit Details</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Difficulty:</span>
                <span
                  className={cn(
                    "px-3 py-0.5 rounded-full text-xs font-medium capitalize",
                    levelBadgeColors[kit.level]
                  )}
                >
                  {kit.level}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Products included:</span>
                <span className="font-medium">{kit.productIds.length} items</span>
              </div>
            </div>

            {/* Products in Kit */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Products in this kit
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displayedProducts.map((product, index) => {
                  const isLastVisible = index === 2 && remainingCount > 0;
                  
                  return (
                    <div key={product._id} className="relative">
                      <Link
                        to={`/shop/product/${product._id}`}
                        className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all block"
                      >
                        <div className="aspect-square overflow-hidden bg-muted">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.fallback) {
                                target.dataset.fallback = "true";
                                target.src = `https://picsum.photos/seed/${product._id}/300/300`;
                              }
                            }}
                          />
                        </div>
                        <div className="p-3">
                          <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                      </Link>
                      
                      {/* +N Overlay */}
                      {isLastVisible && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setShowAllProducts(true);
                          }}
                          className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
                        >
                          <div className="text-center text-white">
                            <div className="text-3xl font-bold">+{remainingCount}</div>
                            <div className="text-xs mt-1">View all</div>
                          </div>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add All to Cart Button */}
            <button
              onClick={handleAddAllToCart}
              className="w-full bg-primary text-primary-foreground py-4 rounded-full hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-lg font-medium flex items-center justify-center gap-2"
              style={{
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <ShoppingCart className="w-5 h-5" />
              Add  to Cart
            </button>

            {/* Trust badges */}
            <div className="pt-4 border-t border-border grid grid-cols-3 gap-4">
              <div className="text-center">
                <Truck className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Free shipping over $50</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">30-day returns</p>
              </div>
              <div className="text-center">
                <ShieldCheck className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Secure checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Products Modal */}
      <AnimatePresence>
        {showAllProducts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAllProducts(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-3xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-2xl font-bold">All Products in Kit</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {kit.productIds.length} items total
                  </p>
                </div>
                <button
                  onClick={() => setShowAllProducts(false)}
                  className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {kit.productIds.map((product) => (
                    <Link
                      key={product._id}
                      to={`/shop/product/${product._id}`}
                      onClick={() => setShowAllProducts(false)}
                      className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                      <div className="aspect-square overflow-hidden bg-muted">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = "true";
                              target.src = `https://picsum.photos/seed/${product._id}/300/300`;
                            }
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}