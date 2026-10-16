// ============================================================
// StaffPendingOrders — route /staff/orders
// Staff xác nhận các đơn đang ở trạng thái PENDING.
// - Lọc PENDING ở server (GET /orders?status=PENDING) + phân trang,
//   thay vì tải 20 đơn bất kỳ rồi lọc ở client (bỏ sót đơn).
// - Xác nhận = PATCH /orders/:id/status { orderStatus: "CONFIRMED" },
//   có hộp thoại xác nhận; xong thì đơn rời khỏi danh sách.
// - Không cho xác nhận khi: khách đã yêu cầu huỷ (để admin xử lý),
//   hoặc đơn chuyển khoản online (SePay) chưa nhận được tiền.
// ============================================================

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Package,
  Phone,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { orderService } from "../../../features/orders/services/order.service";
import type { Order } from "../../../features/orders/types/order.types";
import { normalizeOrder } from "../../../features/orders/types/order.types";
import { formatPrice } from "../../../lib/formatPrice";
import { extractApiErrorMessage } from "../../../lib/apiError";
import { shortId, toText } from "../../../lib/displayText";
import { useAdmin } from "../../../shared/contexts/AdminContext";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import { AdminModal } from "../../../shared/components/admin/AdminModal";
import { AdminPagination } from "../../../shared/components/admin/AdminPagination";
import { AdminSearchMeta, AdminSearchToolbar } from "../../../shared/components/admin/AdminSearch";
import { PAYMENT_METHOD_LABELS } from "../../../constants/orderStatus";

const PAGE_SIZE = 10;

/** Lý do KHÔNG được xác nhận đơn (null = được phép). */
function getConfirmBlocker(order: Order): string | null {
  if (order.isCancelRequested) {
    return "Khách đã yêu cầu huỷ đơn — chờ admin xử lý.";
  }
  if (order.payment?.method === "SEPAY" && order.payment?.status !== "PAID") {
    return "Đơn chuyển khoản online chưa nhận được tiền.";
  }
  return null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "";
  const minutes = Math.max(0, Math.round(diff / 60000));
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.round(hours / 24)} ngày trước`;
}

export function StaffPendingOrders() {
  const { user } = useAuth();
  const { logActivity } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [confirming, setConfirming] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    inputValue: searchInput,
    debouncedValue: search,
    setInputValue: setSearchInput,
    isWaiting: searchIsWaiting,
    clear: clearSearch,
  } = useDebouncedSearch({ delay: 400, minChars: 0 });

  const fetchOrders = useCallback(
    async (targetPage: number, silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const { data } = await orderService.getAllOrders({
          page: targetPage,
          limit: PAGE_SIZE,
          status: "PENDING",
          search: search || undefined,
        });
        // Lớp chặn cuối nếu BE bỏ qua tham số status
        const list = (data.orders ?? []).map(normalizeOrder).filter((o) => o.orderStatus === "PENDING");
        setOrders(list);
        setTotal(data.total ?? list.length);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
      } catch {
        toast.error("Không tải được danh sách đơn chờ xác nhận");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search],
  );

  useEffect(() => {
    void fetchOrders(page);
  }, [fetchOrders, page]);

  // Tìm kiếm mới → về trang 1
  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleConfirm = async () => {
    if (!confirming) return;
    const order = confirming;
    setSubmitting(true);
    try {
      await orderService.updateOrderStatus(order._id, { orderStatus: "CONFIRMED" });
      logActivity({
        type: "payment_confirmed",
        userId: user?.email || "staff",
        userName: user?.fullName || "Staff",
        description: `Xác nhận đơn ${order._id}`,
      });
      toast.success(`Đã xác nhận đơn #${shortId(order._id)}`);
      setConfirming(null);
      // Đơn đã CONFIRMED → rời khỏi danh sách chờ
      setOrders((prev) => prev.filter((o) => o._id !== order._id));
      setTotal((prev) => Math.max(0, prev - 1));
      if (orders.length === 1 && page > 1) setPage((p) => p - 1);
      else void fetchOrders(page, true);
    } catch (err) {
      toast.error(extractApiErrorMessage(err) || "Không xác nhận được đơn. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Việc cần làm"
        title="Đơn chờ xác nhận"
        subtitle={
          loading
            ? "Đang tải…"
            : total > 0
              ? `${total} đơn đang chờ — kiểm tra thông tin rồi xác nhận để chuyển sang khâu chuẩn bị hàng.`
              : "Không còn đơn nào chờ xác nhận."
        }
        actions={
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void fetchOrders(page, true)}
            disabled={refreshing || loading}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        }
      />

      <AdminPanel hover={false}>
        <AdminSearchToolbar
          search={{
            value: searchInput,
            onChange: setSearchInput,
            placeholder: "Tìm theo mã đơn, tên hoặc số điện thoại khách…",
            isSearching: searchIsWaiting,
          }}
          onReset={searchInput ? clearSearch : undefined}
          resetLabel="Xoá tìm kiếm"
          meta={
            search ? (
              <AdminSearchMeta searching={searchIsWaiting}>
                {total === 0 ? "Không có đơn phù hợp" : `${total} đơn phù hợp`}
              </AdminSearchMeta>
            ) : undefined
          }
        />

        <div className={`staff-orders ${refreshing ? "opacity-60" : ""}`}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="admin-skeleton h-40 rounded-2xl" />
            ))
          ) : orders.length === 0 ? (
            <div className="admin-empty-state">
              <CheckCircle2 size={40} />
              <p>{search ? "Không tìm thấy đơn phù hợp" : "Đã xử lý hết đơn chờ"}</p>
              <p className="text-sm">
                {search ? "Thử tìm bằng mã đơn hoặc số điện thoại khác." : "Đơn mới sẽ xuất hiện ở đây."}
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const blocker = getConfirmBlocker(order);
              const address = [
                order.shippingAddress?.address,
                order.shippingAddress?.ward,
                order.shippingAddress?.district,
                order.shippingAddress?.city,
              ]
                .map(toText)
                .filter(Boolean)
                .join(", ");
              const paid = order.payment?.status === "PAID";
              const method = toText(order.payment?.method);
              return (
                <article key={order._id} className="staff-order">
                  <header className="staff-order-head">
                    <div className="min-w-0">
                      <p className="staff-order-id">#{shortId(order._id)}</p>
                      <p className="staff-order-time">
                        <Clock className="h-3.5 w-3.5" />
                        {timeAgo(order.createdAt)} ·{" "}
                        {new Date(order.createdAt).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <span className="badge badge-blue">
                        {method === "SEPAY" ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                        {PAYMENT_METHOD_LABELS[method] ?? (method || "—")}
                      </span>
                      <span className={`badge ${paid ? "badge-green" : "badge-orange"}`}>
                        {paid ? "Đã thanh toán" : "Chưa thanh toán"}
                      </span>
                      {order.isCancelRequested && <span className="badge badge-red">Khách yêu cầu huỷ</span>}
                    </div>
                  </header>

                  <div className="staff-order-body">
                    <div className="staff-order-customer">
                      <p className="font-semibold text-foreground">
                        {toText(order.shippingAddress?.fullName) || "Khách hàng"}
                      </p>
                      {order.shippingAddress?.phone && (
                        <a href={`tel:${toText(order.shippingAddress.phone)}`} className="staff-order-meta">
                          <Phone className="h-3.5 w-3.5" />
                          {toText(order.shippingAddress.phone)}
                        </a>
                      )}
                      {address && (
                        <p className="staff-order-meta">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {address}
                        </p>
                      )}
                    </div>

                    <ul className="staff-order-items">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          <span className="staff-order-thumb">
                            {item.image ? <img src={toText(item.image)} alt="" /> : <Package className="h-4 w-4" />}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {toText(item.productName) || "Sản phẩm"}
                            {item.color && <span className="text-muted-foreground"> · {toText(item.color)}</span>}
                          </span>
                          <span className="text-muted-foreground">×{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <footer className="staff-order-foot">
                    <div>
                      <p className="text-xs text-muted-foreground">Tổng thanh toán</p>
                      <p className="staff-order-total">{formatPrice(order.totalPrice)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={Boolean(blocker)}
                        onClick={() => setConfirming(order)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Xác nhận đơn
                      </button>
                      {blocker && (
                        <p className="staff-order-blocker">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          {blocker}
                        </p>
                      )}
                    </div>
                  </footer>
                </article>
              );
            })
          )}
        </div>
      </AdminPanel>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={total}
        pageSize={PAGE_SIZE}
        disabled={refreshing}
      />

      {confirming && (
        <AdminModal
          title={`Xác nhận đơn #${shortId(confirming._id)}?`}
          onClose={() => !submitting && setConfirming(null)}
          className="max-w-md w-full"
        >
          <div className="admin-dialog-body">
            <p className="text-sm text-muted-foreground">
              Đơn sẽ chuyển sang <strong className="text-foreground">Đã xác nhận</strong> và được đưa
              sang khâu chuẩn bị hàng. Hãy chắc chắn thông tin khách và sản phẩm đã đúng.
            </p>
            <div className="staff-confirm-summary">
              <span>{toText(confirming.shippingAddress?.fullName) || "Khách hàng"}</span>
              <span>{confirming.items.length} sản phẩm</span>
              <strong>{formatPrice(confirming.totalPrice)}</strong>
            </div>
          </div>
          <div className="admin-dialog-footer">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={() => setConfirming(null)}
              disabled={submitting}
            >
              Để sau
            </button>
            <button type="button" className="btn-modal-primary" onClick={handleConfirm} disabled={submitting}>
              {submitting ? "Đang xác nhận…" : "Xác nhận đơn"}
            </button>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
