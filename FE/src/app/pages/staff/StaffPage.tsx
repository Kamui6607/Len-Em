import { useState, useEffect } from "react";
import { Users, Package, ShoppingCart, CheckCircle, Flag } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useAdmin } from "../../context/AdminContext";
import { products } from "../../data/products";
import { DashboardShell } from "../../components/dashboard/DashboardShell";
import { formatPrice } from "../../../lib/formatPrice";
import { StaffReports } from "./StaffReports";
import { orderService } from "../../../features/orders/services/order.service";
import type { NavItem } from "../../components/dashboard/Sidebar";
import type { Order } from "../../../features/orders/types/order.types";
import { normalizeOrder } from "../../../features/orders/types/order.types";
import { toast } from "sonner";

const navItems: NavItem[] = [
  { path: "/staff", label: "Pending Orders", icon: ShoppingCart },
  { path: "/staff/diy", label: "DIY Management", icon: Package },
  { path: "/staff/reports", label: "Report Management", icon: Flag },
];

export function StaffPage() {
  const [activeTab, setActiveTab] = useState<
    "orders" | "users" | "products" | "reports"
  >("orders");
  const { user } = useAuth();
  const { users, logActivity } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const { data: response } = await orderService.getAllOrders({
          page: 1,
          limit: 20,
        });
        setOrders(response.orders.map(normalizeOrder));
      } catch {
        // API unavailable — empty state (demo mode / offline)
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const pendingOrders = orders.filter(
    (o) => o.orderStatus === "PENDING",
  );

  const handleConfirmCashPayment = async (orderId: string) => {
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
        userId: user?.email || "staff",
        userName: user?.fullName || "Staff",
        description: `Confirmed cash payment for order ${orderId} at store`,
      });
      toast.success("Cash payment confirmed");
    } catch {
      toast.error("Failed to confirm payment");
    }
  };

  const renderContent = () => {
    if (activeTab === "orders") {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl mb-2">Pending Orders</h1>
            <p className="text-muted-foreground">
              Confirm and process pending orders
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : pendingOrders.length > 0 ? (
            <div className="grid gap-4">
              {pendingOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-card rounded-2xl p-6 border border-border"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold mb-1">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {order.shippingAddress?.fullName || "N/A"} •{" "}
                        {order.shippingAddress?.phone || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-xl">
                        {formatPrice(order.totalPrice)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.payment.method === "VNPAY" ? "Online Payment" : "Payment"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Items:</p>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm">
                          {item.productName || `Product ${item.productId}`} x
                          {item.quantity}
                        </p>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleConfirmCashPayment(order._id)}
                    className="w-full bg-secondary text-secondary-foreground px-6 py-3 rounded-full hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
                  >
                      <CheckCircle className="w-4 h-4" />
                      Confirm Order
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-12 text-center border border-border">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2">No pending orders</h3>
            <p className="text-muted-foreground">
              All orders have been processed.
            </p>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "users") {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl mb-2">Users (Read Only)</h1>
            <p className="text-muted-foreground">View all registered users</p>
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm">Name</th>
                  <th className="text-left px-6 py-4 text-sm">Email</th>
                  <th className="text-left px-6 py-4 text-sm">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-6 py-4">{u.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 capitalize">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === "products") {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl mb-2">Products (Read Only)</h1>
            <p className="text-muted-foreground">View all available products</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-card rounded-2xl overflow-hidden border border-border"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h4 className="mb-2">{product.name}</h4>
                  <p className="text-primary font-semibold">
                    {formatPrice(product.variants?.[0]?.price ?? 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <DashboardShell navItems={navItems} title="Staff Panel">
      <div className="flex gap-2 mb-8">
        {(["orders", "users", "products", "reports"] as const).map((tab) => {
          const icons: Record<string, React.ReactNode> = {
            orders: <ShoppingCart className="w-4 h-4" />,
            users: <Users className="w-4 h-4" />,
            products: <Package className="w-4 h-4" />,
            reports: <Flag className="w-4 h-4" />,
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${activeTab === tab ? "bg-secondary text-secondary-foreground shadow-sm" : "bg-card text-foreground border border-border hover:bg-muted"}`}
            >
              {icons[tab]}
                <span className="capitalize">
                  {tab === "orders" ? "Pending Orders" : tab}
                </span>
            </button>
          );
        })}
      </div>
      {activeTab === "reports" ? <StaffReports /> : renderContent()}
    </DashboardShell>
  );
}
