import { useEffect, useState } from "react";
import {
  ArrowRight,
  Banknote,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  GraduationCap,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { useCart } from "../../../shared/contexts/CartContext";
import { useAuthStore } from "../../../shared/store/auth.store";
import { orderService } from "../../../features/orders/services/order.service";
import type { Order } from "../../../features/orders/types/order.types";
import { isCourseItem, normalizeOrder } from "../../../features/orders/types/order.types";
import { formatExpectedDelivery } from "../../../lib/orderDelivery";
import { formatPrice } from "../../../lib/formatPrice";
import { shortId, toId, toText } from "../../../lib/displayText";
import { PAYMENT_METHOD_LABELS } from "../../../constants/orderStatus";
import { OrderThread } from "../../../shared/components/order/OrderThread";
import "../../../styles/purchased.css";
import "../../../styles/order-success.css";

// ═══════════════════════════════════════════════════════════════════
// LARGE GIFT BOX SVG — celebratory, bow-tied, with sparkles
// ═══════════════════════════════════════════════════════════════════

function LargeGiftBox({ size = 200 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      aria-label="Gift box with bow"
    >
      <defs>
        {/* Warm candlelit glow behind the box */}
        <radialGradient id="lg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--bg-1)" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#F5EFA8" stopOpacity="0.55" />
          <stop offset="65%" stopColor="#F0C4E0" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F0C4E0" stopOpacity="0" />
        </radialGradient>
        {/* Box body fill gradient */}
        <linearGradient id="lg-box" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5EFA8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#F0C4E0" stopOpacity="0.55" />
        </linearGradient>
        {/* Ribbon fill gradient */}
        <linearGradient id="lg-rib" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9B6FD6" />
          <stop offset="100%" stopColor="#6B3FA0" />
        </linearGradient>
        {/* Bow fill gradient */}
        <linearGradient id="lg-bow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="#6B3FA0" />
        </linearGradient>
      </defs>

      {/* ── Glow background disc ── */}
      <circle cx="100" cy="105" r="96" fill="url(#lg-glow)" />

      {/* ── Ground shadow ── */}
      <ellipse
        cx="100"
        cy="180"
        rx="50"
        ry="7"
        fill="var(--primary)"
        fillOpacity="0.08"
      />

      {/* ══ BOX BODY ══ */}
      <rect
        x="58"
        y="110"
        width="84"
        height="60"
        rx="5"
        fill="url(#lg-box)"
        stroke="var(--primary)"
        strokeWidth="1.8"
      />
      {/* Body inner sheen */}
      <rect
        x="60"
        y="112"
        width="80"
        height="20"
        rx="3"
        fill="white"
        fillOpacity="0.18"
      />

      {/* ══ BOX LID (slightly wider) ══ */}
      <rect
        x="50"
        y="90"
        width="100"
        height="22"
        rx="5"
        fill="#F5EFA8"
        fillOpacity="0.8"
        stroke="var(--primary)"
        strokeWidth="1.8"
      />
      {/* Lid sheen */}
      <rect
        x="52"
        y="92"
        width="96"
        height="8"
        rx="3"
        fill="white"
        fillOpacity="0.28"
      />

      {/* ══ RIBBON — vertical ══ */}
      <rect x="93" y="90" width="14" height="80" rx="3" fill="url(#lg-rib)" />
      {/* Ribbon shine */}
      <rect
        x="95"
        y="90"
        width="4"
        height="80"
        rx="2"
        fill="white"
        fillOpacity="0.22"
      />

      {/* ══ RIBBON — horizontal ══ */}
      <rect x="58" y="122" width="84" height="11" rx="3" fill="url(#lg-rib)" />
      {/* Ribbon shine */}
      <rect
        x="58"
        y="124"
        width="84"
        height="3"
        rx="1.5"
        fill="white"
        fillOpacity="0.22"
      />

      {/* ══ RIBBON CROSS (darker at intersection) ══ */}
      <rect
        x="93"
        y="122"
        width="14"
        height="11"
        rx="2"
        fill="var(--primary)"
        fillOpacity="0.4"
      />

      {/* ══ BOW — left loop ══ */}
      <path
        d="M100,90 C90,70 62,62 68,78 C73,91 88,90 100,90 Z"
        fill="url(#lg-bow)"
      />
      {/* Left loop inner highlight */}
      <path
        d="M100,90 C94,78 76,74 74,80"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />

      {/* ══ BOW — right loop ══ */}
      <path
        d="M100,90 C110,70 138,62 132,78 C127,91 112,90 100,90 Z"
        fill="url(#lg-bow)"
      />
      {/* Right loop inner highlight */}
      <path
        d="M100,90 C106,78 124,74 126,80"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />

      {/* ══ BOW — left tail ══ */}
      <path
        d="M100,90 C90,100 78,110 68,122"
        stroke="var(--primary)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100,90 C90,100 78,110 68,122"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.2"
      />

      {/* ══ BOW — right tail ══ */}
      <path
        d="M100,90 C110,100 122,110 132,122"
        stroke="var(--primary)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100,90 C110,100 122,110 132,122"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.2"
      />

      {/* ══ BOW — centre knot ══ */}
      <ellipse cx="100" cy="90" rx="9" ry="7" fill="var(--primary)" />
      <ellipse
        cx="100"
        cy="90"
        rx="4"
        ry="3"
        fill="var(--accent-yellow)"
        fillOpacity="0.65"
      />

      {/* ══ SPARKLES ══ */}
      {/* Large sparkle — top right */}
      <path
        d="M150,54 L152,47 L154,54 L161,56 L154,58 L152,65 L150,58 L143,56 Z"
        fill="var(--accent-yellow)"
        fillOpacity="0.95"
      />
      {/* Medium sparkle — top left */}
      <path
        d="M50,56 L51.5,51 L53,56 L58,57.5 L53,59 L51.5,64 L50,59 L45,57.5 Z"
        fill="var(--accent-pink)"
        fillOpacity="0.85"
      />
      {/* Small sparkle — right side */}
      <path
        d="M164,114 L165,110 L166,114 L170,115 L166,116 L165,120 L164,116 L160,115 Z"
        fill="var(--accent-yellow)"
        fillOpacity="0.75"
      />
      {/* Tiny sparkle — lower left */}
      <path
        d="M44,142 L45,138 L46,142 L50,143 L46,144 L45,148 L44,144 L40,143 Z"
        fill="var(--accent-pink)"
        fillOpacity="0.65"
      />
      {/* Dot sparkles — scattered */}
      {[
        [162, 72, 4],
        [42, 78, 3],
        [156, 148, 3],
        [48, 108, 2.5],
      ].map(([x, y, r], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill={i % 2 === 0 ? "var(--accent-yellow)" : "var(--accent-pink)"}
          fillOpacity="0.7"
        />
      ))}
    </svg>
  );
}

// ── Pom-pom confetti piece ─────────────────────────────────────

function PomPomShape({
  size,
  color,
  opacity = 1,
}: {
  size: number;
  color: string;
  opacity?: number;
}) {
  const r = size / 2;
  const fib = Math.max(2, size * 0.22);
  const count = size >= 20 ? 12 : 8;

  return (
    <svg
      width={size + fib * 2}
      height={size + fib * 2}
      viewBox={`0 0 ${size + fib * 2} ${size + fib * 2}`}
      fill="none"
      overflow="visible"
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        const cx = r + fib;
        const cy = r + fib;
        const x1 = cx + Math.cos(a) * (r * 0.92);
        const y1 = cy + Math.sin(a) * (r * 0.92);
        const x2 = cx + Math.cos(a) * (r + fib);
        const y2 = cy + Math.sin(a) * (r + fib);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={Math.max(1, size * 0.09)}
            strokeLinecap="round"
            opacity={opacity * 0.78}
          />
        );
      })}
      <circle cx={r + fib} cy={r + fib} r={r} fill={color} opacity={opacity} />
      <circle
        cx={r + fib}
        cy={r + fib}
        r={r * 0.65}
        fill={color}
        fillOpacity={opacity * 0.25}
        stroke={color}
        strokeWidth={r * 0.08}
        strokeOpacity={opacity * 0.3}
      />
      <circle
        cx={r + fib - r * 0.28}
        cy={r + fib - r * 0.28}
        r={r * 0.38}
        fill="white"
        fillOpacity={0.28 * opacity}
      />
      <circle
        cx={r + fib}
        cy={r + fib}
        r={r * 0.12}
        fill="white"
        fillOpacity={0.35 * opacity}
      />
    </svg>
  );
}

const CONFETTI_PIECES = [
  {
    size: 22,
    color: "var(--accent-pink)",
    top: "6%",
    left: "6%",
    rotate: 15,
    opacity: 0.92,
  },
  {
    size: 13,
    color: "var(--accent-yellow)",
    top: "13%",
    left: "19%",
    rotate: -5,
    opacity: 0.85,
  },
  {
    size: 30,
    color: "var(--primary)",
    top: "4%",
    right: "8%",
    rotate: 22,
    opacity: 0.75,
  },
  {
    size: 16,
    color: "var(--accent-pink)",
    top: "18%",
    right: "4%",
    rotate: -12,
    opacity: 0.88,
  },
  {
    size: 10,
    color: "var(--accent-yellow)",
    top: "8%",
    left: "36%",
    rotate: 8,
    opacity: 0.8,
  },
  {
    size: 8,
    color: "var(--primary)",
    top: "3%",
    right: "26%",
    rotate: -20,
    opacity: 0.65,
  },
  {
    size: 18,
    color: "var(--accent-yellow)",
    top: "42%",
    left: "2%",
    rotate: 10,
    opacity: 0.82,
  },
  {
    size: 12,
    color: "var(--accent-pink)",
    top: "38%",
    right: "3%",
    rotate: -18,
    opacity: 0.78,
  },
  {
    size: 24,
    color: "var(--primary)",
    top: "54%",
    left: "5%",
    rotate: 6,
    opacity: 0.7,
  },
  {
    size: 14,
    color: "var(--accent-yellow)",
    top: "58%",
    right: "2%",
    rotate: -8,
    opacity: 0.75,
  },
  {
    size: 26,
    color: "var(--accent-pink)",
    bottom: "16%",
    left: "7%",
    rotate: 12,
    opacity: 0.85,
  },
  {
    size: 18,
    color: "var(--accent-yellow)",
    bottom: "12%",
    right: "5%",
    rotate: -10,
    opacity: 0.8,
  },
  {
    size: 11,
    color: "var(--primary)",
    bottom: "30%",
    left: "3%",
    rotate: 25,
    opacity: 0.68,
  },
  {
    size: 15,
    color: "var(--accent-pink)",
    bottom: "25%",
    right: "12%",
    rotate: -15,
    opacity: 0.72,
  },
  {
    size: 9,
    color: "var(--accent-yellow)",
    bottom: "8%",
    left: "20%",
    rotate: 4,
    opacity: 0.65,
  },
  {
    size: 8,
    color: "var(--primary)",
    bottom: "6%",
    right: "22%",
    rotate: -22,
    opacity: 0.6,
  },
];

function ConfettiLayer() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {CONFETTI_PIECES.map((piece, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: piece.top,
            bottom: piece.bottom,
            left: piece.left,
            right: piece.right,
            transform: `rotate(${piece.rotate}deg)`,
          }}
        >
          <PomPomShape
            size={piece.size}
            color={piece.color}
            opacity={piece.opacity}
          />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ORDER SUCCESS PAGE — /order/success?orderId=…
// Trái: lời chúc mừng + mã đơn + tiến trình sợi chỉ (bước 1 đã xong).
// Phải: "vé" tóm tắt đơn lấy từ GET /orders/:id (sản phẩm, tiền, thanh
// toán, địa chỉ, ngày giao dự kiến). Đơn chỉ gồm khoá học thì không có
// giao hàng — nút chính dẫn thẳng vào khoá học.
// ═══════════════════════════════════════════════════════════════════

const MAX_ITEMS = 4;

function formatOrderDate(iso?: string): string {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function OrderSuccess() {
  const { t } = useLanguage();
  const { clearCart } = useCart();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [searchParams] = useSearchParams();
  // After paying, the payment gateway redirects back here with the
  // orderId query param.
  const orderId = searchParams.get("orderId") || "";

  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(Boolean(orderId));
  const [copied, setCopied] = useState(false);

  // Clear the cart ONLY when the order is confirmed on this success page —
  // and only when there IS an order (mở trang trống không được xoá giỏ).
  // If the user presses Back or payment fails, their cart is still intact.
  useEffect(() => {
    if (orderId) clearCart();
  }, [clearCart, orderId]);

  // After payment the backend webhook may have granted course purchases
  // (purchasedCourses) — re-fetch the profile so the Buy-Now button turns
  // into the Enroll button on course pages.
  useEffect(() => {
    if (isAuthenticated) {
      void refreshProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Tải đơn để hiện phiếu tóm tắt + ngày giao dự kiến (GHN lead time).
  useEffect(() => {
    if (!orderId || !isAuthenticated) {
      setLoadingOrder(false);
      return;
    }
    let cancelled = false;
    setLoadingOrder(true);
    void (async () => {
      try {
        const { data } = await orderService.getOrderById(orderId);
        if (!cancelled && data.order) setOrder(normalizeOrder(data.order));
      } catch {
        // Order not readable (guest checkout / offline) — chỉ ẩn phiếu tóm tắt.
      } finally {
        if (!cancelled) setLoadingOrder(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, isAuthenticated]);

  const items = order?.items ?? [];
  const courseItems = items.filter((item) => isCourseItem(item));
  const isCourseOnly = items.length > 0 && courseItems.length === items.length;
  const firstCourseId = toId(courseItems[0]?.course);
  const expectedDelivery = order ? formatExpectedDelivery(order.expectedDeliveryTime) : "";
  const paid = order?.payment?.status === "PAID";
  const method = toText(order?.payment?.method);
  const address = order
    ? [order.shippingAddress?.address, order.shippingAddress?.ward, order.shippingAddress?.district, order.shippingAddress?.city]
        .map(toText)
        .filter(Boolean)
        .join(", ")
    : "";
  const code = orderId ? shortId(orderId) : "";

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard bị chặn — bỏ qua, mã vẫn hiển thị để người dùng tự chép.
    }
  };

  const primaryCta = isCourseOnly && firstCourseId
    ? { to: `/learn/${firstCourseId}`, label: "Vào học ngay", icon: GraduationCap }
    : orderId
      ? { to: `/purchased/${orderId}`, label: t("orderSuccess.viewDetails"), icon: ArrowRight }
      : { to: "/purchased", label: "Xem đơn hàng của tôi", icon: ArrowRight };
  const PrimaryIcon = primaryCta.icon;

  return (
    <div className="os-page">
      <ConfettiLayer />

      <div className="os-wrap">
        {/* ── Lời chúc mừng ── */}
        <section className="os-hero" aria-labelledby="os-title">
          <div className="os-gift">
            <LargeGiftBox size={180} />
          </div>

          <span className="os-chip">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("orderSuccess.confirmed")}
          </span>

          <h1 id="os-title" className="os-title">
            {isCourseOnly ? "Khoá học đã sẵn sàng" : t("orderSuccess.heading1")}{" "}
            <em>{isCourseOnly ? "cho bạn!" : t("orderSuccess.heading2")}</em>
          </h1>
          <div className="os-stitch" aria-hidden />
          <p className="os-sub">
            {isCourseOnly
              ? "Bạn có thể bắt đầu học ngay — khoá học đã được thêm vào tài khoản của bạn."
              : t("orderSuccess.subtext")}
          </p>

          {orderId && (
            <div className="os-code">
              <span className="os-code-label">{t("orderSuccess.order")}</span>
              <span className="os-code-value" title={orderId}>
                #{code}
              </span>
              <button type="button" className="os-code-copy" onClick={copyCode} aria-label="Sao chép mã đơn đầy đủ">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Đã chép" : "Chép mã"}
              </button>
            </div>
          )}

          {!isCourseOnly && (
            <div className="os-thread">
              <OrderThread status={order?.orderStatus ?? "PENDING"} />
            </div>
          )}

          <div className="os-ctas">
            <Link to={primaryCta.to} className="os-btn-primary">
              {primaryCta.label}
              <PrimaryIcon className="h-4 w-4" />
            </Link>
            <Link to={isCourseOnly ? "/learn" : "/shop"} className="os-btn-ghost">
              {isCourseOnly ? <BookOpen className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
              {isCourseOnly ? "Xem thêm khoá học" : t("orderSuccess.continueShopping")}
            </Link>
          </div>
        </section>

        {/* ── Phiếu tóm tắt đơn ── */}
        {(loadingOrder || order) && (
          <aside className="os-ticket" aria-label="Tóm tắt đơn hàng">
            <div className="os-ticket-head">
              <p className="os-ticket-eyebrow">Phiếu đơn hàng</p>
              <p className="os-ticket-date">{formatOrderDate(order?.createdAt)}</p>
            </div>

            {loadingOrder ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="os-skeleton h-12" />
                ))}
                <div className="os-skeleton h-24" />
              </div>
            ) : order ? (
              <>
                <ul className="os-items">
                  {items.slice(0, MAX_ITEMS).map((item, idx) => {
                    const course = isCourseItem(item);
                    return (
                      <li key={idx}>
                        <span className="os-item-thumb">
                          {item.image ? (
                            <img src={toText(item.image)} alt="" />
                          ) : course ? (
                            <GraduationCap className="h-4 w-4" />
                          ) : (
                            <Package className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="os-item-name">{toText(item.productName) || "Sản phẩm"}</span>
                          <span className="os-item-meta">
                            {course ? "Khoá học" : [toText(item.color), `×${item.quantity}`].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        {item.price != null && (
                          <span className="os-item-price">{formatPrice((item.price ?? 0) * item.quantity)}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {items.length > MAX_ITEMS && (
                  <p className="os-more">và {items.length - MAX_ITEMS} sản phẩm khác</p>
                )}

                <div className="os-divider" />

                <div className="os-row">
                  <span>Tạm tính</span>
                  <span>{formatPrice(order.itemsPrice)}</span>
                </div>
                {!isCourseOnly && (
                  <div className="os-row">
                    <span>Phí giao hàng</span>
                    <span>{formatPrice(order.shippingFee)}</span>
                  </div>
                )}
                {order.discount != null && order.discount > 0 && (
                  <div className="os-row">
                    <span>Giảm giá</span>
                    <span className="text-[var(--success-text)]">-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="os-total">
                  <span>Tổng cộng</span>
                  <strong>{formatPrice(order.totalPrice)}</strong>
                </div>

                <div className="os-divider" />

                <div className="os-facts">
                  <div className="os-fact">
                    {method === "SEPAY" ? <CreditCard className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                    <span>
                      <span className="os-fact-label">Thanh toán</span>
                      {PAYMENT_METHOD_LABELS[method] ?? (method || "—")}
                      <span className={`badge ${paid ? "badge-green" : "badge-orange"} ml-2`}>
                        {paid ? "Đã thanh toán" : method === "SEPAY" ? "Đang chờ xác nhận" : "Trả khi nhận hàng"}
                      </span>
                    </span>
                  </div>
                  {!isCourseOnly && address && (
                    <div className="os-fact">
                      <MapPin className="h-4 w-4" />
                      <span>
                        <span className="os-fact-label">Giao đến</span>
                        <strong className="font-semibold text-foreground">
                          {toText(order.shippingAddress?.fullName)}
                        </strong>
                        {order.shippingAddress?.phone && ` · ${toText(order.shippingAddress.phone)}`}
                        <br />
                        {address}
                      </span>
                    </div>
                  )}
                  {!isCourseOnly && expectedDelivery && (
                    <div className="os-fact is-highlight">
                      <Truck className="h-4 w-4" />
                      <span>
                        <span className="os-fact-label">Dự kiến nhận hàng</span>
                        {expectedDelivery}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </aside>
        )}
      </div>
    </div>
  );
}
