import { useState, useEffect } from "react";
import { Search, CheckCircle, XCircle, Clock } from "lucide-react";
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

export function AdminOrders() {
  const { logActivity } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("all");

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

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      await orderService.cancelOrder(orderId, {
        cancelReason: "Cancelled by admin",
      });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, orderStatus: "CANCELLED" as const } : o,
        ),
      );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Order Management</h1>
        <p className="text-muted-foreground">
          View and manage all orders from the API
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {(["all", ...ORDER_STATUSES] as OrderFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition-colors capitalize ${filter === status ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border hover:bg-muted"}`}
          >
            {status.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <div className="divide-y divide-border">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div
                key={order._id}
                className="p-6 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold mb-1">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {order.shippingAddress?.fullName || "N/A"} •{" "}
                      {order.shippingAddress?.phone || "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {formatPrice(order.totalPrice)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {order.payment.method}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Payment: {order.payment.status}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Items:</p>
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <p key={idx} className="text-xs">
                        {item.productName || `Product ${item.productId}`} x
                        {item.quantity}
                        {item.color && (
                          <span className="text-muted-foreground">
                            {" "}
                            ({item.color})
                          </span>
                        )}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${
                      order.orderStatus === "DELIVERED"
                        ? "bg-green-100 text-green-700"
                        : ["CONFIRMED", "PREPARING", "SHIPPING"].includes(
                              order.orderStatus,
                            )
                          ? "bg-secondary/20 text-secondary"
                          : order.orderStatus === "PENDING"
                            ? "bg-accent/20 text-accent"
                            : order.orderStatus === "CANCELLED"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {order.orderStatus === "DELIVERED" && (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    {order.orderStatus === "PENDING" && (
                      <Clock className="w-3 h-3" />
                    )}
                    {order.orderStatus === "CANCELLED" && (
                      <XCircle className="w-3 h-3" />
                    )}
                    {order.orderStatus}
                  </span>

                  <div className="flex gap-2">
                    {order.orderStatus === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleConfirmPayment(order._id)}
                          className="text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-full hover:bg-secondary/90 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="text-sm bg-destructive/10 text-destructive px-4 py-2 rounded-full hover:bg-destructive/20 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {order.orderStatus === "CONFIRMED" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(order._id, "PREPARING")
                        }
                        className="text-sm bg-primary/10 text-primary px-4 py-2 rounded-full hover:bg-primary/20 transition-colors"
                      >
                        Preparing
                      </button>
                    )}
                    {order.orderStatus === "PREPARING" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(order._id, "SHIPPING")
                        }
                        className="text-sm bg-primary/10 text-primary px-4 py-2 rounded-full hover:bg-primary/20 transition-colors"
                      >
                        Ship
                      </button>
                    )}
                    {order.orderStatus === "SHIPPING" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(order._id, "DELIVERED")
                        }
                        className="text-sm bg-green-100 text-green-700 px-4 py-2 rounded-full hover:bg-green-200 transition-colors"
                      >
                        Deliver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No orders found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
