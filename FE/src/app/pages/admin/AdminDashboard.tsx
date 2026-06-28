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
      color: "bg-primary/10 text-primary",
      change: "+12%",
    },
    {
      title: "Total Products",
      value: products.length,
      icon: Package,
      color: "bg-secondary/10 text-secondary",
      change: "+3",
    },
    {
      title: "Total Orders",
      value: orders.length,
      icon: ShoppingCart,
      color: "bg-accent/10 text-accent",
      change: `${pendingOrders} pending`,
    },
    {
      title: "Total Revenue",
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      color: "bg-primary/10 text-primary",
      change: "+18%",
    },
  ];
  const recentActivities = activities.slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm text-secondary">{stat.change}</span>
              </div>
              <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </div>
          );
        })}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <h2>Recent Activity</h2>
          </div>
          <div className="space-y-4">
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
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <h2>Order Statistics</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Delivered Orders</span>
              <span className="font-semibold text-lg">{confirmedOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pending Orders</span>
              <span className="font-semibold text-lg text-accent">
                {pendingOrders}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cancelled Orders</span>
              <span className="font-semibold text-lg text-destructive">
                {cancelledOrders}
              </span>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-foreground font-medium">
                  Total Revenue
                </span>
                <span className="font-bold text-xl text-primary">
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
