// ============================================================
// Checkout Page — route /order
// Form nhập shippingAddress + chọn paymentMethod + tóm tắt giỏ hàng
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { Check, QrCode, ArrowLeft } from "lucide-react";
import { useCart } from "../../../context/CartContext";
import { useAuthStore } from "../../../store/auth.store";
import { orderApi } from "../../../api/orderService";
import { formatPrice } from "../../../lib/formatPrice";
import { ColorSwatch } from "../../components/ui/ColorSwatch";
import { CoinUsage } from "../../components/membership/CoinUsage";
import type { CreateOrderRequest } from "../../../features/orders/types/order.types";

// ── Validation schema ──
const shippingSchema = yup.object({
  fullName: yup.string().required("Vui lòng nhập họ tên"),
  phone: yup
    .string()
    .required("Vui lòng nhập số điện thoại")
    .matches(/^(0|\+84)[3-9][0-9]{8}$/, "Số điện thoại không hợp lệ"),
  address: yup.string().required("Vui lòng nhập địa chỉ"),
});

type ShippingFormData = yup.InferType<typeof shippingSchema>;

// ── Payment method config ──
const PAYMENT_METHODS = [
  {
    value: "VNPAY" as const,
    label: "VNPAY",
    icon: QrCode,
    description: "Thanh toán qua VNPAY",
  },
];

export function Checkout() {
  const navigate = useNavigate();
  const { cartItems, totalItems, totalPrice, clearCart } = useCart();
  const user = useAuthStore((s) => s.user);
  const [paymentMethod, setPaymentMethod] = useState<"VNPAY">("VNPAY");
  const [submitting, setSubmitting] = useState(false);
  const [coinDiscount, setCoinDiscount] = useState(0);

  const DELIVERY_FEE_PERCENT = 15;
  const subtotal = totalPrice;
  const deliveryFee = (subtotal * DELIVERY_FEE_PERCENT) / 100;
  const grandTotal = Math.max(0, subtotal + deliveryFee - coinDiscount);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShippingFormData>({
    resolver: yupResolver(shippingSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
    },
  });

  // Pre-fill form with current user data
  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ShippingFormData) => {
    if (cartItems.length === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateOrderRequest = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          color: item.color,
          hexCode: item.hexCode,
        })),
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          ward: "",
          district: "",
          city: "",
        },
        paymentMethod,
        shippingFee: deliveryFee,
        ...(coinDiscount > 0 ? { coinUsed: coinDiscount } : {}),
      };

      const response = await orderApi.createOrder(payload);
      const result = response.data;

      if (result.payUrl) {
        // VNPAY: redirect to payment gateway
        window.location.href = result.payUrl;
        return;
      }

      // Order created: clear cart and go to success page
      clearCart();
      const orderId = result?.order?._id || "";
      const date = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      navigate(
        `/order/success?orderId=${orderId}&date=${encodeURIComponent(date)}`,
      );
    } catch (error: unknown) {
      const axiosError = error as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };
      const errData = axiosError?.response?.data;
      if (errData?.message) {
        toast.error(errData.message);
        if (errData.errors) {
          Object.entries(errData.errors).forEach(([key, msgs]) => {
            msgs.forEach((msg) => toast.error(`${key}: ${msg}`));
          });
        }
      } else {
        toast.error("Đặt hàng thất bại. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-3">Giỏ hàng trống</h2>
          <p className="text-muted-foreground mb-6">
            Vui lòng thêm sản phẩm vào giỏ trước khi đặt hàng.
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
    <div className="min-h-screen bg-background py-8 px-4 pb-[calc(env(safe-area-inset-bottom)+90px)] md:pb-0">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại giỏ hàng
        </Link>

        <h1 className="text-3xl font-semibold mb-8">Đặt hàng</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-5 gap-8">
            {/* ── Left: Shipping Form + Payment ── */}
            <div className="lg:col-span-3 space-y-6">
              {/* Shipping Address */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Thông tin giao hàng
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Họ tên <span className="text-destructive">*</span>
                    </label>
                    <input
                      {...register("fullName")}
                      placeholder="Nguyễn Văn A"
                      className={`w-full px-4 py-3 bg-input-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-base ${
                        errors.fullName ? "border-destructive" : "border-border"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Số điện thoại <span className="text-destructive">*</span>
                    </label>
                    <input
                      {...register("phone")}
                      placeholder="0901234567"
                      className={`w-full px-4 py-3 bg-input-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-base ${
                        errors.phone ? "border-destructive" : "border-border"
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Địa chỉ <span className="text-destructive">*</span>
                    </label>
                    <input
                      {...register("address")}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, thành phố"
                      className={`w-full px-4 py-3 bg-input-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-base ${
                        errors.address ? "border-destructive" : "border-border"
                      }`}
                    />
                    {errors.address && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.address.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Phương thức thanh toán
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const selected = paymentMethod === method.value;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentMethod(method.value)}
                        className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        {selected && (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                        <Icon className="w-7 h-7 text-primary" />
                        <span className="text-xs font-semibold text-center">
                          {method.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Coin Usage */}
              <CoinUsage
                orderTotal={subtotal}
                onCoinApplied={setCoinDiscount}
                onCoinRemoved={() => setCoinDiscount(0)}
              />
            </div>

            {/* ── Right: Order Summary ── */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
                <h3 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h3>

                {/* Cart items (read-only) */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div
                      key={`${item.productId}-${item.color}`}
                      className="flex items-start gap-3 py-2 border-b border-border last:border-0"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallback) {
                            target.dataset.fallback = "true";
                            target.src = `https://picsum.photos/seed/${item.productId}/100/100`;
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <ColorSwatch
                            hexCode={item.hexCode}
                            colorName={item.color}
                            size="sm"
                          />
                          <span className="text-xs text-muted-foreground">
                            {item.color}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          SL: {item.quantity} x {formatPrice(item.price)}
                        </p>
                      </div>
                      <p className="text-sm font-medium flex-shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Tạm tính ({totalItems} sản phẩm)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Phí vận chuyển ({DELIVERY_FEE_PERCENT}%)</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                  {coinDiscount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>Giảm giá Coin</span>
                      <span>-{formatPrice(coinDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-6 bg-primary text-primary-foreground py-4 rounded-full hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? "Đang xử lý..." : "Đặt hàng"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}