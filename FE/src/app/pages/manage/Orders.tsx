// ============================================================
// Manage Orders — route /manage/orders
// For Admin & Staff: DataTable with filters, pagination, status management
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { orderApi } from "../../../api/orderService";
import { formatPrice } from "../../../lib/formatPrice";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  VALID_TRANSITIONS,
} from "../../../constants/orderStatus";
import type { Order, OrderStatus, PaymentStatus } from "../../../features/orders/types/order.types";
import { normalizeOrder } from "../../../features/orders/types/order.types";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED",
];

const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];

const PAGE_SIZE = 20;

export function ManageOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Selected order for detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await orderApi.getAllOrders({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        search: searchTerm || undefined,
      });
      setOrders((data.orders ?? []).map(normalizeOrder));
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, paymentFilter, searchTerm]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await orderApi.updateOrderStatus(orderId, { orderStatus: newStatus });
      toast.success(`Đã cập nhật trạng thái thành "${ORDER_STATUS_LABELS[newStatus]}"`);
      // Refresh list and detail if open
      loadOrders();
      if (selectedOrder?._id === orderId) {
        const { data } = await orderApi.getOrderById(orderId);
        setSelectedOrder(data.order ?? null);
      }
    } catch {
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Quản lý đơn hàng</h1>
          <p className="text-muted-foreground text-sm">
            Tổng số: {total} đơn hàng
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:bg-muted transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã đơn, tên khách hàng..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Tất cả</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Payment filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Thanh toán:</span>
            <select
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Tất cả</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PAYMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Không tìm thấy đơn hàng nào
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Mã đơn
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tổng tiền
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Thanh toán
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ngày tạo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetail(true);
                      }}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-sm">
                          #{order._id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">
                          {order.shippingAddress?.fullName || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.shippingAddress?.phone || ""}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-sm">
                          {formatPrice(order.totalPrice)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${
                            ORDER_STATUS_COLORS[order.orderStatus]
                          }`}
                        >
                          {ORDER_STATUS_LABELS[order.orderStatus]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${
                            PAYMENT_STATUS_COLORS[order.payment?.status]
                          }`}
                        >
                          {PAYMENT_STATUS_LABELS[order.payment?.status] || order.payment?.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {orders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowDetail(true);
                  }}
                  className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-sm">
                      #{order._id.slice(-8).toUpperCase()}
                    </span>
                    <span className="font-semibold text-sm">
                      {formatPrice(order.totalPrice)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {order.shippingAddress?.fullName || "N/A"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
                        ORDER_STATUS_COLORS[order.orderStatus]
                      }`}
                    >
                      {ORDER_STATUS_LABELS[order.orderStatus]}
                    </span>
                    <span
                      className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
                        PAYMENT_STATUS_COLORS[order.payment?.status]
                      }`}
                    >
                      {PAYMENT_STATUS_LABELS[order.payment?.status] || order.payment?.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Trang {page} / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-full border border-border hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-full border border-border hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {showDetail && selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-8 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDetail(false);
          }}
        >
          <div className="bg-card rounded-2xl max-w-3xl w-full border border-border shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold">
                Đơn hàng #{selectedOrder._id.slice(-8).toUpperCase()}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Đóng
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Status changer */}
              {VALID_TRANSITIONS[selectedOrder.orderStatus]?.length > 0 && (
                <div className="flex items-center gap-3 mb-6 p-4 bg-muted/30 rounded-xl">
                  <span className="text-sm font-medium text-muted-foreground">
                    Cập nhật trạng thái:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {VALID_TRANSITIONS[selectedOrder.orderStatus].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedOrder._id, status)}
                        className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
                          status === "CANCELLED"
                            ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold">Sản phẩm</h3>
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 py-2 border-b border-border last:border-0"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.productName || "Sản phẩm"}
                        className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallback) {
                            target.dataset.fallback = "true";
                            target.src = `https://picsum.photos/seed/${item.productId}/100/100`;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-muted-foreground">N/A</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.productName || "Sản phẩm"}</p>
                      <p className="text-xs text-muted-foreground">
                        SL: {item.quantity}
                        {item.color && ` — Màu: ${item.color}`}
                        {item.price != null && ` x ${formatPrice(item.price)}`}
                      </p>
                    </div>
                    {item.price != null && (
                      <p className="text-sm font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Shipping */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Địa chỉ giao hàng</h3>
                <p className="text-sm">{selectedOrder.shippingAddress?.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder.shippingAddress?.phone}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[
                    selectedOrder.shippingAddress?.address,
                    selectedOrder.shippingAddress?.ward,
                    selectedOrder.shippingAddress?.district,
                    selectedOrder.shippingAddress?.city,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>

              {/* Payment */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Thanh toán</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Phương thức: </span>
                    {selectedOrder.payment?.method || "N/A"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Trạng thái: </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        PAYMENT_STATUS_COLORS[selectedOrder.payment?.status]
                      }`}
                    >
                      {PAYMENT_STATUS_LABELS[selectedOrder.payment?.status] ||
                        selectedOrder.payment?.status}
                    </span>
                  </p>
                  {selectedOrder.payment?.transactionNo && (
                    <p>
                      <span className="text-muted-foreground">Mã GD: </span>
                      {selectedOrder.payment.transactionNo}
                    </p>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatPrice(selectedOrder.itemsPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí giao hàng</span>
                  <span>{formatPrice(selectedOrder.shippingFee)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{formatPrice(selectedOrder.totalPrice)}</span>
                </div>
              </div>

              {/* Cancel reason */}
              {selectedOrder.cancelReason && (
                <div className="mt-4 p-3 bg-destructive/10 rounded-xl border border-destructive/30">
                  <p className="text-sm font-medium text-destructive">Lý do huỷ</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedOrder.cancelReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}