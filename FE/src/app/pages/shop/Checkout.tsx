// ============================================================
// Checkout Page — route /order
// Form nhập shippingAddress + chọn paymentMethod + tóm tắt giỏ hàng
// With GHN integration for address dropdowns and shipping fee calculation
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import {
  ArrowLeft,
  Banknote,
  Check,
  Info,
  Loader as Loader2,
  Lock,
  MapPin,
  Pencil,
  QrCode,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { expandCart, useCart } from "../../../shared/contexts/CartContext";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { useAuthStore } from "../../../shared/store/auth.store";
import { orderService } from "../../../features/orders/services/order.service";
import type {
  PaymentMethod,
  ShippingFeePreviewRequest,
} from "../../../features/orders/types/order.types";
import {
  AddressSelector,
  isPickComplete,
  type AddressPick,
} from "../../../shared/components/address/AddressSelector";
import { formatPrice } from "../../../lib/formatPrice";
import { ColorSwatch } from "../../../shared/components/ui/ColorSwatch";
import { EmptyCartState } from "./CartPage";
import {
  SepayQrModal,
  parseSepayPayUrl,
  type SepayQrInfo,
} from "../../../features/orders/components/SepayQrModal";
import { CoinUsage } from "../../../shared/components/membership/CoinUsage";
import { useMembershipStore } from "../../../features/membership/store/membership.store";
import type { CreateOrderRequest } from "../../../features/orders/types/order.types";
import { rememberPlacedOrder } from "../../../features/orders/orderToastStore";
import "../../../styles/checkout.css";

/**
 * Mua bài DIY (chính bài DIY, không phải nguyên liệu) cần BE hỗ trợ: hiện
 * order.itemType chỉ có "Product" | "Course" và POST /orders chỉ đọc
 * `items` + `kits` — gửi DIY lên sẽ bị bỏ qua hoặc báo "Product not found".
 * Khi BE nhận `diyPosts: [{ diyPostId, quantity }]` thì bật cờ này.
 */
const DIY_CHECKOUT_ENABLED = false;

// ── Validation schema ──
const shippingSchema = yup.object({
  fullName: yup.string().required("Vui lòng nhập họ tên"),
  phone: yup
    .string()
    .required("Vui lòng nhập số điện thoại")
    .matches(/^(0|\+84)[3-9][0-9]{8}$/, "Số điện thoại không hợp lệ"),
  address: yup.string().required("Vui lòng nhập địa chỉ chi tiết"),
});

type ShippingFormData = yup.InferType<typeof shippingSchema>;

/** Hạn mức thu hộ GHN mặc định — BE gửi giá trị thật qua /orders/shipping-fee (maxCodAmount). */
const DEFAULT_MAX_COD = 300000;

const PAYMENT_METHODS = [
  {
    value: "COD" as const,
    label: "COD",
    icon: Banknote,
    description: "Thanh toán khi nhận hàng (COD)",
  },
  {
    value: "SEPAY" as const,
    label: "SePay",
    icon: QrCode,
    description: "Chuyển khoản VietQR — quét mã thanh toán",
  },
];

export function Checkout() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { cartItems, cartKits, cartDIYs, totalItems, totalPrice, removeFromCart, removeKitFromCart } =
    useCart();
  // Dòng sản phẩm / combo gửi lên BE. Bài DIY đi riêng (diyPosts) — xem DIY_CHECKOUT_ENABLED.
  const orderLines = useMemo(() => expandCart(cartItems, cartKits), [cartItems, cartKits]);
  const hasDIY = cartDIYs.length > 0;
  const diyBlocked = hasDIY && !DIY_CHECKOUT_ENABLED;
  const cartEmpty = cartItems.length === 0 && cartKits.length === 0 && cartDIYs.length === 0;
  const user = useAuthStore((s) => s.user);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [submitting, setSubmitting] = useState(false);
  // ── SePay (VietQR): QR hiển thị sau khi tạo đơn + trạng thái poll PAID ──
  const [sepayQr, setSepayQr] = useState<SepayQrInfo | null>(null);
  const [sepayChecking, setSepayChecking] = useState(false);
  const sepayPaidRef = useRef(false);
  // Coin trừ thẳng vào đơn (1 coin = 1₫) — luôn là số nguyên.
  const [coinDiscount, setCoinDiscount] = useState(0);
  const refreshMembership = useMembershipStore((s) => s.refresh);
  const coinBalance = useMembershipStore((s) => s.data?.coinBalance ?? 0);
  const calculateMaxCoinUsage = useMembershipStore((s) => s.calculateMaxCoinUsage);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const feeRequestRef = useRef(0);
  // A SePay order already created this session. Closing the QR modal keeps it
  // here so the customer can reopen the QR instead of placing a duplicate order.
  const [pendingSepay, setPendingSepay] = useState<SepayQrInfo | null>(null);

  // Địa chỉ giao hàng (tỉnh/huyện/xã ± toạ độ) — do AddressSelector quản lý,
  // điền sẵn từ user.addressLocation. Đổi ở đây chỉ áp dụng cho đơn này.
  const [addressPick, setAddressPick] = useState<AddressPick | null>(null);

  // Địa chỉ đã lưu trong hồ sơ: đủ tỉnh/huyện/xã + dòng chi tiết thì mặc định
  // giao tới đó — không bắt chọn lại (và không phải qua bản đồ). "Đổi địa chỉ"
  // mở AddressSelector, chỉ áp dụng cho đơn này, không sửa hồ sơ.
  const [addressSource, setAddressSource] = useState<"profile" | "custom">("profile");
  const profileLocation = user?.addressLocation;
  const profilePick = useMemo<AddressPick | null>(() => {
    const loc = profileLocation;
    if (!loc?.provinceName?.trim() || !loc.districtName?.trim() || !loc.wardName?.trim()) return null;
    const hasCoords = typeof loc.lat === "number" && typeof loc.lng === "number";
    return {
      mode: hasCoords ? "map" : "dropdown",
      provinceName: loc.provinceName.trim(),
      districtName: loc.districtName.trim(),
      wardName: loc.wardName.trim(),
      provinceId: loc.provinceId ?? null,
      districtId: loc.districtId ?? null,
      wardCode: loc.wardCode ?? null,
      lat: hasCoords ? loc.lat! : null,
      lng: hasCoords ? loc.lng! : null,
    };
  }, [profileLocation]);
  const profileAddressReady = Boolean(profilePick && user?.address?.trim());
  const usingProfileAddress = profileAddressReady && addressSource === "profile";
  const activePick = usingProfileAddress ? profilePick : addressPick;

  const subtotal = totalPrice;
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [maxCod, setMaxCod] = useState(DEFAULT_MAX_COD);
  // BE tính giới hạn coin trên tiền hàng (không gồm ship): ≥ ngưỡng tối thiểu,
  // ≤ 20% tiền hàng, ≤ số dư. Giỏ đổi làm vượt giới hạn → bỏ coin.
  const maxCoin = Math.floor(Math.min(coinBalance, calculateMaxCoinUsage(subtotal)));
  useEffect(() => {
    if (coinDiscount > maxCoin) setCoinDiscount(0);
  }, [coinDiscount, maxCoin]);
  const grandTotal = Math.max(0, subtotal + (deliveryFee ?? 0) - coinDiscount);
  // BE so sánh totalPrice (hàng + phí ship) với hạn mức COD của GHN.
  const codBlocked = subtotal + (deliveryFee ?? 0) > maxCod;

  // Đơn vượt hạn mức → COD không dùng được, tự chuyển sang SePay.
  useEffect(() => {
    if (codBlocked && paymentMethod === "COD") setPaymentMethod("SEPAY");
  }, [codBlocked, paymentMethod]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
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

  // ── Shared shipping fee calculator ──
  // Sends items + address names (+ optional lat/lng) to POST /orders/shipping-fee.
  const fetchShippingFee = async (
    provinceName: string,
    districtName: string,
    wardName: string,
    lat?: number,
    lng?: number
  ) => {
    // Only the latest request may write the fee — a slow response for an
    // address the user already changed must not overwrite the newer one.
    const requestId = ++feeRequestRef.current;
    const isStale = () => requestId !== feeRequestRef.current;

    if (cartEmpty) {
      // Giỏ rỗng (kể cả sau khi self-healing gỡ hết item "bóng ma") →
      // reset phí ship cũ để tổng tiền không cộng dồn phí đã lỗi thời.
      setDeliveryFee(null);
      return;
    }

    setCalculatingFee(true);
    try {
      // Items for shipping: single products + products inside DIY sets, then
      // kits expanded into their products (a kit bought N times ships N of each).
      const itemsForShipping: ShippingFeePreviewRequest["items"] = [
        ...orderLines.items,
        ...orderLines.kits.flatMap((kit) =>
          kit.products.map((product) => ({
            productId: product.productId,
            variantId: product.variantId,
            quantity: kit.quantity,
          })),
        ),
      ];

      // If still no items, skip calculation
      if (itemsForShipping.length === 0) {
        setDeliveryFee(null);
        return;
      }

      const payload: ShippingFeePreviewRequest = {
        items: itemsForShipping,
        provinceName,
        districtName,
        wardName,
        // Include lat/lng when available (map mode)
        ...(lat !== undefined && lng !== undefined ? { lat, lng } : {}),
      };

      console.log("[Checkout] Calculating shipping fee with payload:", payload);
      const response = await orderService.previewShippingFee(payload);
      if (isStale()) return;
      const data = response.data;
      // Backend returns { subtotal, shippingFee, total }
      console.log("[Checkout] Shipping fee response:", data);
      setDeliveryFee(data.shippingFee ?? 0);
      if (data.maxCodAmount) setMaxCod(data.maxCodAmount);
    } catch (error) {
      if (isStale()) return;
      console.error("[Checkout] Failed to calculate shipping fee:", error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errMsg = axiosError?.response?.data?.message;

      // ── Self-healing: BE chặn sản phẩm đã bị xoá khỏi DB (404 "Product
      // <id> not found") — "bóng ma" còn lưu trong LocalStorage giỏ hàng.
      // Tự xoá nó khỏi cart (state + localStorage đồng bộ qua effect trong
      // CartContext); effect tính phí có deps cartItems/cartKits nên sẽ tự
      // gọi lại với các item còn sống — giao diện sạch mà không cần refresh.
      const missingId =
        errMsg && /not found/i.test(errMsg)
          ? errMsg.match(/[a-f0-9]{24}/i)?.[0]
          : undefined;

      if (missingId) {
        const deadItem = cartItems.find(
          (item) => item.productId === missingId || item.variantId === missingId
        );
        const deadKit =
          cartKits.find((kit) => kit.kitId === missingId) ??
          // Kit chứa product đã bị xoá khỏi DB → gỡ luôn cả kit (không còn
          // đủ sản phẩm hợp lệ để thanh toán).
          cartKits.find((kit) => kit.products.some((p) => p.productId === missingId));

        if (deadItem) {
          removeFromCart(deadItem.productId, deadItem.variantId);
          toast.warning(
            `"${deadItem.name}" không còn tồn tại nên đã tự động xoá khỏi giỏ hàng.`
          );
        } else if (deadKit) {
          removeKitFromCart(deadKit.kitId);
          toast.warning(
            `DIY Kit "${deadKit.name}" có sản phẩm không còn tồn tại nên đã tự động xoá khỏi giỏ hàng.`
          );
        } else {
          toast.warning("Một sản phẩm trong giỏ không còn tồn tại nên đã được bỏ qua.");
        }
        return;
      }

      toast.error(errMsg || "Không thể tính phí vận chuyển. Vui lòng thử lại sau.");
    } finally {
      if (!isStale()) setCalculatingFee(false);
    }
  };

  const switchToProfileAddress = () => {
    setAddressPick(null);
    setAddressSource("profile");
    // The profile card always ships to the saved detail line.
    setValue("address", user?.address || "", { shouldValidate: true });
  };
  const switchToCustomAddress = () => {
    setAddressPick(null);
    setAddressSource("custom");
  };

  // ── Tính phí ship khi địa chỉ đủ tỉnh/huyện/xã ──
  // Chế độ dropdown: gửi tên GHN. Chế độ map: gửi tên từ bản đồ + lat/lng.
  // Địa chỉ chưa đủ (hoặc vừa đổi chế độ) → bỏ request cũ và xoá phí cũ.
  const pickIsMap = activePick?.mode === "map";
  const feeKey =
    activePick && isPickComplete(activePick)
      ? JSON.stringify([
          activePick.mode,
          activePick.provinceName,
          activePick.districtName,
          activePick.wardName,
          pickIsMap ? activePick.lat : null,
          pickIsMap ? activePick.lng : null,
        ])
      : null;
  useEffect(() => {
    if (!feeKey || !activePick) {
      feeRequestRef.current++; // drop any in-flight fee for the old address
      setCalculatingFee(false);
      setDeliveryFee(null);
      return;
    }
    fetchShippingFee(
      activePick.provinceName,
      activePick.districtName,
      activePick.wardName,
      pickIsMap ? activePick.lat ?? undefined : undefined,
      pickIsMap ? activePick.lng ?? undefined : undefined
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeKey, orderLines]);

  const onSubmit = async (data: ShippingFormData) => {
    // An order was already placed and is waiting for its bank transfer —
    // reopen its QR rather than creating a second order for the same cart.
    if (pendingSepay) {
      setSepayQr(pendingSepay);
      return;
    }

    if (diyBlocked) {
      toast.error("Hiện chưa thể thanh toán DIY. Vui lòng xoá DIY khỏi giỏ để đặt các món còn lại.");
      return;
    }

    if (cartEmpty) {
      toast.error(t("checkout.cartEmpty"));
      setSubmitting(false);
      return;
    }

    // In map mode the names come straight from the map picker; in dropdown
    // mode from the GHN dropdowns — AddressSelector already resolved which.
    const isMapMode = activePick?.mode === "map";
    if (!activePick || !isPickComplete(activePick)) {
      toast.error(
        isMapMode
          ? "Vui lòng chọn vị trí trên bản đồ"
          : "Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện, phường/xã"
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateOrderRequest = {
        items: orderLines.items,
        ...(hasDIY && DIY_CHECKOUT_ENABLED
          ? { diyPosts: cartDIYs.map((diy) => ({ diyPostId: diy.diyId, quantity: diy.quantity })) }
          : {}),
        ...(orderLines.kits.length > 0 ? {
          kits: orderLines.kits.map((kit) => ({
            kitId: kit.kitId,
            quantity: kit.quantity,
          })),
        } : {}),
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          // Map names in map mode, GHN dropdown names in dropdown mode
          wardName: activePick.wardName,
          districtName: activePick.districtName,
          provinceName: activePick.provinceName,
          // Coordinates only describe the map pick — never attach them to an
          // address chosen from the dropdowns (it may be somewhere else).
          ...(isMapMode && activePick.lat !== null && activePick.lng !== null
            ? { lat: activePick.lat, lng: activePick.lng }
            : {}),
        },
        paymentMethod,
        ...(coinDiscount > 0 ? { coinUsed: Math.floor(coinDiscount) } : {}),
      };

      const response = await orderService.createOrder(payload);
      const result = response.data;
      // The "Đặt hàng thành công" toast comes from the realtime notification
      // (OrderToastHost) — only tell it how this order is paid (COD line).
      if (result.order?._id) rememberPlacedOrder(result.order._id, paymentMethod);
      // BE đã trừ coin + tạo history "pending" — nạp lại số dư / lịch sử.
      void refreshMembership();

      // NOTE: Do NOT clear cart here! For MOMO, the user is redirected
      // to the payment gateway. If they press Back or payment fails, the cart
      // must still be intact. The cart is cleared on /order/success only after
      // payment is confirmed (or for COD, when the order is created successfully).



      // SEPAY (VietQR): tạo mã QR và hiển thị NGAY trên trang — không redirect
      // sang cổng thanh toán. Webhook của SePay sẽ chuyển đơn sang PAID;
      // modal QR tự poll GET /orders/{id} để phát hiện rồi sang trang cảm ơn.
      if (paymentMethod === "SEPAY") {
        const orderId = result.order?._id;
        if (!orderId) throw new Error("Missing order id from server response");
        const sepayRes = await orderService.createSepayPaymentLink({ orderId });
        if (!sepayRes.data.payUrl) throw new Error("SePay did not return a payment QR");
        sepayPaidRef.current = false;
        const qr: SepayQrInfo = {
          orderId,
          payUrl: sepayRes.data.payUrl,
          ...parseSepayPayUrl(sepayRes.data.payUrl),
        };
        setPendingSepay(qr);
        setSepayQr(qr);
        return;
      }

      // COD and other non-redirect methods: go to /order/success so the cart
      // is cleared only after the order is confirmed.
      // No toast here: the order notification already shows one.
      navigate(`/order/success?orderId=${result.order?._id ?? ""}`);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };
      const errData = axiosError?.response?.data;
      // HTTP errors (e.g. the 400 for an invalid coinUsed) are already toasted
      // by the axios interceptor with the backend's message — don't repeat it.
      const hasResponse = Boolean(axiosError?.response);
      if (errData?.message) {
        if (errData.errors) {
          Object.entries(errData.errors).forEach(([key, msgs]) => {
            msgs.forEach((msg) => toast.error(`${key}: ${msg}`));
          });
        }
      } else if (!hasResponse) {
        toast.error(t("checkout.orderFailed"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── SePay: poll GET /orders/{id} mỗi 5 giây — khi payment.status === "PAID"
  // thì dừng, báo thành công và chuyển sang trang cảm ơn. `sepayPaidRef` chặn
  // bắn trùng khi interval fire đúng lúc đang điều hướng.
  // Polls the pending order (not just the open modal) so a payment made after
  // the customer closed the QR still lands them on the success page.
  const verifySepayPayment = useCallback(
    async (silent = true) => {
      if (!pendingSepay || sepayPaidRef.current) return;
      try {
        const { data } = await orderService.getOrderById(pendingSepay.orderId);
        if (sepayPaidRef.current) return;
        if (data.order?.payment?.status === "PAID") {
          sepayPaidRef.current = true;
          toast.success("Thanh toán thành công! 🎉");
          navigate(`/order/success?orderId=${pendingSepay.orderId}`);
          return;
        }
        if (!silent) {
          toast.info("Chưa nhận được thanh toán. Vui lòng chờ 1–2 phút rồi thử lại.");
        }
      } catch {
        if (!silent) {
          toast.error("Không thể kiểm tra trạng thái đơn hàng. Vui lòng thử lại.");
        }
      }
    },
    [pendingSepay, navigate],
  );

  useEffect(() => {
    if (!pendingSepay) return;
    // Kiểm tra ngay (khách có thể đã CK xong trước đó) + lặp mỗi 5 giây.
    void verifySepayPayment(true);
    const timer = window.setInterval(() => void verifySepayPayment(true), 5000);
    return () => window.clearInterval(timer);
  }, [pendingSepay, verifySepayPayment]);

  const handleCheckSepayNow = async () => {
    setSepayChecking(true);
    try {
      await verifySepayPayment(false);
    } finally {
      setSepayChecking(false);
    }
  };

  if (cartEmpty) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <EmptyCartState />
      </div>
    );
  }

  const isMapMode = activePick?.mode === "map";
  const addressComplete = Boolean(activePick && isPickComplete(activePick));
  const kitCount = cartKits.reduce((sum, kit) => sum + kit.quantity, 0);

  // Why the submit button is disabled — shown under it instead of a silent grey button.
  const submitHint = pendingSepay
    ? "Đơn hàng đã được tạo — quét mã QR để hoàn tất thanh toán."
    : diyBlocked
      ? "Hiện chưa thể thanh toán DIY — xoá DIY khỏi giỏ để đặt các món còn lại."
    : !addressComplete
      ? isMapMode
        ? "Chọn vị trí trên bản đồ để tính phí vận chuyển."
        : "Chọn đủ tỉnh/thành, quận/huyện, phường/xã để tính phí vận chuyển."
      : calculatingFee
        ? "Đang tính phí vận chuyển…"
        : deliveryFee === null
          ? "Chưa tính được phí vận chuyển — thử chọn lại địa chỉ."
          : null;

  const fieldClass = (invalid: boolean) => `co-input${invalid ? " is-invalid" : ""}`;

  return (
    <div className="co-page">
      <div className="co-wrap">
        <Link to="/cart" className="co-back">
          <ArrowLeft className="size-4" />
          Quay lại giỏ hàng
        </Link>

        {/* ── Heading + progress thread ── */}
        <header className="co-head co-rise">
          <div>
            <span className="co-eyebrow">Bước cuối cùng</span>
            <h1 className="co-title">
              Đặt <em>hàng</em>
            </h1>
            <div className="co-stitch" aria-hidden="true" />
          </div>

          <ol className="co-rail" aria-label="Tiến trình đặt hàng">
            <li className="co-rail-step" data-state="done">
              <span className="co-rail-dot">
                <Check className="size-4" />
              </span>
              Giỏ hàng
            </li>
            <li className="co-rail-thread is-done" aria-hidden="true" />
            <li className="co-rail-step" data-state="current" aria-current="step">
              <span className="co-rail-dot">2</span>
              Giao hàng & thanh toán
            </li>
            <li className="co-rail-thread" aria-hidden="true" />
            <li className="co-rail-step" data-state="todo">
              <span className="co-rail-dot">3</span>
              Hoàn tất
            </li>
          </ol>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="co-layout">
            {/* ── Left: recipient, address, payment ── */}
            <div className="co-main">
              {/* 1 · Recipient */}
              <section className="co-card co-rise" aria-labelledby="co-recipient">
                <div className="co-card-head">
                  <span className="co-card-num">1</span>
                  <div>
                    <h2 id="co-recipient" className="co-card-title">Người nhận</h2>
                    <p className="co-card-sub">Ai sẽ nhận gói len này?</p>
                  </div>
                </div>
                <div className="co-grid cols-2">
                  <div>
                    <label htmlFor="co-fullname" className="co-label">
                      Họ tên<span className="co-req">*</span>
                    </label>
                    <input
                      id="co-fullname"
                      {...register("fullName")}
                      placeholder="Nguyễn Văn A"
                      autoComplete="name"
                      aria-invalid={!!errors.fullName}
                      className={fieldClass(!!errors.fullName)}
                    />
                    {errors.fullName && <p className="co-error">{errors.fullName.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="co-phone" className="co-label">
                      Số điện thoại<span className="co-req">*</span>
                    </label>
                    <input
                      id="co-phone"
                      type="tel"
                      inputMode="tel"
                      {...register("phone")}
                      placeholder="0901234567"
                      autoComplete="tel"
                      aria-invalid={!!errors.phone}
                      className={fieldClass(!!errors.phone)}
                    />
                    {errors.phone && <p className="co-error">{errors.phone.message}</p>}
                  </div>
                </div>
              </section>

              {/* 2 · Address */}
              <section className="co-card co-rise" style={{ animationDelay: "60ms" }} aria-labelledby="co-address">
                <div className="co-card-head">
                  <span className="co-card-num">2</span>
                  <div>
                    <h2 id="co-address" className="co-card-title">Địa chỉ giao hàng</h2>
                    <p className="co-card-sub">Giao bởi GHN — phí tính theo địa chỉ</p>
                  </div>
                  {addressComplete && (
                    <span className="co-card-done">
                      <Check className="size-3" /> Đã chọn
                    </span>
                  )}
                </div>

                {usingProfileAddress ? (
                  /* Mặc định: địa chỉ trong hồ sơ — đặt hàng luôn, không cần chọn lại */
                  <div className="co-saved">
                    <span className="co-saved-icon" aria-hidden="true">
                      <MapPin className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="co-saved-line">{user?.address}</p>
                      <p className="co-saved-sub">
                        {[profilePick?.wardName, profilePick?.districtName, profilePick?.provinceName]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="co-saved-tag">Địa chỉ trong hồ sơ</p>
                    </div>
                    <button type="button" className="co-saved-change" onClick={switchToCustomAddress}>
                      <Pencil className="size-3.5" />
                      Đổi địa chỉ
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {profileAddressReady ? (
                      <button type="button" className="co-saved-back" onClick={switchToProfileAddress}>
                        <MapPin className="size-3.5" />
                        Dùng địa chỉ trong hồ sơ
                      </button>
                    ) : (
                      <p className="co-hint !mt-0">
                        Lưu địa chỉ vào{" "}
                        <Link to="/profile" className="font-semibold text-[var(--primary)] hover:underline">
                          hồ sơ
                        </Link>{" "}
                        để lần sau đặt hàng nhanh hơn, không cần chọn lại.
                      </p>
                    )}

                    <AddressSelector
                      key={`${user?.userId ?? "guest"}:${JSON.stringify(user?.addressLocation ?? null)}`}
                      idPrefix="co"
                      initialValue={user?.addressLocation}
                      initialStreet={user?.address}
                      onChange={setAddressPick}
                      mapHint="Chạm vào bản đồ để chọn vị trí giao hàng."
                      required
                    />

                    <div>
                      <label htmlFor="co-street" className="co-label">
                        Địa chỉ chi tiết<span className="co-req">*</span>
                      </label>
                      <input
                        id="co-street"
                        {...register("address")}
                        placeholder="Ví dụ: 123 Nguyễn Văn Linh, toà nhà A"
                        autoComplete="street-address"
                        aria-invalid={!!errors.address}
                        className={fieldClass(!!errors.address)}
                      />
                      {errors.address ? (
                        <p className="co-error">{errors.address.message}</p>
                      ) : (
                        <p className="co-hint">
                          Số nhà, tên đường, toà nhà — không cần nhập lại phường/xã, quận/huyện, tỉnh/thành.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* 3 · Payment */}
              <section className="co-card co-rise" style={{ animationDelay: "120ms" }} aria-labelledby="co-payment">
                <div className="co-card-head">
                  <span className="co-card-num">3</span>
                  <div>
                    <h2 id="co-payment" className="co-card-title">Thanh toán</h2>
                    <p className="co-card-sub">Chọn cách bạn muốn trả tiền</p>
                  </div>
                </div>
                <div className="co-pay" role="radiogroup" aria-labelledby="co-payment">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const selected = paymentMethod === method.value;
                    const unavailable = method.value === "COD" && codBlocked;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={!!pendingSepay || unavailable}
                        onClick={() => setPaymentMethod(method.value)}
                        className="co-pay-opt"
                      >
                        <span className="co-pay-icon">
                          <Icon className="size-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="co-pay-name block">{method.label}</span>
                          <span className="co-pay-desc block">
                            {unavailable
                              ? `Chỉ áp dụng cho đơn tối đa ${formatPrice(maxCod)}`
                              : method.description}
                          </span>
                        </span>
                        <span className="co-radio" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </section>

              <CoinUsage
                orderTotal={subtotal}
                onCoinApplied={(amount) => setCoinDiscount(Math.max(0, Math.floor(amount)))}
                onCoinRemoved={() => setCoinDiscount(0)}
              />
            </div>

            {/* ── Right: receipt ── */}
            <aside className="co-summary co-rise" style={{ animationDelay: "90ms" }}>
              <div className="co-ticket">
                <div className="co-ticket-title">
                  <h2>Hoá đơn của bạn</h2>
                  <span className="co-ticket-count">{totalItems} món</span>
                </div>

                <ul className="co-items">
                  {cartDIYs.map((diy) => (
                    <li key={diy.diyId} className="co-item">
                      <span className="co-thumb">
                        <img
                          src={diy.image}
                          alt=""
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = "true";
                              target.src = `https://picsum.photos/seed/${diy.diyId}/100/100`;
                            }
                          }}
                        />
                        {diy.quantity > 1 && <span className="co-thumb-qty">{diy.quantity}</span>}
                      </span>
                      <div className="min-w-0">
                        <p className="co-item-name">{diy.title}</p>
                        <p className="co-item-meta">
                          <span className="co-kit-tag">DIY</span>
                          {diy.price > 0 ? `${formatPrice(diy.price)} / DIY` : "Miễn phí"}
                        </p>
                      </div>
                      <span className="co-item-price">{formatPrice(diy.price * diy.quantity)}</span>
                    </li>
                  ))}

                  {cartKits.map((kit) => (
                    <li key={kit.kitId} className="co-item">
                      <span className="co-thumb">
                        <img
                          src={kit.thumbnail}
                          alt=""
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = "true";
                              target.src = `https://picsum.photos/seed/${kit.kitId}/100/100`;
                            }
                          }}
                        />
                        {kit.quantity > 1 && <span className="co-thumb-qty">{kit.quantity}</span>}
                      </span>
                      <div className="min-w-0">
                        <p className="co-item-name">{kit.name}</p>
                        <p className="co-item-meta">
                          <span className="co-kit-tag">Kit</span>
                          {kit.productCount} sản phẩm
                        </p>
                      </div>
                      <span className="co-item-price">{formatPrice(kit.price * kit.quantity)}</span>
                    </li>
                  ))}

                  {cartItems.map((item) => (
                    <li key={`${item.productId}-${item.variantId}`} className="co-item">
                      <span className="co-thumb">
                        <img
                          src={item.image}
                          alt=""
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = "true";
                              target.src = `https://picsum.photos/seed/${item.productId}/100/100`;
                            }
                          }}
                        />
                        {item.quantity > 1 && <span className="co-thumb-qty">{item.quantity}</span>}
                      </span>
                      <div className="min-w-0">
                        <p className="co-item-name">{item.name}</p>
                        <p className="co-item-meta">
                          <ColorSwatch hexCode={item.hexCode} colorName={item.color} size="sm" />
                          <span className="truncate">{item.color}</span>
                          {item.quantity > 1 && <span>· {formatPrice(item.price)}/cái</span>}
                        </p>
                      </div>
                      <span className="co-item-price">{formatPrice(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <div className="co-cut" aria-hidden="true" />

                <div className="co-line">
                  <span>
                    Tạm tính ({totalItems} sản phẩm{kitCount > 0 ? `, gồm ${kitCount} kit` : ""})
                  </span>
                  <b>{formatPrice(subtotal)}</b>
                </div>
                <div className="co-line">
                  <span>Phí vận chuyển</span>
                  {calculatingFee ? (
                    <span className="is-pending">
                      <Loader2 className="size-3.5 co-spin" /> Đang tính…
                    </span>
                  ) : deliveryFee === null ? (
                    <span className="is-pending">Chưa tính</span>
                  ) : deliveryFee > 0 ? (
                    <b>{formatPrice(deliveryFee)}</b>
                  ) : (
                    <span className="is-free">Miễn phí</span>
                  )}
                </div>
                {coinDiscount > 0 && (
                  <div className="co-line"><span>Giảm giá Coin</span><b>-{formatPrice(coinDiscount)}</b></div>
                )}
                <div className="co-total">
                  <span>Tổng cộng</span>
                  <strong>{formatPrice(grandTotal)}</strong>
                </div>

                <button
                  type="submit"
                  className="co-submit"
                  disabled={!pendingSepay && (diyBlocked || submitting || calculatingFee || deliveryFee === null)}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-5 co-spin" />
                      Đang xử lý…
                    </>
                  ) : pendingSepay ? (
                    <>
                      <QrCode className="size-5" />
                      Mở lại mã QR thanh toán
                    </>
                  ) : (
                    <>
                      <Lock className="size-[18px]" />
                      {paymentMethod === "SEPAY" ? "Đặt hàng & lấy mã QR" : "Đặt hàng"}
                    </>
                  )}
                </button>

                {submitHint && (
                  <p className="co-submit-hint" aria-live="polite">
                    <Info className="mt-px size-3.5 shrink-0" />
                    {submitHint}
                  </p>
                )}
                {pendingSepay && (
                  <p className="co-submit-hint">
                    <Link
                      to={`/purchased/${pendingSepay.orderId}`}
                      className="font-semibold text-[var(--primary)] hover:underline"
                    >
                      Xem đơn hàng vừa tạo →
                    </Link>
                  </p>
                )}

                <div className="co-trust">
                  <span>
                    <ShieldCheck className="size-3.5" /> Thanh toán an toàn
                  </span>
                  <span>
                    <Truck className="size-3.5" /> Giao bởi GHN
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>

      {/* ── SePay QR modal — hiện ngay sau khi đặt đơn chuyển khoản ── */}
      {sepayQr && (
        <SepayQrModal
          info={sepayQr}
          checking={sepayChecking}
          onCheck={handleCheckSepayNow}
          onClose={() => setSepayQr(null)}
        />
      )}
    </div>
  );
}
