// ============================================================
// OrderDetailCard — shared component for both customer & admin views
// Props:
//   - order: Order object
//   - isAdminView: bool — if false, shows cancel button
//   - onStatusChange?: callback when admin changes status
//   - onCancel?: callback when customer cancels
// ============================================================

import { useState, useEffect } from "react";
import {
  Package,
  PackageOpen,
  MapPin,
  CreditCard,
  Calendar,
  AlertCircle,
  Clock,
  Phone,
  ShoppingBag,
  Star,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../../../lib/formatPrice";
import {
  ORDER_STATUS_LABELS,
  getOrderStatusBadgeClass,
  getPaymentStatusBadgeClass,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  VALID_TRANSITIONS,
} from "../../../constants/orderStatus";
import type { Order, OrderItem, OrderStatus } from "../../../features/orders/types/order.types";
import { normalizeOrder, isCourseItem } from "../../../features/orders/types/order.types";
import { ReportButton } from "../ReportButton";
import { OrderThread } from "./OrderThread";
import { kitService } from "../../api/kitService";
import { productService } from "../../api/productService";
import { useReviews } from "../../contexts/ReviewContext";
import { formatExpectedDelivery, isAwaitingDelivery } from "../../../lib/orderDelivery";
import "../../../styles/purchased.css";

interface OrderDetailCardProps {
  order: Order;
  isAdminView?: boolean;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onCancel?: (orderId: string, reason: string) => Promise<void>;
  onReport?: (orderId: string) => void;
  onRetryPayment?: (orderId: string) => Promise<void>;
}

/** Order items grouped by kit — items without kitId stay as standalone items */
function groupItemsByKit(orderItems: Order["items"]) {
  const kitGroups: { kitId: string; items: typeof orderItems }[] = [];
  const standalone: typeof orderItems = [];

  orderItems.forEach((item) => {
    if (item.kitId) {
      let group = kitGroups.find((g) => g.kitId === item.kitId);
      if (!group) {
        group = { kitId: item.kitId, items: [] };
        kitGroups.push(group);
      }
      group.items.push(item);
    } else {
      standalone.push(item);
    }
  });

  return { kitGroups, standalone };
}

/**
 * Backend fills `expectedDeliveryTime` from the GHN lead-time API as soon as
 * the order is created (it may be null when GHN could not be reached).
 * Formatting/eligibility helpers live in `src/lib/orderDelivery.ts`.
 */

export function OrderDetailCard({
  order,
  isAdminView = false,
  onStatusChange,
  onCancel,
  onRetryPayment,
}: OrderDetailCardProps) {
  const normalized = normalizeOrder(order);
  const { addReview, hasReviewed } = useReviews();
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [kitNames, setKitNames] = useState<Record<string, string>>({});
  const [kitNamesLoaded, setKitNamesLoaded] = useState(false);
  const [ratingModal, setRatingModal] = useState<{
    itemId: string;
    itemName: string;
    kitId?: string;
  } | null>(null);
  const [rating, setRating] = useState(5);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Fetch kit names for all unique kitIds in the order
  useEffect(() => {
    async function loadKitNames() {
      const uniqueKitIds = new Set<string>();
      normalized.items.forEach((item) => {
        if (item.kitId) uniqueKitIds.add(item.kitId);
      });

      if (uniqueKitIds.size > 0) {
        const kitPromises = Array.from(uniqueKitIds).map(async (kitId) => {
          try {
            const { data: kitData } = await kitService.getById(kitId);
            return { kitId, name: kitData.data?.kit?.name };
          } catch {
            return { kitId, name: null };
          }
        });
        const kitResults = await Promise.all(kitPromises);
        const kitNameMap = kitResults.reduce(
          (acc, { kitId, name }) => {
            if (name) acc[kitId] = name;
            return acc;
          },
          {} as Record<string, string>,
        );
        setKitNames(kitNameMap);
      }
      setKitNamesLoaded(true);
    }
    loadKitNames();
  }, [normalized.items]);

  const canChangeStatus =
    isAdminView && VALID_TRANSITIONS[normalized.orderStatus]?.length > 0;
  const availableTransitions = VALID_TRANSITIONS[normalized.orderStatus] ?? [];
  const isUnpaid = false;
  const canCancel = !isAdminView && normalized.orderStatus === "PENDING" && !normalized.isCancelRequested;
  /** Order is PENDING and has been cancelled (has refund invoice) */
  const isCancelRequested =
    normalized.isCancelRequested && normalized.orderStatus === "PENDING";
  const canRetryPayment = false;
  /** Order can be rated if it's not PENDING or CANCELLED */
  const canRate = !isAdminView && !["PENDING", "CANCELLED"].includes(normalized.orderStatus);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!onStatusChange) return;
    setStatusUpdating(true);
    try {
      await onStatusChange(normalized._id, newStatus);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel || !cancelReason.trim()) return;
    setCancelling(true);
    try {
      await onCancel(normalized._id, cancelReason.trim());
      setShowCancelModal(false);
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingModal) return;
    setSubmittingRating(true);
    try {
      if (ratingModal.kitId) {
        // Rate the kit
        await kitService.rate(ratingModal.kitId, rating);
      } else {
        // Rate the product
        await productService.rateProduct(ratingModal.itemId, rating);
      }

      // Add to review context
      addReview({
        orderId: normalized._id,
        productId: ratingModal.itemId,
        productName: ratingModal.itemName,
        userId: "current-user",
        userName: "User",
        rating,
        comment: "",
      });

      toast.success("Đánh giá thành công!");
      setRatingModal(null);
      setRating(5);
    } catch {
      toast.error("Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setSubmittingRating(false);
    }
  };

  const createdAt = normalized.createdAt
    ? new Date(normalized.createdAt).toLocaleString("vi-VN")
    : "N/A";

  // GHN lead time — shown from the moment the order is created, hidden once
  // the order is finished (delivered / cancelled) because it is no longer useful.
  const expectedDelivery = isAwaitingDelivery(normalized.orderStatus)
    ? formatExpectedDelivery(normalized.expectedDeliveryTime)
    : "";

  const subtotal = normalized.itemsPrice || 0;
  const shippingFee = normalized.shippingFee || 0;
  const { kitGroups, standalone } = groupItemsByKit(normalized.items);
  const itemCount = normalized.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const address = normalized.shippingAddress;

  const retryPayment = async () => {
    if (!onRetryPayment) return;
    setRetrying(true);
    try {
      await onRetryPayment(normalized._id);
    } finally {
      setRetrying(false);
    }
  };

  /** 1 dòng sản phẩm — cùng bố cục với danh sách /purchased */
  const renderItem = (item: OrderItem, key: string, kitId?: string) => {
    const reviewed = hasReviewed(normalized._id, item.productId);
    const rateable = canRate && !isCourseItem(item);
    const lineTotal = (item.price ?? 0) * item.quantity;

    return (
      <div key={key} className="purchased-item-row order-detail-item">
        <div className="purchased-item-thumb">
          {item.image ? (
            <img
              src={item.image}
              alt={item.productName || "Sản phẩm"}
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.fallback) {
                  target.dataset.fallback = "true";
                  target.src = `https://picsum.photos/seed/${item.productId}/100/100`;
                }
              }}
            />
          ) : (
            <Package className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        <div className="purchased-item-info">
          <p className="purchased-item-name">
            {item.productName || `Product ${item.productId}`}
          </p>
          <div className="purchased-item-meta">
            <span className="purchased-qty-chip">x{item.quantity}</span>
            {item.color && (
              <span>
                {item.hexCode && (
                  <span
                    className="purchased-color-dot"
                    style={{ backgroundColor: item.hexCode }}
                  />
                )}
                {item.color}
              </span>
            )}
          </div>
          {rateable && (
            <div className="purchased-item-review-row">
              {!reviewed ? (
                <button
                  onClick={() =>
                    setRatingModal({
                      itemId: item.productId,
                      itemName: item.productName || "Sản phẩm",
                      kitId,
                    })
                  }
                  className="purchased-review-btn"
                >
                  <Star className="w-3 h-3" /> Đánh giá
                </button>
              ) : (
                <span className="purchased-reviewed-label">
                  <Star className="w-3 h-3 fill-[var(--rating-star)] text-[var(--rating-star)]" />
                  Đã đánh giá
                </span>
              )}
            </div>
          )}
        </div>

        <div className="purchased-item-price">
          {item.price != null ? (
            <>
              <span className="line-total">{formatPrice(lineTotal)}</span>
              {item.quantity > 1 && (
                <span className="unit-price">{formatPrice(item.price)} / 1</span>
              )}
            </>
          ) : (
            <span className="line-total">—</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* ── Hero: mã đơn + sợi chỉ tiến trình ── */}
      <section className="order-detail-panel order-detail-hero">
        <div className="order-detail-hero-top">
          <div className="min-w-0">
            <p className="order-detail-eyebrow">Chi tiết đơn len</p>
            <h1 className="order-detail-title">
              Đơn hàng #{normalized._id.slice(-8).toUpperCase()}
            </h1>
            <div className="order-detail-meta">
              <span>
                <Calendar className="w-3.5 h-3.5" />
                {createdAt}
              </span>
              <span>
                <Package className="w-3.5 h-3.5" />
                {itemCount} sản phẩm
              </span>
            </div>
          </div>

          <div className="order-detail-hero-actions">
            <span className={`badge ${getOrderStatusBadgeClass(normalized.orderStatus)}`}>
              {ORDER_STATUS_LABELS[normalized.orderStatus] ?? normalized.orderStatus}
            </span>
            {(isUnpaid || canRetryPayment) && (
              <button
                onClick={retryPayment}
                disabled={retrying}
                className="purchased-action-btn is-primary"
              >
                <CreditCard className="w-3.5 h-3.5" />
                {retrying ? "..." : "Thanh toán lại"}
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="purchased-action-btn is-danger"
              >
                <XCircle className="w-3.5 h-3.5" />
                Huỷ đơn
              </button>
            )}
            {!isAdminView && (
              <span className="purchased-report-cell">
                <ReportButton
                  targetType="purchased_order"
                  targetId={normalized._id}
                  targetTitle={`Order ${normalized._id}`}
                />
              </span>
            )}
          </div>
        </div>

        <div className="order-detail-thread">
          <OrderThread status={normalized.orderStatus} />
        </div>

        {expectedDelivery && (
          <div className="order-detail-callout is-info">
            <Truck className="w-4 h-4 flex-shrink-0 text-[var(--primary)]" />
            <span>
              Dự kiến nhận hàng vào <strong>{expectedDelivery}</strong>
            </span>
          </div>
        )}
        {isCancelRequested && (
          <div className="order-detail-callout is-warning">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>Yêu cầu huỷ đơn đang chờ cửa hàng duyệt.</span>
          </div>
        )}
        {normalized.cancelReason && (
          <div className="order-detail-callout is-error">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Lý do huỷ</p>
              <p className="text-[var(--foreground-secondary)] mt-0.5">
                {normalized.cancelReason}
              </p>
            </div>
          </div>
        )}

        {/* Admin status changer */}
        {canChangeStatus && (
          <div className="order-detail-admin">
            <span className="text-sm font-medium text-muted-foreground">
              Cập nhật trạng thái:
            </span>
            <div className="flex flex-wrap gap-2">
              {availableTransitions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={statusUpdating}
                  className={`purchased-action-btn ${
                    status === "CANCELLED" ? "is-danger" : "is-soft"
                  }`}
                >
                  {statusUpdating ? "..." : ORDER_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="order-detail-grid">
        <div className="order-detail-main">
          {/* ── Sản phẩm ── */}
          <section className="order-detail-panel" style={{ animationDelay: "60ms" }}>
            <h2 className="order-detail-section-title">
              <span className="order-detail-section-icon">
                <ShoppingBag className="w-4 h-4" />
              </span>
              Sản phẩm trong đơn
            </h2>
            {kitNamesLoaded &&
              kitGroups.map((group) => {
                const kitName = kitNames[group.kitId];
                if (!kitName) return null;
                return (
                  <div key={group.kitId} className="purchased-kit-group">
                    <div className="purchased-kit-header">
                      <span className="purchased-kit-icon">
                        <PackageOpen className="w-3.5 h-3.5" />
                      </span>
                      <p className="purchased-kit-title">{kitName}</p>
                    </div>
                    {group.items.map((item, idx) =>
                      renderItem(item, `${group.kitId}-${idx}`, group.kitId),
                    )}
                  </div>
                );
              })}
            {standalone.map((item, idx) => renderItem(item, `item-${idx}`))}
          </section>

          {/* ── Địa chỉ giao hàng ── */}
          <section className="order-detail-panel" style={{ animationDelay: "120ms" }}>
            <h2 className="order-detail-section-title">
              <span className="order-detail-section-icon">
                <MapPin className="w-4 h-4" />
              </span>
              Giao đến
            </h2>
            <div className="order-detail-address">
              <p className="order-detail-address-name">{address?.fullName}</p>
              {address?.phone && (
                <p className="flex items-center gap-1.5 text-[var(--foreground-secondary)]">
                  <Phone className="w-3.5 h-3.5" />
                  {address.phone}
                </p>
              )}
              <p className="text-[var(--foreground-muted)] mt-1">
                {[address?.address, address?.ward, address?.district, address?.city]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </section>
        </div>

        {/* ── Vé thanh toán ── */}
        <aside className="order-detail-aside">
          <section
            className="order-detail-panel order-detail-ticket"
            style={{ animationDelay: "90ms" }}
          >
            <h2 className="order-detail-section-title">
              <span className="order-detail-section-icon">
                <CreditCard className="w-4 h-4" />
              </span>
              Thanh toán
            </h2>
            <div className="order-detail-row">
              <span>Phương thức</span>
              <span>
                {PAYMENT_METHOD_LABELS[normalized.payment?.method ?? ""] ||
                  normalized.payment?.method ||
                  "N/A"}
              </span>
            </div>
            <div className="order-detail-row">
              <span>Trạng thái</span>
              <span
                className={`badge ${getPaymentStatusBadgeClass(normalized.payment?.status ?? "")}`}
              >
                {PAYMENT_STATUS_LABELS[normalized.payment?.status] ||
                  normalized.payment?.status}
              </span>
            </div>
            {normalized.payment?.transactionNo && (
              <div className="order-detail-row">
                <span>Mã giao dịch</span>
                <span className="font-mono text-xs break-all">
                  {normalized.payment.transactionNo}
                </span>
              </div>
            )}

            <div className="order-detail-divider" />

            <div className="order-detail-row">
              <span>Tạm tính</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="order-detail-row">
              <span>Phí giao hàng</span>
              <span>{formatPrice(shippingFee)}</span>
            </div>
            {normalized.discount != null && normalized.discount > 0 && (
              <div className="order-detail-row">
                <span>Giảm giá</span>
                <span className="text-[var(--success-text)]">
                  -{formatPrice(normalized.discount)}
                </span>
              </div>
            )}
            {/* 🪙 Coin system — tạm tắt, sẽ bật lại khi phát triển tính năng dùng Coin:
            {normalized.coinUsed != null && normalized.coinUsed > 0 && (
              <div className="order-detail-row">
                <span>Xu đã dùng</span>
                <span>-{formatPrice(normalized.coinUsed)}</span>
              </div>
            )}
            */}

            <div className="order-detail-divider" />

            <div className="order-detail-grand">
              <span className="order-detail-grand-label">Tổng cộng</span>
              <span className="order-detail-grand-value">
                {formatPrice(normalized.totalPrice)}
              </span>
            </div>

            {!isAdminView && (
              <p className="order-detail-note">Cảm ơn bạn đã đan cùng chúng mình ♡</p>
            )}
          </section>
        </aside>
      </div>

      {/* ── Cancel Modal ── */}
      {showCancelModal && (
        <div className="order-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="order-modal-title">Huỷ đơn hàng</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Vui lòng cho chúng tôi biết lý do bạn muốn huỷ đơn hàng này.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do huỷ..."
              rows={3}
              className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-full border border-border hover:bg-muted transition-colors text-sm font-medium"
              >
                Trở lại
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling || !cancelReason.trim()}
                className="flex-1 py-3 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {cancelling ? "Đang huỷ..." : "Xác nhận huỷ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rating Modal ── */}
      {ratingModal && (
        <div className="order-modal-overlay" onClick={() => setRatingModal(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="order-modal-title">Đánh giá sản phẩm</h3>
            <p className="text-xs text-muted-foreground mb-4">{ratingModal.itemName}</p>
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setRating(i + 1)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${i < rating ? "fill-[var(--rating-star)] text-[var(--rating-star)]" : "text-muted-foreground/30"}`}
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setRatingModal(null)}
                className="flex-1 py-2.5 rounded-full text-sm border border-border hover:bg-muted transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={submittingRating}
                className="flex-1 py-2.5 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submittingRating ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
