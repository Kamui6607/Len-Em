import { useState } from "react";
import { useNavigate } from "react-router";
import { QrCode, DollarSign, Check } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { products } from "../data/products";

interface CheckoutProps {
  cartItems: { productId: string; quantity: number }[];
  onClearCart: () => void;
}

export function Checkout({ cartItems, onClearCart }: CheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "cash">("bank");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { createOrder, logActivity } = useAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();

  const orderItems = cartItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      productId: item.productId,
      productName: product?.name || "Unknown",
      quantity: item.quantity,
      price: product?.variants?.[0]?.price ?? 0,
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = () => {
    if (!email && !phone) {
      toast.error("Please provide an email or phone number.");
      return;
    }

    if (orderItems.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    const orderId = createOrder({
      userId: user?.email || "guest",
      userName: user?.name || "Guest",
      userEmail: email || user?.email || "guest@example.com",
      items: orderItems,
      total,
      paymentMethod,
      paymentStatus: "pending",
    });

    logActivity({
      type: "purchase",
      userId: user?.email || "guest",
      userName: user?.name || "Guest",
      description: `Order ${orderId} placed for $${total.toFixed(2)} via ${paymentMethod}`,
    });

    setShowSuccess(true);
    onClearCart();

    setTimeout(() => {
      navigate("/purchased");
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold">Order Placed!</h1>
          <p className="text-muted-foreground">
            Your order has been placed successfully. You'll be redirected to your orders shortly.
          </p>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8">Checkout</h1>

        {/* Contact Information */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0703339186"
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPaymentMethod("bank")}
              className={`p-4 rounded-xl border-2 transition-all ${
                paymentMethod === "bank"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <QrCode className="w-6 h-6 mb-2 mx-auto" />
              <p className="text-sm font-medium">Bank Transfer</p>
              <p className="text-xs text-muted-foreground">QR Code Payment</p>
            </button>
            <button
              onClick={() => setPaymentMethod("cash")}
              className={`p-4 rounded-xl border-2 transition-all ${
                paymentMethod === "cash"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <DollarSign className="w-6 h-6 mb-2 mx-auto" />
              <p className="text-sm font-medium">Cash on Delivery</p>
              <p className="text-xs text-muted-foreground">Pay when you receive</p>
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-4">
            {orderItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-border">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-lg font-semibold text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          className="w-full bg-primary text-primary-foreground py-4 rounded-full hover:bg-primary/90 transition-colors text-lg font-medium"
        >
          Place Order
        </button>
      </div>
    </div>
  );
}