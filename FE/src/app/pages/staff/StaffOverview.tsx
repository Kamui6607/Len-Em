// ============================================================
// StaffOverview — route /staff
// Trang đầu của Staff: "hôm nay cần làm gì" — số đơn chờ xác nhận,
// số báo cáo đang chờ được giao cho mình, và 5 mục mới nhất của mỗi loại.
// Trước đây /staff mở thẳng danh sách đơn và không mục menu nào sáng.
// ============================================================

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronRight, ClipboardCheck, Flag, ShoppingCart, Users } from "lucide-react";
import { orderService } from "../../../features/orders/services/order.service";
import type { Order } from "../../../features/orders/types/order.types";
import { normalizeOrder } from "../../../features/orders/types/order.types";
import { orderReportService } from "../../../features/orderReport/services/orderReport.service";
import type { OrderReport } from "../../../features/orderReport/types/orderReport.types";
import { formatPrice } from "../../../lib/formatPrice";
import { shortId, toText } from "../../../lib/displayText";
import { useAuth } from "../../../shared/hooks/useAuth";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel, AdminPanelBody, AdminPanelHeader } from "../../../shared/components/admin/AdminPanel";
import { AdminStatCard, AdminStatGrid } from "../../../shared/components/admin/AdminStatCard";
import { SkeletonBlock } from "../../../shared/components/skeletons/AdminSkeleton";

export function StaffOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [pendingOrderTotal, setPendingOrderTotal] = useState<number | null>(null);
  const [reports, setReports] = useState<OrderReport[]>([]);
  const [reportTotal, setReportTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [ordersRes, reportsRes] = await Promise.allSettled([
        orderService.getAllOrders({ page: 1, limit: 5, status: "PENDING" }),
        orderReportService.getAll({ page: 1, limit: 5, status: "PENDING", assignedStaff: user?.id }),
      ]);
      if (cancelled) return;
      if (ordersRes.status === "fulfilled") {
        const list = (ordersRes.value.data.orders ?? [])
          .map(normalizeOrder)
          .filter((o) => o.orderStatus === "PENDING");
        setPendingOrders(list);
        setPendingOrderTotal(ordersRes.value.data.total ?? list.length);
      }
      if (reportsRes.status === "fulfilled") {
        const data = reportsRes.value.data.data;
        const list = Array.isArray(data?.reports) ? data.reports : [];
        setReports(list);
        setReportTotal(data?.total ?? list.length);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const firstName = toText(user?.fullName).split(" ").pop() || "bạn";
  const allClear = !loading && pendingOrderTotal === 0 && reportTotal === 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={`Chào ${firstName}`}
        title="Tổng quan ca làm"
        subtitle={
          allClear
            ? "Mọi việc đã xong — không còn đơn hay báo cáo nào chờ bạn."
            : "Những việc đang chờ bạn xử lý hôm nay."
        }
      />

      <AdminStatGrid>
        <AdminStatCard
          loading={loading}
          stat={{
            title: "Đơn chờ xác nhận",
            value: pendingOrderTotal ?? "—",
            icon: ShoppingCart,
            iconBg: "var(--warning-bg)",
            iconColor: "var(--warning-text)",
            meta: pendingOrderTotal ? "Cần kiểm tra & xác nhận" : "Không có đơn chờ",
            metaTone: pendingOrderTotal ? "neutral" : "up",
          }}
        />
        <AdminStatCard
          loading={loading}
          stat={{
            title: "Báo cáo đang chờ bạn",
            value: reportTotal ?? "—",
            icon: Flag,
            iconBg: "var(--error-bg)",
            iconColor: "var(--error-text)",
            meta: reportTotal ? "Admin đã giao cho bạn" : "Không có báo cáo chờ",
            metaTone: reportTotal ? "neutral" : "up",
          }}
        />
      </AdminStatGrid>

      <div className="admin-dash-grid staff-overview-grid">
        <AdminPanel>
          <AdminPanelHeader
            icon={<ClipboardCheck className="w-4.5 h-4.5" />}
            title="Đơn chờ xác nhận mới nhất"
            actions={
              <Link to="/staff/orders" className="admin-link-more">
                Xử lý đơn <ChevronRight className="w-4 h-4" />
              </Link>
            }
          />
          <AdminPanelBody className="!p-3">
            {loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-11 w-full rounded-xl" />
                ))}
              </div>
            ) : pendingOrders.length === 0 ? (
              <p className="admin-empty-inline">Không có đơn nào đang chờ</p>
            ) : (
              <ul className="admin-recent">
                {pendingOrders.map((order) => (
                  <li key={order._id}>
                    <Link to="/staff/orders" className="admin-recent-row">
                      <span className="admin-recent-id">#{shortId(order._id, 6)}</span>
                      <span className="admin-recent-who">
                        <span className="truncate font-medium text-foreground">
                          {toText(order.shippingAddress?.fullName) || "Khách hàng"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {order.items.length} sản phẩm
                          {order.isCancelRequested && " · khách yêu cầu huỷ"}
                        </span>
                      </span>
                      <span className="admin-recent-total">{formatPrice(order.totalPrice)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanelBody>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            icon={<Flag className="w-4.5 h-4.5" />}
            title="Báo cáo đang chờ bạn"
            actions={
              <Link to="/staff/reports" className="admin-link-more">
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </Link>
            }
          />
          <AdminPanelBody className="!p-3">
            {loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-11 w-full rounded-xl" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <p className="admin-empty-inline">Chưa có báo cáo nào được giao</p>
            ) : (
              <ul className="admin-recent">
                {reports.map((report) => (
                  <li key={report._id}>
                    <Link to="/staff/reports" className="admin-recent-row">
                      <span className="admin-recent-id">#{shortId(report._id, 6)}</span>
                      <span className="admin-recent-who">
                        <span className="truncate font-medium text-foreground">
                          {toText(report.title) || "Báo cáo"}
                        </span>
                        <span className="text-xs text-muted-foreground">Đơn #{shortId(report.orderId, 6)}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanelBody>
        </AdminPanel>
      </div>

      <section aria-label="Lối tắt">
        <h2 className="admin-section-title">Lối tắt</h2>
        <div className="admin-attention">
          <Link to="/staff/orders" className="admin-attention-card is-warning">
            <span className="admin-attention-icon">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="admin-attention-label">Xác nhận đơn</span>
              <span className="admin-attention-hint">Kiểm tra & chuyển đơn sang chuẩn bị</span>
            </span>
            <ChevronRight className="admin-attention-arrow w-4 h-4" />
          </Link>
          <Link to="/staff/reports" className="admin-attention-card is-error">
            <span className="admin-attention-icon">
              <Flag className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="admin-attention-label">Xử lý báo cáo</span>
              <span className="admin-attention-hint">Khiếu nại khách được giao cho bạn</span>
            </span>
            <ChevronRight className="admin-attention-arrow w-4 h-4" />
          </Link>
          <Link to="/staff/users" className="admin-attention-card is-info">
            <span className="admin-attention-icon">
              <Users className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="admin-attention-label">Tra cứu người dùng</span>
              <span className="admin-attention-hint">Xem thông tin khách (chỉ xem)</span>
            </span>
            <ChevronRight className="admin-attention-arrow w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
