import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "../context/FavoritesContext";
import { useCart } from "../../context/CartContext";
import { products as mockProducts } from "../data/products";
import { fetchProductById } from "../../features/shop/services/product.service";
import { ProductCard } from "../components/ProductCard";
import { kitService } from "../../api/kitService";
import { cn } from "../components/ui/utils";
import { formatPrice } from "../../lib/formatPrice";
import type { Product } from "../data/products";
import type { Kit } from "../../api/kitService";

export function Love() {
  const { addToCart, addKitToCart } = useCart();
  const { favorites, favoriteKits, toggleFavoriteKit, clearAllFavorites } = useFavorites();
  const [resolvedProducts, setResolvedProducts] = useState<Product[]>([]);
  const [resolvedKits, setResolvedKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  useEffect(() => {
    async function resolveFavorites() {
      setLoading(true);
      const productResults: Product[] = [];
      for (const favId of favorites) {
        // Try mock data first
        const mock = mockProducts.find((p) => p.id === favId);
        if (mock) {
          productResults.push(mock);
          continue;
        }
        // Fallback to API
        try {
          const apiProduct = await fetchProductById(favId);
          if (apiProduct) {
            productResults.push(apiProduct);
          }
        } catch {
          // Skip products that can't be loaded
        }
      }
      setResolvedProducts(productResults);

      // Fetch favorite kits
      const kitResults: Kit[] = [];
      console.log("Favorite kits IDs:", favoriteKits);
      for (const kitId of favoriteKits) {
        try {
          const res = await kitService.getById(kitId);
          console.log("Kit response for", kitId, ":", res.data);
          if (res.data.data?.kit) {
            kitResults.push(res.data.data.kit);
          }
        } catch (error) {
          console.error("Error fetching kit", kitId, ":", error);
          // Skip kits that can't be loaded
        }
      }
      console.log("Resolved kits:", kitResults);
      setResolvedKits(kitResults);
      setLoading(false);
    }
    resolveFavorites();
  }, [favorites, favoriteKits]);

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
    resolvedProducts.forEach((product) => {
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
    });
    toast.success(`Added all ${resolvedProducts.length} items to cart`);
  };

  const handleRemoveAll = () => {
    clearAllFavorites();
    toast.success("Đã xoá tất cả khỏi danh sách yêu thích");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (resolvedProducts.length === 0 && resolvedKits.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="mb-3">Your Wishlist is Empty</h2>
          <p className="text-muted-foreground mb-6">
            Start adding products and kits you love by clicking the heart icon!
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-primary fill-primary" />
              <h1>My Wishlist</h1>
            </div>
            <button
              onClick={handleRemoveAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-full transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove All
            </button>
          </div>
          <p className="text-muted-foreground">
            {resolvedProducts.length + resolvedKits.length} {resolvedProducts.length + resolvedKits.length === 1 ? "item" : "items"} saved for later
          </p>
        </div>

        {/* Products Section */}
        {resolvedProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Products</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {resolvedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Kits Section */}
        {resolvedKits.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Combos</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {resolvedKits.map((kit) => (
                <div
                  key={kit._id}
                  className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <Link to={`/kits/${kit._id}`} className="block relative">
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={kit.thumbnail}
                        alt={kit.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallback) {
                            target.dataset.fallback = "true";
                            target.src = `https://picsum.photos/seed/${kit._id}/400/300`;
                          }
                        }}
                      />
                    </div>
                    {/* Heart button overlay */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavoriteKit(kit._id);
                        toast.success(
                          favoriteKits.includes(kit._id)
                            ? "Đã xoá khỏi danh sách yêu thích"
                            : "Đã thêm vào danh sách yêu thích"
                        );
                      }}
                      className="absolute top-3 right-3 w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors shadow-sm"
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
                          favoriteKits.includes(kit._id)
                            ? "fill-destructive text-destructive"
                            : "text-muted-foreground hover:text-destructive"
                        )}
                      />
                    </button>
                  </Link>
                  <div className="p-4 space-y-2">
                    <Link to={`/kits/${kit._id}`}>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {kit.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {kit.description}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(kit.price)}
                      </span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">
                        {kit.level}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {kit.productIds.length} products included
                    </p>
                    {/* Add to cart button */}
                    <button
                      onClick={() => {
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
                      }}
                      className="add-to-cart-btn mt-3"
                    >
                      <div className="btn-text">
                        <ShoppingCart className="w-4 h-4" />
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile sticky bottom bar ── */}
      {!scrolledToBottom && (
        <div className="fixed bottom-[66px] left-0 right-0 z-40 bg-background/90 backdrop-blur-xl px-4 py-4 md:hidden safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Wishlist:</p>
              <p className="text-base font-bold text-primary">{resolvedProducts.length} items</p>
            </div>
             <button
               onClick={addAllToCart}
               className="add-to-cart-btn"
             >
               <div className="btn-text">
                 <ShoppingCart className="size-4" />
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
        </div>
      )}
    </div>
  );
}