import { useState, useEffect } from "react";
import {
  Users,
  Package,
  ShoppingCart,
  Activity,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { products } from "../../data/products";
import { formatPrice } from "../../../lib/formatPrice";
import { orderService } from "../../../features/orders/services/order.service";
import { userService } from "../../../features/users/services/user.service";
import type { Order } from "../../../features/orders/types/order.types";
import { normalizeOrder } from "../../../features/orders/types/order.types";
import { useAdmin } from "../../context/AdminContext";

export function AdminDashboard() {
  const { activities } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersRes, usersRes] = await Promise.allSettled([
          orderService.getAllOrders({ page: 1, limit: 20 }),
          userService.getAllUsers({ page: 1, limit: 10 }),
        ]);
        if (ordersRes.status === "fulfilled")
          setOrders(ordersRes.value.data.orders.map(normalizeOrder));
        if (usersRes.status === "fulfilled")
          setTotalUsers(usersRes.value.data.data.result.totalUsers || 0);
      } catch {
        /* API unavailable */
      }
    }
    loadData();
  }, []);

  const totalRevenue = orders
    .filter((o) => o.payment.status === "PAID")
    .reduce((s, o) => s + o.totalPrice, 0);
  const pendingOrders = orders.filter(
    (o) => o.orderStatus === "PENDING",
  ).length;
  const confirmedOrders = orders.filter(
    (o) => o.orderStatus === "DELIVERED",
  ).length;
  const cancelledOrders = orders.filter(
    (o) => o.orderStatus === "CANCELLED",
  ).length;

  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      bgColor: "var(--primary-light)",
      borderColor: "var(--primary-soft)",
      iconBg: "var(--primary-soft)",
      iconColor: "var(--primary)",
      textColor: "var(--primary)",
      change: "+12%",
    },
    {
      title: "Total Products",
      value: products.length,
      icon: Package,
      bgColor: "var(--accent-blush)",
      borderColor: "var(--secondary)",
      iconBg: "var(--card)",
      iconColor: "var(--primary)",
      textColor: "var(--primary)",
      change: "+3",
    },
    {
      title: "Total Orders",
      value: orders.length,
      icon: ShoppingCart,
      bgColor: "var(--accent-butter)",
      borderColor: "var(--accent-yellow)",
      iconBg: "var(--card)",
      iconColor: "var(--primary)",
      textColor: "var(--primary)",
      change: `${pendingOrders} pending`,
    },
    {
      title: "Total Revenue",
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      bgColor: "var(--accent-green)",
      borderColor: "var(--accent-green-text)",
      iconBg: "var(--card)",
      iconColor: "var(--accent-green-text)",
      textColor: "var(--accent-green-text)",
      change: "+18%",
    },
  ];
  const recentActivities = activities.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="admin-panel-glow group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              style={{ 
                background: stat.bgColor, 
                borderColor: stat.borderColor 
              }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: stat.iconBg,
                      color: stat.iconColor,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span 
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: "var(--card)",
                      color: stat.textColor,
                    }}
                  >
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
                  {stat.value}
                </h3>
                <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                  {stat.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity & Statistics */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="admin-panel-glow rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg" style={{ borderColor: "var(--border-light)" }}>
          <div
            className="p-6 border-b border-[var(--border-light)]"
            style={{ background: "var(--surface)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                background: "var(--accent-blush)",
                color: "var(--primary)"
              }}>
                <Activity className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                Recent Activity
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-4" style={{ background: "var(--card)" }}>
            {recentActivities.length > 0 ? (
              recentActivities.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 pb-4 border-b border-border last:border-0"
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{a.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(a.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </div>
        </div>

        {/* Order Statistics */}
        <div className="admin-panel-glow rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg" style={{ borderColor: "var(--border-light)" }}>
          <div
            className="p-6 border-b border-[var(--border-light)]"
            style={{ background: "var(--surface)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                background: "var(--accent-butter)",
                color: "var(--primary)"
              }}>
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                Order Statistics
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-4" style={{ background: "var(--card)" }}>
            <div className="flex justify-between items-center">
              <span style={{ color: "var(--foreground-muted)" }}>Delivered Orders</span>
              <span className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>
                {confirmedOrders}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: "var(--foreground-muted)" }}>Pending Orders</span>
              <span className="font-semibold text-lg" style={{ color: "var(--primary)" }}>
                {pendingOrders}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: "var(--foreground-muted)" }}>Cancelled Orders</span>
              <span className="font-semibold text-lg" style={{ color: "var(--destructive)" }}>
                {cancelledOrders}
              </span>
            </div>
            <div className="pt-4 border-t" style={{ borderColor: "var(--border-light)" }}>
              <div className="flex justify-between items-center">
                <span className="font-medium" style={{ color: "var(--foreground)" }}>
                  Total Revenue
                </span>
                <span className="font-bold text-xl" style={{ color: "var(--primary)" }}>
                  {formatPrice(totalRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
