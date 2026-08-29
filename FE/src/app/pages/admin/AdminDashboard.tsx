import { useState, useEffect } from "react";
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { formatPrice } from "../../../lib/formatPrice";
import { orderService } from "../../../features/orders/services/order.service";
import { userService } from "../../../features/users/services/user.service";
import { productService } from "../../../shared/api/productService";
import { products as staticProducts } from "../../data/products";
import type { Order } from "../../../features/orders/types/order.types";
import { normalizeOrder } from "../../../features/orders/types/order.types";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminStatCard, AdminStatGrid, type AdminStatCardData } from "../../../shared/components/admin/AdminStatCard";
import { AdminPanel, AdminPanelHeader, AdminPanelBody } from "../../../shared/components/admin/AdminPanel";

export function AdminDashboard() {
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

  const stats: AdminStatCardData[] = [
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
        suffix: paidOrders.length !== 1 ? "s" : "",
      }),
      metaTone: "neutral",
    },
  ];

  const orderBreakdown = [
    { label: t("admin.dashboard.orderBreakdown.delivered"), value: confirmedOrders, color: "var(--success-text)" },
    { label: t("admin.dashboard.orderBreakdown.pending"), value: pendingOrders, color: "var(--warning-text)" },
    { label: t("admin.dashboard.orderBreakdown.cancelled"), value: cancelledOrders, color: "var(--destructive)" },
  ];
  const breakdownTotal = orderBreakdown.reduce((s, o) => s + o.value, 0) || 1;

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.dashboard.title")} subtitle={t("admin.dashboard.welcomeBack")} />

      <AdminStatGrid>
        {stats.map((stat) => (
          <AdminStatCard key={stat.title} stat={stat} loading={loading} />
        ))}
      </AdminStatGrid>

      {/* Order Statistics */}
      <AdminPanel>
        <AdminPanelHeader icon={<TrendingUp className="w-4.5 h-4.5" />} title={t("admin.dashboard.orderStatistics")} />
        <AdminPanelBody className="space-y-5">
          {/* Proportion bar */}
          <div className="admin-breakdown-track flex h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--muted)" }}>
            {orderBreakdown.map((o) => (
              <div
                key={o.label}
                className="admin-breakdown-segment"
                style={{
                  width: `${(o.value / breakdownTotal) * 100}%`,
                  background: o.color,
                }}
              />
            ))}
          </div>

          <div className="space-y-3">
            {orderBreakdown.map((o) => (
              <div key={o.label} className="admin-breakdown-row flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="admin-breakdown-dot h-2 w-2 rounded-full" style={{ background: o.color, color: o.color }} />
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
        </AdminPanelBody>
      </AdminPanel>
    </div>
  );
}