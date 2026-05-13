import { useState, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Heart, ShoppingCart, Package, Check, AlertCircle, Star, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { products, getTotalStock } from "../data/products";
import { ProductVariantSelector } from "../components/ProductVariantSelector";
import { ColorSwatch } from "../components/ColorSwatch";
import { cn } from "../components/ui/utils";
import type { ProductVariantUI } from "../components/ProductVariantSelector";

interface ProductDetailProps {
  onAddToCart: (productId: string) => void;
}

const difficultyBadgeColors: Record<string, string> = {
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
                : "fill-muted text-muted-foreground"
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

export function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find((p) => p.id === id);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariantUI | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Map product variants to the UI format
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

  // Current display data from selected variant
  const currentImage = selectedVariant?.images?.[activeImageIndex] ?? product?.image ?? "";
  const currentPrice = selectedVariant?.price ?? variantItems[0]?.price ?? 0;
  const currentStock = selectedVariant?.stock ?? 0;
  const currentColor = selectedVariant?.color;
  const totalStock = product ? getTotalStock(product) : 0;

  const handleVariantChange = useCallback((variant: ProductVariantUI) => {
    setSelectedVariant(variant);
    setActiveImageIndex(0);
  }, []);

  const handleAddToCart = () => {
    if (!product) return;
    // Pass the variant-specific identifier if available
    const cartId = selectedVariant
      ? `${product.id}-${selectedVariant.id}`
      : product.id;
    onAddToCart(cartId);
    navigate("/cart");
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const hasMultipleImages =
    selectedVariant?.images && selectedVariant.images.length > 1;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:py-12">
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
          {/* Left Column — Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden bg-muted relative group">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Favorite button overlay */}
              <button
                title="Toggle favorite"
                className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
              >
                <Heart className="w-5 h-5 text-muted-foreground hover:text-destructive transition-colors" />
              </button>
              {/* Color indicator on image */}
              {currentColor && selectedVariant?.hexCode && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs shadow-sm">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedVariant.hexCode }}
                  />
                  {currentColor}
                </div>
              )}
            </div>

            {/* Thumbnail gallery */}
            {hasMultipleImages && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {selectedVariant?.images?.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                      activeImageIndex === idx
                        ? "border-primary"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column — Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl mb-1">{product.name}</h1>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full capitalize">
                      {product.category}
                    </span>
                    {product.difficulty && (
                      <span
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full capitalize",
                          difficultyBadgeColors[product.difficulty]
                        )}
                      >
                        {product.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <StarRating rating={product.rating} count={product.reviewCount} />

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  ${currentPrice.toFixed(2)}
                </span>
                {selectedVariant &&
                  variantItems.length > 1 &&
                  selectedVariant.price !== variantItems[0].price && (
                    <span className="text-lg text-muted-foreground line-through">
                      ${variantItems[0].price.toFixed(2)}
                    </span>
                  )}
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {/* Variant Selector */}
            {variantItems.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <ProductVariantSelector
                  variants={variantItems}
                  onVariantChange={handleVariantChange}
                />

                {/* Stock indicator */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Availability</span>
                    <span
                      className={cn(
                        "font-medium flex items-center gap-1.5",
                        currentStock > 10
                          ? "text-green-600 dark:text-green-400"
                          : currentStock > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-destructive"
                      )}
                    >
                      {currentStock > 10 ? (
                        <>
                          <Check className="w-4 h-4" /> In Stock
                        </>
                      ) : currentStock > 0 ? (
                        <>
                          <AlertCircle className="w-4 h-4" /> Only {currentStock} left
                        </>
                      ) : (
                        <>
                          <Package className="w-4 h-4" /> Sold Out
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalStock} units total across all variants
                  </p>
                </div>
              </div>
            )}

            {/* Yarn-specific details */}
            {product.category === "yarn" && (
              <div className="space-y-3 p-5 bg-muted/50 rounded-2xl border border-border/50">
                <h3 className="text-sm font-medium">Yarn Specifications</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {product.material && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">Material</span>
                      <p className="font-medium">{product.material}</p>
                    </div>
                  )}
                  {product.weight && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">Weight</span>
                      <p className="font-medium">{product.weight}</p>
                    </div>
                  )}
                  {product.yardage && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">Yardage</span>
                      <p className="font-medium">{product.yardage} yards</p>
                    </div>
                  )}
                  {product.difficulty && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs">Skill Level</span>
                      <p className="font-medium capitalize">{product.difficulty}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Kit-specific details */}
            {product.category === "kit" && (
              <div className="space-y-3 p-5 bg-muted/50 rounded-2xl border border-border/50">
                <h3 className="text-sm font-medium">Kit Details</h3>
                {product.difficulty && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Difficulty:</span>
                    <span
                      className={cn(
                        "px-3 py-0.5 rounded-full text-xs font-medium",
                        difficultyBadgeColors[product.difficulty]
                      )}
                    >
                      {product.difficulty.charAt(0).toUpperCase() + product.difficulty.slice(1)}
                    </span>
                  </div>
                )}
                {product.estimatedTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Estimated time:</span>
                    <span className="font-medium">{product.estimatedTime}</span>
                  </div>
                )}
                {product.materials && product.materials.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">What's included:</span>
                    <ul className="space-y-1.5">
                      {product.materials.map((material, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{material}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* All variants color preview */}
            {variantItems.length > 1 && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">
                  All variants ({variantItems.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {variantItems.map((v) => (
                    <ColorSwatch
                      key={v.id}
                      color={v.color || "Default"}
                      hexCode={v.hexCode || "#ccc"}
                      isSelected={selectedVariant?.id === v.id}
                      size="sm"
                      onClick={() => handleVariantChange(v)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={currentStock === 0}
                className={cn(
                  "w-full py-4 rounded-full flex items-center justify-center gap-2 text-base font-medium transition-all",
                  currentStock > 0
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <ShoppingCart className="w-5 h-5" />
                {currentStock > 0 ? "Add to Cart" : "Sold Out"}
              </button>
              <button className="w-full bg-card text-foreground py-4 rounded-full border border-border hover:bg-muted transition-colors flex items-center justify-center gap-2">
                <Heart className="w-5 h-5" />
                Add to Wishlist
              </button>
            </div>

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

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-xl mb-6">You Might Also Like</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products
              .filter((p) => p.id !== product.id && p.category === product.category)
              .slice(0, 4)
              .map((related) => {
                const relPrice = related.variants?.[0]?.price ?? 0;
                return (
                  <Link
                    key={related.id}
                    to={`/product/${related.id}`}
                    className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all hover:border-primary/20"
                  >
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img
                        src={related.image}
                        alt={related.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="line-clamp-1 text-sm">{related.name}</h4>
                      <p className="text-primary font-semibold mt-1.5">
                        ${relPrice.toFixed(2)}
                      </p>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}