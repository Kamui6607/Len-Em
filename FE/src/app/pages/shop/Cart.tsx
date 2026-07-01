// ============================================================
// Cart Page — route /cart
// Uses CartContext for state management
// ============================================================

import { Link } from "react-router";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../../../context/CartContext";
import { formatPrice } from "../../../lib/formatPrice";
import { ColorSwatch } from "../../components/ui/ColorSwatch";

export function ShopCart() {
  const { cartItems, cartKits, removeFromCart, updateQuantity, removeKitFromCart, clearCart, totalItems, totalPrice } = useCart();

  const hasItems = cartItems.length > 0 || cartKits.length > 0;

  const handleClearCart = () => {
    clearCart();
    toast.success("Đã xoá tất cả sản phẩm khỏi giỏ hàng");
  };

  if (!hasItems) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Giỏ hàng trống</h2>
          <p className="text-muted-foreground mb-6">
            Hãy thêm những sản phẩm yêu thích vào giỏ hàng nhé!
          </p>
          <Link
            to="/shop"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 transition-colors font-medium"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 pb-[calc(env(safe-area-inset-bottom)+90px)] md:pb-0">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold">Giỏ hàng ({totalItems} sản phẩm)</h1>
          <button
            onClick={handleClearCart}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-full transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Remove All
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Cart Items & Kits ── */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const lineTotal = item.price * item.quantity;
              const isMinQuantity = item.quantity <= 1;

              return (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="bg-card rounded-2xl p-3 md:p-4 border border-border flex flex-col md:flex-row gap-3 md:gap-4"
                >
                  {/* Product Image */}
                  <div className="w-full md:w-20 h-24 md:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = "true";
                          target.src = `https://picsum.photos/seed/${item.productId}/200/200`;
                        }
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* Header row: name + remove button */}
                    <div className="flex justify-between gap-3 mb-1">
                      <Link
                        to={`/shop/product/${item.productId}`}
                        className="hover:text-primary transition-colors truncate"
                      >
                        <h4 className="font-medium truncate text-sm md:text-base">{item.name}</h4>
                      </Link>
                      <button
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                        className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Color swatch */}
                    <div className="flex items-center gap-2 mb-1">
                      <ColorSwatch
                        hexCode={item.hexCode}
                        colorName={item.color}
                        size="sm"
                      />
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {item.color}
                      </span>
                    </div>

                    {/* Bottom row: quantity controls + line total */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity - 1)
                          }
                          disabled={isMinQuantity}
                          aria-label="Giảm số lượng"
                          className={`w-9 h-9 md:w-8 md:h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${
                            isMinQuantity
                              ? "border-border/50 text-muted-foreground/50 cursor-not-allowed"
                              : "border-border hover:bg-muted hover:shadow-sm active:scale-90"
                          }`}
                        >
                          <Minus className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                        <span className="w-6 text-center font-medium text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock}
                          aria-label="Tăng số lượng"
                          className={`w-9 h-9 md:w-8 md:h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${
                            item.quantity >= item.stock
                              ? "border-border/50 text-muted-foreground/50 cursor-not-allowed"
                              : "border-border hover:bg-muted hover:shadow-sm active:scale-90"
                          }`}
                        >
                          <Plus className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>

                      <p className="font-semibold text-primary text-sm md:text-base">
                        {formatPrice(lineTotal)}
                      </p>
                    </div>

                    {/* Stock warning */}
                    {item.quantity >= item.stock && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Đã đạt số lượng tối đa (còn {item.stock} sản phẩm)
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Cart Kits */}
            {cartKits.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Combo Kits</h2>
                <div className="space-y-4">
                  {cartKits.map((kit) => (
                    <div
                      key={kit.kitId}
                      className="bg-card rounded-2xl p-3 md:p-4 border border-border flex flex-col md:flex-row gap-3 md:gap-4"
                    >
                      {/* Kit Image */}
                      <div className="w-full md:w-20 h-24 md:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={kit.thumbnail}
                          alt={kit.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = "true";
                              target.src = `https://picsum.photos/seed/${kit.kitId}/200/200`;
                            }
                          }}
                        />
                      </div>

                      {/* Kit Details */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        {/* Header row: name + remove button */}
                        <div className="flex justify-between gap-3 mb-1">
                          <Link
                            to={`/kits/${kit.kitId}`}
                            className="hover:text-primary transition-colors truncate"
                          >
                            <h4 className="font-medium truncate text-sm md:text-base">{kit.name}</h4>
                          </Link>
                          <button
                            onClick={() => removeKitFromCart(kit.kitId)}
                            className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Xóa combo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs md:text-sm text-muted-foreground mb-2">
                          {kit.productCount} sản phẩm trong combo
                        </p>

                        {/* Bottom row: quantity controls + line total */}
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeKitFromCart(kit.kitId)}
                              className="w-9 h-9 md:w-8 md:h-8 rounded-full border border-border hover:bg-muted hover:shadow-sm active:scale-90 flex items-center justify-center transition-all duration-200"
                              aria-label="Giảm số lượng"
                            >
                              <Minus className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                            <span className="w-6 text-center font-medium text-sm">
                              1
                            </span>
                            <button
                              onClick={() => {
                                // Kit quantity is always 1, so we don't allow increasing
                              }}
                              disabled={true}
                              aria-label="Tăng số lượng"
                              className="w-9 h-9 md:w-8 md:h-8 rounded-full border border-border/50 text-muted-foreground/50 cursor-not-allowed flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                          </div>

                          <p className="font-semibold text-primary text-sm md:text-base">
                            {formatPrice(kit.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Order Summary Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
              <h3 className="text-lg font-semibold mb-6">Tạm tính</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tổng số lượng</span>
                  <span>{totalItems}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tạm tính</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="pt-3 border-t border-border flex justify-between font-semibold text-lg">
                  <span>Tổng tiền</span>
                  <span className="text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <Link
                to="/order"
                className="block w-full text-center bg-primary text-primary-foreground py-4 rounded-full hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 mb-3 font-medium"
              >
                Tiến hành đặt hàng
              </Link>

              <Link
                to="/shop"
                className="block text-center text-primary hover:underline text-sm"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}