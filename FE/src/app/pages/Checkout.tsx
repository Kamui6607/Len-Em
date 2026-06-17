import { useState } from "react";
import { useNavigate } from "react-router";
import { Check, Banknote, QrCode, DollarSign, ShoppingBag, Truck } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "sonner";
import { products } from "../data/products";

interface CheckoutProps {
  cartItems: { productId: string; quantity: number }[];
  onClearCart: () => void;
}

type Fulfillment = "online" | "instore";
type Payment = "bank" | "cash";

const DELIVERY_FEE_PERCENT = 15;
const BANK_NAME = "Vietcombank";
const BANK_ACCOUNT = "101 123 4567";
const BANK_HOLDER = "LEN & EM CO., LTD";

function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function Checkout({ cartItems, onClearCart }: CheckoutProps) {
  const [fulfillment, setFulfillment] = useState<Fulfillment | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { createOrder, logActivity } = useAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();

  const orderItems = cartItems.map((item) => {
    const parts = String(item.productId).split("-");
    const baseId = parts[0];
    const product = products.find((p) => String(p.id) === baseId);
    return {
      productId: item.productId,
      productName: product?.name || "Unknown",
      quantity: item.quantity,
      price: product?.variants?.[0]?.price ?? 0,
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = fulfillment === "online" ? (subtotal * DELIVERY_FEE_PERCENT) / 100 : 0;
  const grandTotal = subtotal + deliveryFee;

  const getPaymentMethodLabel = () => {
    if (!fulfillment || !payment) return "";
    const labels: Record<string, string> = {
      bank_online: "Chuyển khoản + Giao hàng",
      cash_online: "COD + Giao hàng",
      bank_instore: "Chuyển khoản + Nhận tại shop",
      cash_instore: "Tiền mặt + Nhận tại shop",
    };
    return labels[`${payment}_${fulfillment}`];
  };

  const handlePlaceOrder = () => {
    // Validation
    if (!fulfillment) {
      toast.error("Vui lòng chọn hình thức nhận hàng.");
      return;
    }
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
    if (fulfillment === "online") {
      if (!email.trim()) {
        toast.error("Vui lòng nhập email để nhận thông báo giao hàng.");
        return;
      }
      if (!address.trim()) {
        toast.error("Vui lòng nhập địa chỉ giao hàng.");
        return;
      }
    }

    if (orderItems.length === 0) {
      toast.error("Giỏ hàng trống.");
      return;
    }

    const paymentMethod = `${payment}_${fulfillment}`;

    const orderId = createOrder({
      userId: user?.email || "guest",
      userName: name.trim(),
      userEmail: email || user?.email || "guest@example.com",
      items: orderItems,
      total: grandTotal,
      deliveryFee,
      fulfillment,
      address: fulfillment === "online" ? address.trim() : undefined,
      paymentMethod,
      paymentStatus: "pending",
    });

    logActivity({
      type: "purchase",
      userId: user?.email || "guest",
      userName: user?.fullName || name.trim() || "Guest",
      description: `Đơn ${orderId} — ${getPaymentMethodLabel()} — ${formatPrice(grandTotal)}`,
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
          <h1 className="text-3xl font-semibold">Đặt hàng thành công!</h1>
          <p className="text-muted-foreground">
            Đơn hàng của bạn đã được ghi nhận. Bạn sẽ được chuyển đến trang đơn hàng trong giây lát.
          </p>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8">Thanh toán</h1>

        {/* ── STEP 1: Fulfillment Method ── */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">1. Hình thức nhận hàng</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => { setFulfillment("online"); setPayment(null); }}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                fulfillment === "online"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <Truck className="w-6 h-6 mb-2" />
              <p className="text-sm font-medium">Mua online</p>
              <p className="text-xs text-muted-foreground">Giao hàng tận nơi</p>
            </button>
            <button
              onClick={() => { setFulfillment("instore"); setPayment(null); }}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                fulfillment === "instore"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <ShoppingBag className="w-6 h-6 mb-2" />
              <p className="text-sm font-medium">Mua tại shop</p>
              <p className="text-xs text-muted-foreground">Nhận hàng trực tiếp</p>
            </button>
          </div>
        </div>

        {/* ── Customer Info ── */}
        {fulfillment && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {fulfillment === "online" ? "Thông tin giao hàng" : "Thông tin liên hệ"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Họ tên *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Số điện thoại *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0703339186"
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              {fulfillment === "online" && (
                <>
                  <div>
                    <label className="block text-sm mb-1">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Địa chỉ giao hàng *</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: Payment Method ── */}
        {fulfillment && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">2. Phương thức thanh toán</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPayment("bank")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  payment === "bank"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <QrCode className="w-6 h-6 mb-2 mx-auto" />
                <p className="text-sm font-medium">Chuyển khoản / QR</p>
                <p className="text-xs text-muted-foreground">
                  {fulfillment === "online" ? "Thanh toán online" : "Chuyển khoản trước"}
                </p>
              </button>
              <button
                onClick={() => setPayment("cash")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  payment === "cash"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <DollarSign className="w-6 h-6 mb-2 mx-auto" />
                <p className="text-sm font-medium">Tiền mặt</p>
                <p className="text-xs text-muted-foreground">
                  {fulfillment === "online" ? "Trả khi nhận hàng (COD)" : "Trả tại quầy"}
                </p>
              </button>
            </div>

            {/* Bank info block */}
            {payment === "bank" && (
              <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Thông tin chuyển khoản</p>
                    <p className="text-muted-foreground">Ngân hàng: {BANK_NAME}</p>
                    <p className="text-muted-foreground">Số tài khoản: {BANK_ACCOUNT}</p>
                    <p className="text-muted-foreground">Chủ tài khoản: {BANK_HOLDER}</p>
                    <p className="text-muted-foreground">
                      Nội dung: <span className="font-mono text-foreground">Họ tên + SĐT</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Order Summary ── */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>
          <div className="space-y-4">
            {orderItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">SL: {item.quantity}</p>
                </div>
                <p className="font-medium">{(item.price * item.quantity).toFixed(2)}$</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-4 mt-4 border-t border-border">
            <div className="flex justify-between text-muted-foreground">
              <span>Tạm tính</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {fulfillment === "online" && (
              <div className="flex justify-between text-muted-foreground">
                <span>Phí giao hàng ({DELIVERY_FEE_PERCENT}%)</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg pt-2">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          {fulfillment && payment && (
            <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/20 text-sm">
              <span className="font-medium">Phương thức: </span>
              <span className="text-muted-foreground">{getPaymentMethodLabel()}</span>
            </div>
          )}
        </div>

        {/* ── Place Order Button ── */}
        {fulfillment && payment && (
          <button
            onClick={handlePlaceOrder}
            className="w-full bg-primary text-primary-foreground py-4 rounded-full hover:bg-primary/90 transition-colors text-lg font-medium"
          >
            Đặt hàng — {formatPrice(grandTotal)}
          </button>
        )}
      </div>
    </div>
  );
}