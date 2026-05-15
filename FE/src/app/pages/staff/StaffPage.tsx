import { useState } from "react";
import { Users, Package, ShoppingCart, CheckCircle } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useAdmin } from "../../context/AdminContext";
import { products } from "../../data/products";
import { DashboardShell } from "../../components/dashboard/DashboardShell";
import type { NavItem } from "../../components/dashboard/Sidebar";
import { toast } from "sonner";

const navItems: NavItem[] = [
  { path: "/staff", label: "Cash Orders", icon: ShoppingCart },
];

export function StaffPage() {
  const [activeTab, setActiveTab] = useState<"users" | "products" | "orders">("orders");
  const { user } = useAuth();
  const { users, orders, confirmPayment, logActivity } = useAdmin();

  const handleConfirmCashPayment = (orderId: string) => {
    confirmPayment(orderId, user?.fullName || "Staff");
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      logActivity({
        type: "payment_confirmed",
        userId: user?.email || "staff",
        userName: user?.fullName || "Staff",
        description: `Confirmed cash payment for order ${orderId} at store`,
      });
    }
    toast.success("Cash payment confirmed");
  };

  const cashOrders = orders.filter((o) => o.paymentMethod === "cash" && o.paymentStatus === "pending");

  const renderContent = () => {
    if (activeTab === "orders") {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl mb-2">Cash Payment Orders</h1>
            <p className="text-muted-foreground">
              Confirm cash payments received at the store
            </p>
          </div>

          {cashOrders.length > 0 ? (
            <div className="grid gap-4">
              {cashOrders.map((order) => (
                <div key={order.id} className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold mb-1">Order {order.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.userName} • {order.userEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-xl">
                        ${order.total.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Cash Payment</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Items:</p>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm">
                          {item.productName} x{item.quantity}
                        </p>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleConfirmCashPayment(order.id)}
                    className="w-full bg-secondary text-secondary-foreground px-6 py-3 rounded-full hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Confirm Payment Received
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-12 text-center border border-border">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="mb-2">No Pending Cash Orders</h3>
              <p className="text-muted-foreground">
                All cash payments have been processed
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
                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
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
              <div key={product.id} className="bg-card rounded-2xl overflow-hidden border border-border">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h4 className="mb-2">{product.name}</h4>
                  <p className="text-primary font-semibold">
                    ${product.variants?.[0]?.price.toFixed(2) ?? "0.00"}
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
      {/* Tab navigation */}
      <div className="flex gap-2 mb-8">
        {(["orders", "users", "products"] as const).map((tab) => {
          const icons = {
            orders: ShoppingCart,
            users: Users,
            products: Package,
          };
          const Icon = icons[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                activeTab === tab
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "bg-card text-foreground border border-border hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="capitalize">{tab === "orders" ? "Cash Orders" : tab}</span>
            </button>
          );
        })}
      </div>

      {renderContent()}
    </DashboardShell>
  );
}