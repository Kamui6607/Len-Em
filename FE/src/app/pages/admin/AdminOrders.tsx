import { useState, useEffect } from "react";
import { Search, ChevronUp, ChevronDown, Check, X, Package, Truck } from "lucide-react";
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
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

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

  const handleCancelOrder = async () => {
    if (!cancelTarget) return;
    try {
      await orderService.cancelOrder(cancelTarget._id, {
        cancelReason: "Cancelled by admin",
      });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === cancelTarget._id ? { ...o, orderStatus: "CANCELLED" as const } : o,
        ),
      );
      setCancelTarget(null);
      toast.success("Order cancelled");
    } catch {
      toast.error("Failed to cancel order");
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
                    className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors"
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
                          <>
                            <button
                              onClick={() => handleConfirmPayment(order._id)}
                              className="btn-modal-primary p-1.5"
                              title="Confirm payment"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setCancelTarget(order)}
                              className="btn-modal-destructive p-1.5"
                              title="Cancel order"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {order.orderStatus === "CONFIRMED" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(order._id, "PREPARING")
                            }
                            className="btn-modal-primary p-1.5"
                            title="Start preparing"
                          >
                            <Package className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {order.orderStatus === "PREPARING" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(order._id, "SHIPPING")
                            }
                            className="p-1.5 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                            style={{
                              background: "var(--accent-glow-2)",
                              color: "var(--primary)",
                            }}
                            title="Ship order"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {order.orderStatus === "SHIPPING" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(order._id, "DELIVERED")
                            }
                            className="p-1.5 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                            style={{
                              background: "var(--accent-green)",
                              color: "var(--accent-green-text)",
                            }}
                            title="Mark as delivered"
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

      {/* Cancel Order Confirm Dialog */}
      {cancelTarget && (
        <div className="admin-dialog-overlay" onClick={() => setCancelTarget(null)}>
          <div
            className="admin-dialog-content max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-dialog-header">
              <h3 className="text-base font-semibold">Cancel Order</h3>
            </div>
            <div className="admin-dialog-body">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to cancel order #{cancelTarget._id.slice(-8).toUpperCase()}? This action cannot be undone.
              </p>
            </div>
            <div className="admin-dialog-footer">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="btn-modal-cancel"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                className="btn-modal-destructive"
              >
                <X className="w-4 h-4" />
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}