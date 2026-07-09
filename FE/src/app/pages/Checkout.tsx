import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Check, QrCode } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "sonner";
import { useKeyboardAvoidance } from "../../hooks/useKeyboardAvoidance";
import { products } from "../data/products";
import { formatPrice } from "../../lib/formatPrice";
import { CoinUsage } from "../components/membership/CoinUsage";
import { orderService } from "../../features/orders/services/order.service";
import { useCart } from "../../context/CartContext";
import type { CreateOrderRequest } from "../../features/orders/types/order.types";

type Payment = "bank";

const DELIVERY_FEE_PERCENT = 15;
const BANK_NAME = "Vietcombank";
const BANK_ACCOUNT = "101 123 4567";
const BANK_HOLDER = "LEN & EM CO., LTD";

export function Checkout() {
  const { cartItems, clearCart } = useCart();
  const onClearCart = clearCart;
  const [payment, setPayment] = useState<Payment | null>("bank");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  useKeyboardAvoidance();
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.fullName) setName(user.fullName);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.address) setAddress(user.address);
    }
  }, [user]);

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

  const orderItems = cartItems.map((item) => {
    const idStr = String(item.productId);
    let product = products.find((p) => String(p.id) === idStr);
    if (!product) {
      for (const p of products) {
        if (idStr.startsWith(p.id + "-")) {
          product = p;
          break;
        }
      }
    }
    return {
      productId: item.productId,
      productName: product?.name || "Unknown",
      quantity: item.quantity,
      price: product?.variants?.[0]?.price ?? 0,
    };
  });

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = (subtotal * DELIVERY_FEE_PERCENT) / 100;
  const grandTotal = subtotal + deliveryFee;

  const getPaymentMethodLabel = () => {
    if (!payment) return "";
    const labels: Record<string, string> = {
      bank: "Chuyển khoản + Giao hàng",
      cash: "COD + Giao hàng",
    };
    return labels[payment];
  };

  const handlePlaceOrder = async () => {
    if (!payment) {
      toast.error("Vui lòng chọn phương thức thanh toán.");
      return;
    }
    if (!name.trim()) {
      toast.error("Vui lòng nhập họ tên.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!email.trim()) {
      toast.error("Vui lòng nhập email.");
      return;
    }
    if (!address.trim()) {
      toast.error("Vui lòng nhập địa chỉ.");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("Giỏ hàng trống.");
      return;
    }

    try {
      const payload: CreateOrderRequest = {
        items: orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          ward: "",
          district: "",
          city: "",
        },
        paymentMethod: "VNPAY",
        shippingFee: deliveryFee,
      };
      const { data: result } = await orderService.createOrder(payload);
      onClearCart();
      if (result.payUrl) {
        window.location.href = result.payUrl;
        return;
      }
      setShowSuccess(true);
      setTimeout(() => navigate("/purchased"), 2000);
    } catch {
      toast.error("Đặt hàng thất bại. Vui lòng thử lại.");
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold">Đặt hàng thành công!</h1>
          <p className="text-muted-foreground">
            Đơn hàng của bạn đã được ghi nhận.
          </p>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 pb-[calc(env(safe-area-inset-bottom)+130px)] md:pb-0">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8">Thanh toán</h1>

        {/* Customer Info */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin giao hàng</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Họ tên *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-base"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Số điện thoại *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-base"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-base"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Địa chỉ giao hàng *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, tên đường, quận/huyện, thành phố"
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-base"
              />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPayment("bank")}
              className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${payment === "bank" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
            >
              {payment === "bank" && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
              )}
              <QrCode className="w-7 h-7 text-primary" />
              <span className="text-xs font-semibold text-center">
                Chuyển khoản +<br />
                Giao hàng
              </span>
            </button>
            {/* Cash on delivery removed - only VNPAY supported */}
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border">
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Ngân hàng: </span>
                <span className="font-medium">{BANK_NAME}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Số tài khoản: </span>
                <span className="font-medium">{BANK_ACCOUNT}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Chủ tài khoản: </span>
                <span className="font-medium">{BANK_HOLDER}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Nội dung:{" "}
                <span className="font-mono text-foreground">
                  Họ tên + SĐT
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>
          <div className="space-y-4">
            {orderItems.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    SL: {item.quantity}
                  </p>
                </div>
                <p className="font-medium">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-4 mt-4 border-t border-border">
            <div className="flex justify-between text-muted-foreground">
              <span>Tạm tính</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Phí giao hàng ({DELIVERY_FEE_PERCENT}%)</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg pt-2">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatPrice(grandTotal)}</span>
            </div>
          </div>
          {payment && (
            <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/20 text-sm">
              <span className="font-medium">Phương thức: </span>
              <span className="text-muted-foreground">
                {getPaymentMethodLabel()}
              </span>
            </div>
          )}
        </div>

        {/* Coin Usage */}
        <div className="mb-6">
          <CoinUsage orderTotal={grandTotal} />
        </div>

        {/* Place Order */}
        {payment && (
          <button
            onClick={handlePlaceOrder}
            className="w-full bg-primary text-primary-foreground py-4 rounded-full hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-lg font-medium"
          >
            Đặt hàng
          </button>
        )}
      </div>

      {/* Mobile sticky bottom */}
      {payment && !scrolledToBottom && (
        <div className="fixed bottom-[66px] left-0 right-0 z-40 bg-background/90 backdrop-blur-xl px-4 py-4 md:hidden safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Tổng cộng:
              </p>
              <p className="text-base font-bold text-primary">
                {formatPrice(grandTotal)}
              </p>
            </div>
            <button
              onClick={handlePlaceOrder}
              className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-full font-semibold text-sm hover:bg-primary/90 hover:shadow-lg active:scale-[0.97] transition-all duration-200 shadow-sm"
            >
              Đặt hàng →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
