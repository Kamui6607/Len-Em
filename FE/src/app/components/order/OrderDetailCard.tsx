// ============================================================
// OrderDetailCard — shared component for both customer & admin views
// Props:
//   - order: Order object
//   - isAdminView: bool — if true, shows status dropdown; if false, shows cancel button
//   - onStatusChange?: callback when admin changes status
//   - onCancel?: callback when customer cancels
// ============================================================

import { useState } from "react";
import { Package, MapPin, CreditCard, Calendar, AlertCircle } from "lucide-react";
import { formatPrice } from "../../../lib/formatPrice";
import { ColorSwatch } from "../ui/ColorSwatch";
import {
  ORDER_STATUS_LABELS,
  getOrderStatusStyle,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
  VALID_TRANSITIONS,
} from "../../../constants/orderStatus";
import type { Order, OrderStatus } from "../../../features/orders/types/order.types";
import { normalizeOrder } from "../../../features/orders/types/order.types";
import { ReportButton } from "../ReportButton";

interface OrderDetailCardProps {
  order: Order;
  isAdminView?: boolean;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onCancel?: (orderId: string, reason: string) => Promise<void>;
  onReport?: (orderId: string) => void;
}

export function OrderDetailCard({
  order,
  isAdminView = false,
  onStatusChange,
  onCancel,
}: OrderDetailCardProps) {
  const normalized = normalizeOrder(order);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const canChangeStatus = isAdminView && VALID_TRANSITIONS[normalized.orderStatus]?.length > 0;
  const availableTransitions = VALID_TRANSITIONS[normalized.orderStatus] ?? [];
  const canCancel = !isAdminView && normalized.orderStatus === "PENDING";

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

  const createdAt = normalized.createdAt
    ? new Date(normalized.createdAt).toLocaleString("vi-VN")
    : "N/A";

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
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium"
              style={getOrderStatusStyle(normalized.orderStatus)}
            >
              {ORDER_STATUS_LABELS[normalized.orderStatus]}
            </span>
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
            <span className="text-sm font-medium text-muted-foreground">Cập nhật trạng thái:</span>
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
          {normalized.items.map((item, idx) => (
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
                    <ColorSwatch hexCode={item.hexCode} colorName={item.color} size="sm" />
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
              {item.price != null && (
                <p className="font-medium text-sm flex-shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </p>
              )}
            </div>
          ))}
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
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                PAYMENT_STATUS_COLORS[normalized.payment?.status]
              }`}
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
            <span>{formatPrice(normalized.itemsPrice)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Phí giao hàng</span>
            <span>{formatPrice(normalized.shippingFee)}</span>
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
    </div>
  );
}