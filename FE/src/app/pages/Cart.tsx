import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Trash2, Plus, Minus } from "lucide-react";
import { products } from "../data/products";
import { formatPrice } from "../../lib/formatPrice";
import { useCart } from "../../context/CartContext";

export function Cart() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const onUpdateQuantity = (productId: string, quantity: number) => {
    const item = cartItems.find(i => i.productId === productId);
    if (item) {
      updateQuantity(productId, item.variantId, quantity);
    }
  };
  const onRemoveItem = (productId: string) => {
    const item = cartItems.find(i => i.productId === productId);
    if (item) {
      removeFromCart(productId, item.variantId);
    }
  };
  const navigate = useNavigate();
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

  const cartProducts = cartItems
  .map((item) => {
    // productId is either a simple product ID or "productId-variantId" from ProductDetail
    const idStr = String(item.productId);
    
    // Check if it's a composite ID (productId-variantId)
    // We know variant IDs contain dots but not dashes, product IDs contain dashes
    // Simple approach: try matching exact, then try composite matching
    let product = products.find((p) => String(p.id) === idStr);
    let variantId: string | null = null;
    
    if (!product) {
      // Try composite ID pattern: find the product by checking prefix
      // Example: "yarn-cotton-blush-cotton-blush" → product "yarn-cotton-blush", variant "cotton-blush"
      for (const p of products) {
        if (idStr.startsWith(p.id + "-")) {
          product = p;
          variantId = idStr.slice(p.id.length + 1);
          break;
        }
      }
    }
    
    if (!product) return null;

    const variant =
      variantId && product.variants
        ? product.variants.find((v) => String(v.id) === variantId)
        : null;
    const selectedVariant = variant ?? product.variants?.[0] ?? null;

    return {
      ...product,
      cartId: item.productId,
      quantity: item.quantity,
      price: selectedVariant?.price ?? 0,
      variantName: selectedVariant?.color ?? null,
      variantHex: selectedVariant?.hexCode ?? null,
      metadata: undefined,
      sourceLessonName: null,
    };
  })
  .filter((item): item is NonNullable<typeof item> => item !== null);

  const total = cartProducts.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const subtotal = total;

  if (cartProducts.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">🧺</span>
          </div>
          <h2 className="mb-3">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-6">
            Time to fill it with some cozy supplies!
          </p>
          <Link
            to="/shop"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      <div className="max-w-6xl mx-auto">
        <h1 className="mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Cart Items ── */}
          <div className="lg:col-span-2 space-y-4">
            {cartProducts.map((item) => {
              const lineTotal = item.price * item.quantity;
              const isMinQuantity = item.quantity <= 1;

              return (
                <div
                  key={item.id}
                  className="bg-card rounded-2xl p-4 md:p-6 border border-border flex flex-col md:flex-row gap-4 md:gap-6"
                >
                  {/* Product Image */}
                  <div className="w-full md:w-24 h-32 md:h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = "true";
                          target.src = `https://picsum.photos/seed/${item.id}/200/200`;
                        }
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* Header row: name + remove button */}
                    <div className="flex justify-between gap-4 mb-1">
                      <Link
                        to={`/product/${item.id}`}
                        className="hover:text-primary transition-colors truncate"
                      >
                        <h4 className="truncate">{item.name}</h4>
                      </Link>
                      <button
                        onClick={() => onRemoveItem(item.cartId)}
                        className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Source lesson badge */}
                    {item.sourceLessonName && (
                      <span className="mb-2 inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        From lesson: {item.sourceLessonName}
                      </span>
                    )}

                    {/* Variant info */}
                    {item.variantName && (
                      <div className="flex items-center gap-2 mb-2">
                        {item.variantHex && (
                          <span
                            className="inline-block w-3.5 h-3.5 rounded-full border border-border"
                            style={{ backgroundColor: item.variantHex }}
                          />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {item.variantName}
                        </span>
                      </div>
                    )}

                    {/* Unit price */}
                    <p className="text-sm text-muted-foreground mb-3">
                      Unit price: {formatPrice(item.price)}
                    </p>

                    {/* Bottom row: quantity controls + line total */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.cartId, item.quantity - 1)
                          }
                          disabled={isMinQuantity}
                          aria-label="Decrease quantity"
                          className={`w-11 h-11 md:w-8 md:h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${
                            isMinQuantity
                              ? "border-border/50 text-muted-foreground/50 cursor-not-allowed"
                              : "border-border hover:bg-muted hover:shadow-sm active:scale-90"
                          }`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.cartId, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                          className="w-11 h-11 md:w-8 md:h-8 rounded-full border border-border hover:bg-muted hover:shadow-sm active:scale-90 transition-all duration-200 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="font-semibold text-primary">
                        {formatPrice(lineTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Order Summary Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
              <h3 className="mb-6 text-lg font-semibold">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="pt-3 border-t border-border flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

                  <button
                    onClick={() => navigate("/checkout")}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-full hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 mb-3 font-medium"
                  >
                    Proceed to Checkout
                  </button>

              <Link
                to="/shop"
                className="block text-center text-primary hover:underline text-sm"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bottom bar ── */}
      {!scrolledToBottom && (
        <div className="fixed bottom-[66px] left-0 right-0 z-40 bg-background/90 backdrop-blur-xl px-4 py-4 md:hidden safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total:</p>
              <p className="text-base font-bold text-primary">{formatPrice(total)}</p>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-full font-semibold text-sm hover:bg-primary/90 hover:shadow-lg active:scale-[0.97] transition-all duration-200 shadow-sm"
            >
              Proceed to Checkout →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}