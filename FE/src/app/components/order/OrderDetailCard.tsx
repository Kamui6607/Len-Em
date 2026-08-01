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
  MapPin,
  CreditCard,
  Calendar,
  AlertCircle,
  Star,
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
import type { Order, OrderStatus } from "../../../features/orders/types/order.types";
import { normalizeOrder } from "../../../features/orders/types/order.types";
import { ReportButton } from "../ReportButton";
import { kitService } from "../../../api/kitService";
import { productService } from "../../../api/productService";
import { useReviews } from "../../../app/context/ReviewContext";

interface OrderDetailCardProps {
  order: Order;
  isAdminView?: boolean;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onCancel?: (orderId: string, reason: string) => Promise<void>;
  onReport?: (orderId: string) => void;
  onRetryPayment?: (orderId: string) => Promise<void>;
}

/** Group items by kitId — items without kitId stay as standalone items */
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
  /** PENDING + unpaid (VNPAY/MOMO) → show retry payment button */
  const isUnpaid =
    !isAdminView &&
    normalized.orderStatus === "PENDING" &&
    (normalized.payment.method === "VNPAY" ||
      normalized.payment.method === "MOMO") &&
    normalized.payment.status === "PENDING";
  /** PENDING + not unpaid → show cancel (only if no refund invoice exists) */
  const canCancel =
    !isAdminView &&
    normalized.orderStatus === "PENDING" &&
    !normalized.isCancelRequested &&
    normalized.payment.status !== "PENDING";
  /** Order is PENDING and has been cancelled (has refund invoice) */
  const isCancelRequested =
    normalized.isCancelRequested && normalized.orderStatus === "PENDING";
  /** CANCELLED + VNPAY/MOMO + not PAID → show retry payment button */
  const canRetryPayment =
    !isAdminView &&
    normalized.orderStatus === "CANCELLED" &&
    (normalized.payment.method === "VNPAY" ||
      normalized.payment.method === "MOMO") &&
    normalized.payment.status !== "PAID";
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

  // Calculate shipping fee percentage for display
  const subtotal = normalized.itemsPrice || 0;
  const shippingFee = normalized.shippingFee || 0;
  const shippingPercent = subtotal > 0 ? Math.round((shippingFee / subtotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── Order Header ── */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold">
              Đơn hàng #{normalized._id.slice(-8).toUpperCase()}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Calendar className="w-4 h-4" />
              <span>{createdAt}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`badge ${getOrderStatusBadgeClass(normalized.orderStatus)}`}
            >
              {ORDER_STATUS_LABELS[normalized.orderStatus]}
            </span>
            {isUnpaid && (
              <button
                onClick={async () => {
                  if (!onRetryPayment) return;
                  setRetrying(true);
                  try {
                    await onRetryPayment(normalized._id);
                  } finally {
                    setRetrying(false);
                  }
                }}
                disabled={retrying}
                className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors font-medium"
              >
                {retrying ? "..." : "💳 Thanh toán lại"}
              </button>
            )}
            {isCancelRequested && (
              <span className="text-sm bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-4 py-1.5 rounded-full font-medium">
                ⏳ Đang chờ duyệt huỷ
              </span>
            )}
            {canRetryPayment && (
              <button
                onClick={async () => {
                  if (!onRetryPayment) return;
                  setRetrying(true);
                  try {
                    await onRetryPayment(normalized._id);
                  } finally {
                    setRetrying(false);
                  }
                }}
                disabled={retrying}
                className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors font-medium"
              >
                {retrying ? "..." : "💳 Thanh toán lại"}
              </button>
            )}
            {canCancel && !isAdminView && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="text-sm bg-destructive/10 text-destructive px-4 py-1.5 rounded-full hover:bg-destructive/20 transition-colors font-medium"
              >
                Huỷ đơn
              </button>
            )}
            {!isAdminView && (
              <ReportButton
                targetType="purchased_order"
                targetId={normalized._id}
                targetTitle={`Order ${normalized._id}`}
              />
            )}
          </div>
        </div>

        {/* Admin status changer */}
        {canChangeStatus && (
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <span className="text-sm font-medium text-muted-foreground">
              Cập nhật trạng thái:
            </span>
            <div className="flex flex-wrap gap-2">
              {availableTransitions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={statusUpdating}
                  className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
                    status === "CANCELLED"
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  } disabled:opacity-50`}
                >
                  {statusUpdating ? "..." : ORDER_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Items ── */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Sản phẩm</h3>
        </div>
        <div className="space-y-3">
          {(() => {
            const { kitGroups, standalone } = groupItemsByKit(normalized.items);
            return (
              <>
                {/* Kit groups - only show after kit names are loaded */}
                {kitNamesLoaded &&
                  kitGroups.map((group) => {
                    const kitName = kitNames[group.kitId];
                    if (!kitName) return null;
                    return (
                      <div
                        key={group.kitId}
                        className="border border-primary/20 rounded-xl p-3 bg-primary/5 space-y-2"
                      >
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                          🎁 {kitName}
                        </p>
                        {group.items.map((item, idx) => {
                          const reviewed = hasReviewed(normalized._id, item.productId);
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between py-1.5"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {item.productName ||
                                    `Product ${item.productId}`}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>x{item.quantity}</span>
                                  {item.color && <span>{item.color}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                {canRate && !reviewed && (
                                  <button
                                    onClick={() => setRatingModal({
                                      itemId: item.productId,
                                      itemName: item.productName || "Sản phẩm",
                                      kitId: group.kitId,
                                    })}
                                    className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                                  >
                                    <Star className="w-3 h-3 inline mr-1" />
                                    Đánh giá
                                  </button>
                                )}
                                {canRate && reviewed && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    Đã đánh giá
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                {/* Standalone items */}
                {standalone.map((item, idx) => {
                  const reviewed = hasReviewed(normalized._id, item.productId);
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 py-3 border-b border-border last:border-0"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName || "Sản phẩm"}
                          className="w-16 h-16 rounded-lg object-cover bg-muted flex-shrink-0"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = "true";
                              target.src = `https://picsum.photos/seed/${item.productId}/100/100`;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.productName || "Sản phẩm"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.hexCode && (
                            <span
                              className="inline-block w-3 h-3 rounded-full border border-border"
                              style={{ backgroundColor: item.hexCode }}
                            />
                          )}
                          {item.color && (
                            <span className="text-xs text-muted-foreground">{item.color}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          SL: {item.quantity}
                          {item.price != null && ` x ${formatPrice(item.price)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {canRate && !reviewed && (
                          <button
                            onClick={() => setRatingModal({
                              itemId: item.productId,
                              itemName: item.productName || "Sản phẩm",
                            })}
                            className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                          >
                            <Star className="w-3 h-3 inline mr-1" />
                            Đánh giá
                          </button>
                        )}
                        {canRate && reviewed && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            Đã đánh giá
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      </div>

      {/* ── Shipping Address ── */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Địa chỉ giao hàng</h3>
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-medium">{normalized.shippingAddress?.fullName}</p>
          <p className="text-muted-foreground">{normalized.shippingAddress?.phone}</p>
          <p className="text-muted-foreground">
            {[
              normalized.shippingAddress?.address,
              normalized.shippingAddress?.ward,
              normalized.shippingAddress?.district,
              normalized.shippingAddress?.city,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
      </div>

      {/* ── Payment Info ── */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Thanh toán</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phương thức</span>
            <span className="font-medium">
              {PAYMENT_METHOD_LABELS[normalized.payment?.method ?? ""] || normalized.payment?.method || "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Trạng thái</span>
            <span
              className={`badge ${getPaymentStatusBadgeClass(normalized.payment?.status ?? "")}`}
            >
              {PAYMENT_STATUS_LABELS[normalized.payment?.status] || normalized.payment?.status}
            </span>
          </div>
          {normalized.payment?.transactionNo && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mã giao dịch</span>
              <span className="font-medium">{normalized.payment.transactionNo}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Order Total ── */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Tạm tính</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Phí giao hàng ({shippingPercent}%)</span>
            <span>{formatPrice(shippingFee)}</span>
          </div>
          {normalized.discount != null && normalized.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Giảm giá</span>
              <span>-{formatPrice(normalized.discount)}</span>
            </div>
          )}
          {normalized.coinUsed != null && normalized.coinUsed > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>Xu đã dùng</span>
              <span>-{formatPrice(normalized.coinUsed)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
            <span>Tổng cộng</span>
            <span className="text-primary">{formatPrice(normalized.totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* ── Cancel Reason ── */}
      {normalized.cancelReason && (
        <div className="bg-card rounded-2xl border border-destructive/30 p-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">Lý do huỷ</h3>
              <p className="text-sm text-muted-foreground mt-1">{normalized.cancelReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full border border-border shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Huỷ đơn hàng</h3>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setRatingModal(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-1">Đánh giá sản phẩm</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {ratingModal.itemName}
            </p>
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setRating(i + 1)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
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