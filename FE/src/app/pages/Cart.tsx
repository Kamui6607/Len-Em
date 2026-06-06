import { Link, useNavigate } from "react-router";
import { Trash2, Plus, Minus } from "lucide-react";
import { products } from "../data/products";
import { learnLessons } from "../../features/learn/data/learn.mock";

interface CartItem {
  productId: string;
  quantity: number;
  metadata?: {
    source?: "learn";
    lessonId?: string;
    courseId?: string;
  };
}

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function Cart({ cartItems, onUpdateQuantity, onRemoveItem }: CartProps) {
  const navigate = useNavigate();

  const cartProducts = cartItems
  .map((item) => {
    // productId may be composite "productId-variantId" from ProductDetail
    const parts = String(item.productId).split("-");
    const baseId = parts[0];
    const product = products.find(
      (p) => String(p.id) === baseId,
    );
    if (!product) return null;

    // Reconstruct the full variant id from remaining parts
    const variantId = parts.length > 1 ? parts.slice(1).join("-") : null;
    const variant =
      variantId && product.variants
        ? product.variants.find((v) => String(v.id) === variantId)
        : null;
    const selectedVariant = variant ?? product.variants?.[0] ?? null;

    return {
      ...product,
      cartId: item.productId, // preserve the original composite key for callbacks
      quantity: item.quantity,
      price: selectedVariant?.price ?? 0,
      variantName: selectedVariant?.color ?? null,
      variantHex: selectedVariant?.hexCode ?? null,
      metadata: item.metadata,
      sourceLessonName: item.metadata?.source === "learn"
        ? learnLessons.find((lesson) => lesson.id === item.metadata?.lessonId)?.title ?? null
        : null,
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
    <div className="min-h-screen bg-background py-12 px-4">
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
                  className="bg-card rounded-2xl p-6 border border-border flex gap-6"
                >
                  {/* Product Image */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
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
                      {item.sourceLessonName && (
                        <span className="mt-1 inline-flex w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          From lesson: {item.sourceLessonName}
                        </span>
                      )}
                      <button
                        onClick={() => onRemoveItem(item.cartId)}
                        className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

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
                          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                            isMinQuantity
                              ? "border-border/50 text-muted-foreground/50 cursor-not-allowed"
                              : "border-border hover:bg-muted"
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
                          className="w-8 h-8 rounded-full border border-border hover:bg-muted transition-colors flex items-center justify-center"
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
                className="w-full bg-primary text-primary-foreground py-4 rounded-full hover:bg-primary/90 transition-colors mb-3 font-medium"
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
    </div>
  );
}