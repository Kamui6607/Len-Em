import { useState, useEffect } from "react";
import {
  Users,
  Package,
  ShoppingCart,
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { formatPrice } from "../../../lib/formatPrice";
import { orderService } from "../../../features/orders/services/order.service";
import { userService } from "../../../features/users/services/user.service";
import { productService } from "../../../api/productService";
import { products as staticProducts } from "../../data/products";
import type { Order } from "../../../features/orders/types/order.types";
import { normalizeOrder } from "../../../features/orders/types/order.types";
import { useAdmin } from "../../context/AdminContext";
import { useLanguage } from "../../../context/LanguageContext";

interface StatCard {
  title: string;
  value: string | number;
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
  meta?: string;
  metaTone?: "up" | "down" | "neutral";
}

export function AdminDashboard() {
  const { activities } = useAdmin();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        // Fetch only essential data for dashboard stats
        const [ordersRes, statsRes, productsRes] = await Promise.allSettled([
          orderService.getAllOrders({ page: 1, limit: 50 }),
          userService.getStatistics(),
          productService.getAll({ limit: 1 }),
        ]);

        if (cancelled) return;

        if (ordersRes.status === "fulfilled") {
          setOrders(ordersRes.value.data.orders.map(normalizeOrder));
        }
        if (statsRes.status === "fulfilled") {
          const statsData = statsRes.value.data.data;
          setTotalUsers(statsData.totalUsers || 0);
        }
        if (productsRes.status === "fulfilled") {
          // Use total count from API if available, otherwise fallback to static products
          const data = productsRes.value.data as {
            data?: { total?: number; products?: unknown[] };
          };
          const total = data?.data?.total ?? data?.data?.products?.length;
          setTotalProducts(typeof total === "number" ? total : staticProducts.length);
        } else {
          setTotalProducts(staticProducts.length);
        }
      } catch {
        /* API unavailable */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const paidOrders = orders.filter((o) => o.payment.status === "PAID");
  const totalRevenue = paidOrders.reduce((s, o) => s + o.totalPrice, 0);
  const pendingOrders = orders.filter((o) => o.orderStatus === "PENDING").length;
  const confirmedOrders = orders.filter((o) => o.orderStatus === "DELIVERED").length;
  const cancelledOrders = orders.filter((o) => o.orderStatus === "CANCELLED").length;

  const stats: StatCard[] = [
    {
      title: t("admin.dashboard.stats.totalUsers"),
      value: totalUsers,
      icon: Users,
      iconBg: "var(--primary-soft)",
      iconColor: "var(--primary)",
    },
    {
      title: t("admin.dashboard.stats.totalProducts"),
      value: totalProducts ?? "—",
      icon: Package,
      iconBg: "var(--info-bg)",
      iconColor: "var(--info-text)",
    },
    {
      title: t("admin.dashboard.stats.totalOrders"),
      value: orders.length,
      icon: ShoppingCart,
      iconBg: "var(--warning-bg)",
      iconColor: "var(--warning-text)",
      meta: pendingOrders > 0 
        ? t("admin.dashboard.stats.pendingOrders", { count: pendingOrders }) 
        : t("admin.dashboard.stats.noPendingOrders"),
      metaTone: pendingOrders > 0 ? "neutral" : "up",
    },
    {
      title: t("admin.dashboard.totalRevenue"),
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      iconBg: "var(--success-bg)",
      iconColor: "var(--success-text)",
      meta: t("admin.dashboard.stats.paidOrders", { 
        count: paidOrders.length, 
        suffix: paidOrders.length !== 1 ? "s" : "" 
      }),
      metaTone: "neutral",
    },
  ];

  const recentActivities = activities.slice(0, 8);

  const orderBreakdown = [
    { label: t("admin.dashboard.orderBreakdown.delivered"), value: confirmedOrders, color: "var(--success-text)" },
    { label: t("admin.dashboard.orderBreakdown.pending"), value: pendingOrders, color: "var(--warning-text)" },
    { label: t("admin.dashboard.orderBreakdown.cancelled"), value: cancelledOrders, color: "var(--destructive)" },
  ];
  const breakdownTotal = orderBreakdown.reduce((s, o) => s + o.value, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-1">{t("admin.dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.dashboard.welcomeBack")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="admin-panel-glow rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: stat.iconBg, color: stat.iconColor }}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {loading ? (
                  <span className="inline-block h-7 w-16 rounded-md bg-muted animate-pulse" />
                ) : (
                  stat.value
                )}
              </h3>
              {stat.meta && !loading && (
                <p
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{
                    color:
                      stat.metaTone === "up"
                        ? "var(--success-text)"
                        : stat.metaTone === "down"
                          ? "var(--destructive)"
                          : "var(--foreground-muted)",
                  }}
                >
                  {stat.metaTone === "up" && <TrendingUp className="w-3.5 h-3.5" />}
                  {stat.metaTone === "down" && <TrendingDown className="w-3.5 h-3.5" />}
                  {stat.meta}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Activity & Statistics */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div
          className="admin-panel-glow rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center gap-3 p-6 border-b"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              <Activity className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base font-semibold text-foreground">{t("admin.dashboard.recentActivity")}</h2>
          </div>
          <div className="p-6" style={{ background: "var(--card)" }}>
            {recentActivities.length > 0 ? (
              <ul className="space-y-4">
                {recentActivities.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                    <span
                      className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ background: "var(--primary)" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{a.description}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(a.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("admin.dashboard.noRecentActivity")}
              </p>
            )}
          </div>
        </div>

        {/* Order Statistics */}
        <div
          className="admin-panel-glow rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center gap-3 p-6 border-b"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base font-semibold text-foreground">{t("admin.dashboard.orderStatistics")}</h2>
          </div>
          <div className="p-6 space-y-5" style={{ background: "var(--card)" }}>
            {/* Proportion bar */}
            <div className="flex h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--muted)" }}>
              {orderBreakdown.map((o) => (
                <div
                  key={o.label}
                  style={{
                    width: `${(o.value / breakdownTotal) * 100}%`,
                    background: o.color,
                  }}
                />
              ))}
            </div>

            <div className="space-y-3">
              {orderBreakdown.map((o) => (
                <div key={o.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: o.color }} />
                    {o.label}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{o.value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <span className="text-sm font-medium text-foreground">{t("admin.dashboard.totalRevenue")}</span>
              <span className="text-lg font-bold" style={{ color: "var(--primary)" }}>
                {formatPrice(totalRevenue)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}