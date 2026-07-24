import { useState, useEffect } from "react";
import { Search, ChevronUp, ChevronDown, Check, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../../../lib/formatPrice";
import { useAdmin } from "../../context/AdminContext";
import { orderService } from "../../../features/orders/services/order.service";
import type {
  Order,
  OrderStatus,
} from "../../../features/orders/types/order.types";
import { normalizeOrder } from "../../../features/orders/types/order.types";

type OrderFilter = "all" | OrderStatus;

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED",
];

type SortField = "order" | "customer" | "date" | "total" | "status";
type SortDirection = "asc" | "desc";

export function AdminOrders() {
  const { logActivity } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        const { data: response } = await orderService.getAllOrders({
          page: 1,
          limit: 20,
        });
        setOrders(response.orders.map(normalizeOrder));
      } catch {
        // API unavailable — show empty state (demo mode / offline)
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.shippingAddress?.fullName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || order.orderStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const handleConfirmPayment = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, {
        orderStatus: "CONFIRMED",
      });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? {
                ...o,
                orderStatus: "CONFIRMED" as const,
                payment: { ...o.payment, status: "PAID" as const },
              }
            : o,
        ),
      );
      logActivity({
        type: "payment_confirmed",
        userId: "admin",
        userName: "Admin",
        description: `Confirmed payment for order ${orderId}`,
      });
      toast.success("Order confirmed successfully");
    } catch {
      toast.error("Failed to confirm order");
    }
  };

  const handleStatusUpdate = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    try {
      await orderService.updateOrderStatus(orderId, { orderStatus: newStatus });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, orderStatus: newStatus } : o,
        ),
      );
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleViewDetail = async (orderId: string) => {
    console.log("View detail clicked for order:", orderId);
    setDetailLoading(true);
    try {
      const { data: response } = await orderService.getOrderById(orderId);
      console.log("API response:", response);
      const order = normalizeOrder(response.order);
      console.log("Normalized order:", order);
      setSelectedOrder(order);
      console.log("selectedOrder set to:", order);
    } catch (error) {
      console.error("Error loading order details:", error);
      toast.error("Failed to load order details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  function SortableHeader({
    label,
    field,
    align = "left",
  }: {
    label: string;
    field: SortField;
    align?: "left" | "right";
  }) {
    const active = sortField === field;
    return (
      <th
        className={`px-6 py-4 text-sm font-medium text-muted-foreground ${align === "right" ? "text-right" : "text-left"}`}
      >
        <button
          type="button"
          onClick={() => handleSort(field)}
          className={`group inline-flex items-center gap-1 transition-colors hover:text-foreground focus:outline-none ${active ? "text-foreground" : ""} ${align === "right" ? "flex-row-reverse" : ""}`}
        >
          {label}
          <span className="flex flex-col items-center justify-center -space-y-[3px]">
            <ChevronUp
              className={`w-2.5 h-2.5 ${active && sortDirection === "asc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}
            />
            <ChevronDown
              className={`w-2.5 h-2.5 ${active && sortDirection === "desc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}
            />
          </span>
        </button>
      </th>
    );
  }

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortField) return 0;
    const getValue = (o: Order) => {
      switch (sortField) {
        case "order":
          return o._id;
        case "customer":
          return o.shippingAddress?.fullName || "";
        case "date":
          return new Date(o.createdAt).getTime();
        case "total":
          return o.totalPrice;
        case "status":
          return o.orderStatus;
      }
    };
    const cmp = String(getValue(a)).localeCompare(String(getValue(b)));
    return sortDirection === "asc" ? cmp : -cmp;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="mb-2">Order Management</h1>
          <p className="text-muted-foreground">
            View and manage all orders from the API
          </p>
        </div>
      </div>

      {/* Filters and Table */}
      <div
        className="admin-panel-glow rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Filters */}
        <div
          className="p-6 border-b border-border space-y-3"
          style={{ background: "var(--surface)" }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full"
              style={{
                paddingLeft: "3rem",
                paddingRight: "1rem",
                paddingTop: "0.75rem",
                paddingBottom: "0.75rem",
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", ...ORDER_STATUSES] as OrderFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`order-filter-btn px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 text-sm font-medium ${
                  filter === status ? "active" : ""
                }`}
              >
                {status.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto" style={{ background: "var(--card)" }}>
          <table className="admin-table w-full">
            <thead className="bg-muted">
              <tr>
                <SortableHeader label="Order" field="order" />
                <SortableHeader label="Customer" field="customer" />
                <SortableHeader label="Date" field="date" />
                <SortableHeader label="Total" field="total" align="right" />
                <SortableHeader label="Status" field="status" />
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.length > 0 ? (
                sortedOrders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => handleViewDetail(order._id)}
                    className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-sm">
                          #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.payment.method}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm">
                          {order.shippingAddress?.fullName || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.shippingAddress?.phone || "N/A"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td
                      className="px-6 py-4 text-sm font-semibold"
                      style={{ color: "var(--primary)" }}
                    >
                      {formatPrice(order.totalPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`badge ${
                          order.orderStatus === "DELIVERED"
                            ? "badge-green"
                            : ["CONFIRMED", "PREPARING", "SHIPPING"].includes(
                                  order.orderStatus,
                                )
                              ? "badge-blue"
                              : order.orderStatus === "PENDING"
                                ? "badge-orange"
                                : order.orderStatus === "CANCELLED"
                                  ? "badge-red"
                                  : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                     <td className="px-6 py-4 text-left">
                      <div className="flex items-center justify-start gap-1.5">
                          {order.orderStatus === "PENDING" && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleConfirmPayment(order._id);
                              }}
                              className="btn-modal-primary p-1.5"
                              title="Confirm payment"
                              type="button"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        {order.orderStatus === "CONFIRMED" && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleStatusUpdate(order._id, "PREPARING");
                            }}
                            className="btn-modal-primary p-1.5"
                            title="Start preparing"
                            type="button"
                          >
                            <Package className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {order.orderStatus === "PREPARING" && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleStatusUpdate(order._id, "SHIPPING");
                            }}
                            className="p-1.5 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                            style={{
                              background: "var(--accent-glow-2)",
                              color: "var(--primary)",
                            }}
                            title="Ship order"
                            type="button"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {order.orderStatus === "SHIPPING" && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleStatusUpdate(order._id, "DELIVERED");
                            }}
                            className="p-1.5 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                            style={{
                              background: "var(--accent-green)",
                              color: "var(--accent-green-text)",
                            }}
                            title="Mark as delivered"
                            type="button"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <div className="admin-dialog-overlay" onClick={() => setSelectedOrder(null)}>
          <div
            className="admin-dialog-content max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-dialog-header">
              <h3 className="text-base font-semibold">Order Details</h3>
            </div>
            <div className="admin-dialog-body">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Order Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Order ID</p>
                      <p className="text-sm font-medium">#{selectedOrder._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Date</p>
                      <p className="text-sm font-medium">
                        {new Date(selectedOrder.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <span
                        className={`badge ${
                          selectedOrder.orderStatus === "DELIVERED"
                            ? "badge-green"
                            : ["CONFIRMED", "PREPARING", "SHIPPING"].includes(
                                selectedOrder.orderStatus,
                              )
                              ? "badge-blue"
                              : selectedOrder.orderStatus === "PENDING"
                                ? "badge-orange"
                                : selectedOrder.orderStatus === "CANCELLED"
                                  ? "badge-red"
                                  : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {selectedOrder.orderStatus}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                      <p className="text-sm font-medium">{selectedOrder.payment.method || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
                      <span className={`badge ${selectedOrder.payment.status === "PAID" ? "badge-green" : "badge-orange"}`}>
                        {selectedOrder.payment.status}
                      </span>
                    </div>
                    {selectedOrder.payment.transactionNo && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Transaction No.</p>
                        <p className="text-sm font-medium">{selectedOrder.payment.transactionNo}</p>
                      </div>
                    )}
                  </div>

                  {/* Shipping Address */}
                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-semibold mb-3">Shipping Address</h4>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                      <p className="text-sm font-medium">{selectedOrder.shippingAddress.fullName}</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress.phone}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.shippingAddress.address}
                      </p>
                      {selectedOrder.shippingAddress.ward && (
                        <p className="text-sm text-muted-foreground">
                          {selectedOrder.shippingAddress.ward}, {selectedOrder.shippingAddress.district}, {selectedOrder.shippingAddress.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-semibold mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.productName || item.name || "Product"}
                              className="w-16 h-16 rounded-lg object-cover bg-muted flex-shrink-0"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (!target.dataset.fallback) {
                                  target.dataset.fallback = "true";
                                  target.src = `https://picsum.photos/seed/${item.productId}/100/100`;
                                }
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{item.productName || item.name || "Product"}</p>
                            {item.color && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Color: {item.color}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Qty: {item.quantity} x {formatPrice(item.price || 0)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold flex-shrink-0">
                            {formatPrice((item.price || 0) * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-semibold mb-3">Order Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{formatPrice(selectedOrder.itemsPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Shipping Fee</span>
                        <span>{formatPrice(selectedOrder.shippingFee)}</span>
                      </div>
                      {selectedOrder.coinUsed && selectedOrder.coinUsed > 0 && (
                        <div className="flex justify-between text-sm text-primary">
                          <span>Coin Discount</span>
                          <span>-{formatPrice(selectedOrder.coinUsed)}</span>
                        </div>
                      )}
                      {selectedOrder.discount && selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-sm text-primary">
                          <span>Discount</span>
                          <span>-{formatPrice(selectedOrder.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(selectedOrder.totalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  {selectedOrder.note && (
                    <div className="border-t border-border pt-4">
                      <h4 className="text-sm font-semibold mb-2">Note</h4>
                      <p className="text-sm text-muted-foreground">{selectedOrder.note}</p>
                    </div>
                  )}
                  {selectedOrder.cancelReason && (
                    <div className="border-t border-border pt-4">
                      <h4 className="text-sm font-semibold mb-2 text-destructive">Cancel Reason</h4>
                      <p className="text-sm text-muted-foreground">{selectedOrder.cancelReason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="admin-dialog-footer">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="btn-modal-cancel"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}