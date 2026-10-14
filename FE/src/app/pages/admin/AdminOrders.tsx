import { useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  CreditCard,
  Eye,
  Inbox,
  Layers,
  MapPin,
  MoreHorizontal,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../../../lib/formatPrice";
import { shortId, toText } from "../../../lib/displayText";
import { useAdmin } from "../../../shared/contexts/AdminContext";
import { orderService } from "../../../features/orders/services/order.service";
import type {
  Order,
  OrderStatus,
} from "../../../features/orders/types/order.types";
import { normalizeOrder } from "../../../features/orders/types/order.types";
import { PAYMENT_METHOD_LABELS, VALID_TRANSITIONS } from "../../../constants/orderStatus";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import {
  AdminSearchInput,
  AdminSearchMeta,
} from "../../../shared/components/admin/AdminSearch";
import { AdminSelect } from "../../../shared/components/admin/AdminSelect";
import { AdminDialogSkeleton } from "../../../shared/components/skeletons/AdminSkeleton";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import {
  AdminDetailGrid,
  AdminDetailItem,
  AdminDialogSection,
  AdminModal,
} from "../../../shared/components/admin/AdminModal";

type OrderFilter = "all" | OrderStatus;
type PaymentFilter = "all" | "COD" | "PAID" | "UNPAID";

/** Fulfilment pipeline, in order — doubles as the status tabs. */
const STATUS_TABS: { value: OrderFilter; label: string; icon: LucideIcon }[] = [
  { value: "all", label: "Tất cả đơn", icon: Layers },
  { value: "PENDING", label: "Chờ duyệt", icon: Clock },
  { value: "CONFIRMED", label: "Đã xác nhận", icon: Check },
  { value: "PREPARING", label: "Chuẩn bị", icon: Package },
  { value: "SHIPPING", label: "Đang giao", icon: Truck },
  { value: "DELIVERED", label: "Đã giao", icon: CheckCircle2 },
  { value: "CANCELLED", label: "Đã huỷ", icon: Ban },
];

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_TABS.map((tab) => [tab.value, tab.label]),
);

/** The one forward step an order can take from the list (absent = nothing to do). */
/** `tone` picks the button colour — always the status the order moves INTO (see --action-* tokens). */
const NEXT_STEP: Partial<
  Record<OrderStatus, { to: OrderStatus; label: string; icon: LucideIcon; tone: "confirm" | "prepare" | "ship" | "deliver" }>
> = {
  PENDING: { to: "CONFIRMED", label: "Xác nhận", icon: Check, tone: "confirm" },
  CONFIRMED: { to: "PREPARING", label: "Chuẩn bị hàng", icon: Package, tone: "prepare" },
  PREPARING: { to: "SHIPPING", label: "Giao hàng", icon: Truck, tone: "ship" },
  SHIPPING: { to: "DELIVERED", label: "Đã giao xong", icon: CheckCircle2, tone: "deliver" },
};

const PAYMENT_OPTIONS: { value: PaymentFilter; label: string }[] = [
  { value: "all", label: "Mọi thanh toán" },
  { value: "COD", label: "COD" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "UNPAID", label: "Chưa thanh toán" },
];

const PAGE_SIZES = [20, 50, 100];

const canCancel = (order: Order) => VALID_TRANSITIONS[order.orderStatus]?.includes("CANCELLED") ?? false;

/** A PENDING order can only be confirmed once it's paid. */
const isAwaitingPayment = (order: Order) =>
  order.orderStatus === "PENDING" && order.payment?.status !== "PAID";

/** Why a PENDING order can't be confirmed yet (null = allowed). */
function getConfirmBlocker(order: Order): string | null {
  if (isAwaitingPayment(order)) return "Chờ thanh toán";
  if (order.isCancelRequested) return "Khách đã yêu cầu huỷ";
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
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

/** yyyy-mm-dd in local time, for comparing against <input type="date"> values. */
function localDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const vnd = new Intl.NumberFormat("vi-VN");

/** "396.001 ₫" — tabular digits, the ₫ as a quieter separate span. */
function Money({ value }: { value: number }) {
  return (
    <span className="adm-money">
      {vnd.format(value || 0)}
      <span className="adm-money-cur">&nbsp;₫</span>
    </span>
  );
}

type SortField = "order" | "customer" | "date" | "total" | "status";
type SortDirection = "asc" | "desc";

export function AdminOrders() {
  const { logActivity } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Partial<Record<OrderFilter, number>>>({});
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [payment, setPayment] = useState<PaymentFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { inputValue: searchTerm, debouncedValue: debouncedSearchTerm, setInputValue: setSearchTerm, isWaiting: searchIsWaiting, clear: clearSearch } = useDebouncedSearch({ delay: 400, minChars: 0 });
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cancelTargets, setCancelTargets] = useState<Order[] | null>(null);

  // Server-side pagination: /orders supports page/limit/status/search/paymentStatus.
  // paymentMethod and from/to are sent too, and re-applied below in case the API ignores them.
  const loadOrders = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const { data: response } = await orderService.getAllOrders({
          page,
          limit: pageSize,
          status: filter === "all" ? undefined : filter,
          search: debouncedSearchTerm || undefined,
          paymentStatus: payment === "PAID" ? "PAID" : payment === "UNPAID" ? "PENDING" : undefined,
          paymentMethod: payment === "COD" ? "COD" : undefined,
          from: dateFrom || undefined,
          to: dateTo || undefined,
        });
        setOrders((response.orders ?? []).map(normalizeOrder));
        setTotal(response.total ?? 0);
        setTotalPages(Math.max(1, response.totalPages ?? 1));
      } catch {
        // API unavailable — show empty state (demo mode / offline)
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, pageSize, filter, debouncedSearchTerm, payment, dateFrom, dateTo],
  );

  // Tab counts: one `limit=1` request per status, reading only `total`.
  const loadCounts = useCallback(async () => {
    const results = await Promise.allSettled(
      STATUS_TABS.map((tab) =>
        orderService.getAllOrders({
          page: 1,
          limit: 1,
          status: tab.value === "all" ? undefined : tab.value,
        }),
      ),
    );
    const next: Partial<Record<OrderFilter, number>> = {};
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        next[STATUS_TABS[i].value] = result.value.data.total ?? 0;
      }
    });
    setCounts(next);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // New search / filter means a new result set: back to page 1, drop the selection.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, filter, payment, dateFrom, dateTo, pageSize]);

  useEffect(() => {
    setSelected(new Set());
  }, [page, pageSize, filter, debouncedSearchTerm, payment, dateFrom, dateTo]);

  const handleRefresh = () => {
    loadOrders(true);
    loadCounts();
  };

  const clearFilters = () => {
    clearSearch();
    setFilter("all");
    setPayment("all");
    setDateFrom("");
    setDateTo("");
  };

  /**
   * Moves orders to `to`; returns how many succeeded plus the first API error message
   * (e.g. GHN refusing a shipment). Shared by row actions and the bulk bar.
   */
  const updateStatuses = async (targets: Order[], to: OrderStatus): Promise<{ ok: number; error?: string }> => {
    const ids = targets.map((o) => o._id);
    setUpdatingIds((prev) => new Set([...prev, ...ids]));
    const results = await Promise.allSettled(
      ids.map((id) => orderService.updateOrderStatus(id, { orderStatus: to })),
    );
    const done = new Set(ids.filter((_, i) => results[i].status === "fulfilled"));
    setUpdatingIds((prev) => new Set([...prev].filter((id) => !ids.includes(id))));
    if (done.size > 0) {
      setOrders((prev) => prev.map((o) => (done.has(o._id) ? { ...o, orderStatus: to } : o)));
      setSelectedOrder((prev) => (prev && done.has(prev._id) ? { ...prev, orderStatus: to } : prev));
      setSelected((prev) => new Set([...prev].filter((id) => !done.has(id))));
      if (to === "CONFIRMED") {
        done.forEach((id) =>
          logActivity({
            type: "payment_confirmed",
            userId: "admin",
            userName: "Admin",
            description: `Xác nhận đơn ${id}`,
          }),
        );
      }
      // On a status tab the orders have now left this list — refetch quietly.
      if (filter !== "all") loadOrders(true);
      loadCounts();
    }
    const rejected = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    const error = (rejected?.reason as { response?: { data?: { message?: string } } } | undefined)?.response?.data?.message;
    return { ok: done.size, error };
  };

  const handleAdvance = async (order: Order) => {
    const step = NEXT_STEP[order.orderStatus];
    if (!step || updatingIds.has(order._id)) return;
    const { ok, error } = await updateStatuses([order], step.to);
    if (ok) toast.success(`#${shortId(order._id)} → ${STATUS_LABELS[step.to]}`);
    else toast.error(error ?? "Không cập nhật được trạng thái đơn");
  };

  const handleViewDetail = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const { data: response } = await orderService.getOrderById(orderId);
      setSelectedOrder(normalizeOrder(response.order));
    } catch {
      toast.error("Không tải được chi tiết đơn");
    } finally {
      setDetailLoading(false);
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

  // Client-side safety net for filters the API may not apply (payment method, date range).
  const visibleOrders = orders.filter((o) => {
    if (payment === "COD" && !["COD", "CASH"].includes(toText(o.payment?.method))) return false;
    if (payment === "PAID" && o.payment?.status !== "PAID") return false;
    if (payment === "UNPAID" && o.payment?.status === "PAID") return false;
    const day = localDay(o.createdAt);
    if (dateFrom && day < dateFrom) return false;
    if (dateTo && day > dateTo) return false;
    return true;
  });

  // Sorting only reorders the current page; search/filter happen server-side.
  const sortedOrders = [...visibleOrders].sort((a, b) => {
    if (!sortField) return 0;
    let cmp: number;
    switch (sortField) {
      case "date":
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "total":
        cmp = a.totalPrice - b.totalPrice;
        break;
      case "customer":
        cmp = toText(a.shippingAddress?.fullName).localeCompare(toText(b.shippingAddress?.fullName));
        break;
      case "status":
        cmp = a.orderStatus.localeCompare(b.orderStatus);
        break;
      default:
        cmp = a._id.localeCompare(b._id);
    }
    return sortDirection === "asc" ? cmp : -cmp;
  });

  const needsAction = (counts.PENDING ?? 0) + (counts.CONFIRMED ?? 0) + (counts.PREPARING ?? 0);
  const hasFilters = Boolean(searchTerm) || filter !== "all" || payment !== "all" || Boolean(dateFrom || dateTo);

  // ── Selection ──
  const selectedOrders = sortedOrders.filter((o) => selected.has(o._id));
  const confirmable = selectedOrders.filter((o) => o.orderStatus === "PENDING" && !getConfirmBlocker(o));
  const cancellable = selectedOrders.filter(canCancel);
  const allSelected = sortedOrders.length > 0 && selectedOrders.length === sortedOrders.length;
  const headerCheckRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate = selectedOrders.length > 0 && !allSelected;
    }
  }, [selectedOrders.length, allSelected]);

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(sortedOrders.map((o) => o._id)));

  const awaitingSelected = selectedOrders.filter(isAwaitingPayment).length;

  const handleBulkConfirm = async () => {
    if (confirmable.length === 0) return;
    const pendingSelected = selectedOrders.filter((o) => o.orderStatus === "PENDING").length;
    const awaiting = awaitingSelected;
    const { ok, error } = await updateStatuses(confirmable, "CONFIRMED");
    const failed = confirmable.length - ok;
    // e.g. "3 of 5 confirmed — 2 awaiting payment"
    const notes = [
      awaiting && `${awaiting} chờ thanh toán`,
      pendingSelected - awaiting - confirmable.length > 0 && `${pendingSelected - awaiting - confirmable.length} tạm giữ`,
    ].filter(Boolean);
    if (ok) toast.success(`Đã xác nhận ${ok}/${pendingSelected} đơn${notes.length ? ` — ${notes.join(", ")}` : ""}`);
    if (failed) toast.error(`${failed} đơn xác nhận thất bại`, { description: error });
  };

  const handleCancelConfirmed = async () => {
    if (!cancelTargets) return;
    const targets = cancelTargets;
    const { ok, error } = await updateStatuses(targets, "CANCELLED");
    const failed = targets.length - ok;
    if (ok) toast.success(`Đã huỷ ${ok} đơn`);
    if (failed) toast.error(`${failed} đơn huỷ thất bại`, { description: error });
    setCancelTargets(null);
  };

  // ── Cells ──
  const headerCell = (label: string, field?: SortField, align: "left" | "center" | "right" = "left") => {
    const active = field && sortField === field;
    return (
      <div
        role="columnheader"
        className={`adm-oth ${align === "left" ? "" : `is-${align}`}`}
        aria-sort={active ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
      >
        {field ? (
          <button
            type="button"
            className={`adm-oth-inner is-sortable ${active ? "is-active" : ""}`}
            onClick={() => handleSort(field)}
          >
            {label}
            <span className="adm-oth-sort" aria-hidden="true">
              <ChevronUp className={active && sortDirection === "asc" ? "is-on" : ""} />
              <ChevronDown className={active && sortDirection === "desc" ? "is-on" : ""} />
            </span>
          </button>
        ) : (
          <span className="adm-oth-inner">{label}</span>
        )}
      </div>
    );
  };

  const renderNextAction = (order: Order) => {
    const step = NEXT_STEP[order.orderStatus];
    if (!step) return null;
    // Unpaid PENDING order: no Confirm button, a quiet placeholder holds the slot instead.
    if (isAwaitingPayment(order)) {
      return (
        <span className="adm-oawait" title="Chỉ xác nhận được khi đơn đã thanh toán">
          <Clock /> Chờ thanh toán
        </span>
      );
    }
    const blocker = order.orderStatus === "PENDING" ? getConfirmBlocker(order) : null;
    const Icon = blocker ? AlertTriangle : step.icon;
    const busy = updatingIds.has(order._id);
    return (
      <button
        type="button"
        className={`adm-oact ${blocker ? "is-blocked" : `is-step is-${step.tone}`}`}
        disabled={Boolean(blocker) || busy}
        title={blocker ?? `Chuyển sang: ${STATUS_LABELS[step.to]}`}
        onClick={(e) => {
          e.stopPropagation();
          handleAdvance(order);
        }}
      >
        {busy ? <RefreshCw className="animate-spin" /> : <Icon />}
        {blocker ? "Tạm giữ" : step.label}
      </button>
    );
  };

  const renderMoreMenu = (order: Order) => (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="adm-omore"
          aria-label={`Thao tác khác cho đơn #${shortId(order._id)}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        {/* React events bubble through portals — keep menu clicks from opening the row. */}
        <DropdownMenu.Content align="end" sideOffset={6} className="adm-omenu" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu.Item className="adm-omenu-item" onSelect={() => handleViewDetail(order._id)}>
            <Eye /> Xem chi tiết
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="adm-omenu-item"
            onSelect={() => {
              navigator.clipboard?.writeText(order._id).then(
                () => toast.success("Đã sao chép mã đơn"),
                () => toast.error("Không sao chép được mã đơn"),
              );
            }}
          >
            <Copy /> Sao chép mã đơn
          </DropdownMenu.Item>
          {canCancel(order) && (
            <>
              <DropdownMenu.Separator className="adm-omenu-sep" />
              <DropdownMenu.Item className="adm-omenu-item is-danger" onSelect={() => setCancelTargets([order])}>
                <Ban /> Huỷ đơn
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );

  const renderRow = (order: Order) => {
    const method = toText(order.payment?.method);
    const isBank = method === "SEPAY" || method === "BANK";
    const paid = order.payment?.status === "PAID";
    const created = new Date(order.createdAt);
    const firstItem = order.items[0];
    const itemCount = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const isSelected = selected.has(order._id);
    return (
      <div
        key={order._id}
        role="row"
        tabIndex={0}
        className={`adm-orow ${order.orderStatus === "PENDING" ? "is-pending" : ""} ${isSelected ? "is-selected" : ""}`}
        onClick={() => handleViewDetail(order._id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target === e.currentTarget) handleViewDetail(order._id);
        }}
      >
        <div role="cell" className="adm-otd c-sel" onClick={(e) => e.stopPropagation()}>
          <label className="adm-ocheck">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleOne(order._id)}
              aria-label={`Chọn đơn #${shortId(order._id)}`}
            />
          </label>
        </div>

        <div role="cell" className="adm-otd c-order">
          <span className="adm-oid">#{shortId(order._id)}</span>
          <span className="adm-ochip">{isBank ? "SePay" : method === "COD" || method === "CASH" ? "COD" : method || "—"}</span>
        </div>

        <div role="cell" className="adm-otd c-cust">
          <span className="adm-oprimary">{toText(order.shippingAddress?.fullName) || "N/A"}</span>
          <span className="adm-osecondary is-mono">{toText(order.shippingAddress?.phone) || "—"}</span>
        </div>

        <div role="cell" className="adm-otd c-items">
          <span className="adm-oitems">
          <span className="adm-othumbs" aria-hidden="true">
            {order.items.slice(0, 3).map((item, idx) => (
              <span key={idx} className="adm-othumb">
                {item.image ? <img src={toText(item.image)} alt="" loading="lazy" /> : <Package />}
              </span>
            ))}
            {order.items.length > 3 && <span className="adm-othumb is-more">+{order.items.length - 3}</span>}
          </span>
          <span className="adm-oitems-text" title={order.items.map((i) => toText(i.productName ?? i.name)).join(", ")}>
            <span className="adm-oprimary">
              {itemCount} món
            </span>
            <span className="adm-osecondary">{toText(firstItem?.productName ?? firstItem?.name) || "—"}</span>
          </span>
          </span>
        </div>

        <div role="cell" className="adm-otd c-placed" title={created.toLocaleString("vi-VN")}>
          <span className="adm-oprimary">{timeAgo(order.createdAt)}</span>
          <span className="adm-osecondary is-num">
            {created.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit" })}
          </span>
        </div>

        <div role="cell" className="adm-otd c-total">
          <span className="adm-oprimary">
            <Money value={order.totalPrice} />
          </span>
          <span className={`adm-opaid ${paid ? "is-paid" : ""}`}>{paid ? "Đã thanh toán" : "Chưa thanh toán"}</span>
        </div>

        <div role="cell" className="adm-otd c-status">
          <span className="adm-ostatus" data-status={order.orderStatus}>
            {STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
          </span>
          {order.isCancelRequested && <span className="adm-oflag">Khách yêu cầu huỷ</span>}
        </div>

        <div role="cell" className="adm-otd c-action">
          <span className="adm-oactions">
            {renderNextAction(order) ?? <span className="adm-oact-slot" aria-hidden="true" />}
            {renderMoreMenu(order)}
          </span>
        </div>
      </div>
    );
  };

  const skeletonRows = Array.from({ length: 8 }, (_, i) => (
    <div key={i} role="row" className="adm-orow is-skeleton" aria-hidden="true">
      <div className="adm-otd c-sel"><span className="admin-skeleton adm-osk" style={{ width: 16, height: 16 }} /></div>
      <div className="adm-otd c-order"><span className="admin-skeleton adm-osk" style={{ width: 72 }} /><span className="admin-skeleton adm-osk is-sm" style={{ width: 36 }} /></div>
      <div className="adm-otd c-cust"><span className="admin-skeleton adm-osk" style={{ width: "70%" }} /><span className="admin-skeleton adm-osk is-sm" style={{ width: "45%" }} /></div>
      <div className="adm-otd c-items"><span className="admin-skeleton adm-osk" style={{ width: 56, height: 28 }} /><span className="admin-skeleton adm-osk" style={{ width: "40%" }} /></div>
      <div className="adm-otd c-placed"><span className="admin-skeleton adm-osk" style={{ width: 52 }} /><span className="admin-skeleton adm-osk is-sm" style={{ width: 68 }} /></div>
      <div className="adm-otd c-total"><span className="admin-skeleton adm-osk" style={{ width: 80 }} /><span className="admin-skeleton adm-osk is-sm" style={{ width: 40 }} /></div>
      <div className="adm-otd c-status"><span className="admin-skeleton adm-osk" style={{ width: 92, height: 24, borderRadius: 999 }} /></div>
      <div className="adm-otd c-action"><span className="admin-skeleton adm-osk" style={{ width: 150, height: 32, borderRadius: 8 }} /></div>
    </div>
  ));

  const rangeFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, total);
  const dateFilterActive = Boolean(dateFrom || dateTo);

  let tableBody: ReactNode;
  if (loading) {
    tableBody = skeletonRows;
  } else if (sortedOrders.length === 0) {
    tableBody = (
      <div className="admin-empty-state adm-oempty">
        <Inbox size={40} />
        <p>{hasFilters ? "Không có đơn phù hợp" : "Chưa có đơn hàng"}</p>
        <p className="text-sm">
          {hasFilters
            ? "Không có đơn nào khớp với tìm kiếm và bộ lọc hiện tại."
            : "Đơn mới sẽ xuất hiện ở đây ngay khi khách đặt hàng."}
        </p>
        {hasFilters && (
          <button type="button" className="btn-secondary mt-4" onClick={clearFilters}>
            Xoá bộ lọc
          </button>
        )}
      </div>
    );
  } else {
    tableBody = sortedOrders.map(renderRow);
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow="Vận hành"
        title="Quản lý đơn hàng"
        subtitle={
          counts.all === undefined
            ? "Theo dõi mọi đơn từ lúc đặt đến khi giao tận tay"
            : `${counts.all} đơn · ${needsAction} đơn đang chờ bạn xử lý`
        }
        actions={
          <button
            type="button"
            className="btn-secondary"
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        }
      />

      {/* Status pipeline — doubles as the filter */}
      <div className="adm-order-steps" role="tablist" aria-label="Lọc đơn theo trạng thái">
        {STATUS_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = filter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              data-status={tab.value}
              className={`adm-order-step ${active ? "is-active" : ""}`}
              onClick={() => setFilter(tab.value)}
            >
              <span className="adm-order-step-icon">
                <Icon className="w-4 h-4" />
              </span>
              <span className="adm-order-step-label">{tab.label}</span>
              <span className="adm-order-step-count">
                {counts[tab.value] ?? <span className="admin-skeleton inline-block h-5 w-6 rounded-md" />}
              </span>
            </button>
          );
        })}
      </div>

      <AdminPanel hover={false} className="adm-opanel">
        {/* Toolbar — swapped for the bulk bar while rows are selected */}
        {selectedOrders.length > 0 ? (
          <div className="admin-toolbar adm-otoolbar is-bulk" role="toolbar" aria-label="Thao tác hàng loạt">
            <span className="adm-obulk-count">Đã chọn {selectedOrders.length}</span>
            <span className="adm-obulk-sep" aria-hidden="true" />
            <button
              type="button"
              className="adm-oact is-step is-confirm"
              onClick={handleBulkConfirm}
              disabled={confirmable.length === 0 || updatingIds.size > 0}
              title={
                confirmable.length === 0
                  ? awaitingSelected
                    ? "Các đơn đã chọn vẫn đang chờ thanh toán"
                    : "Không có đơn nào trong số đã chọn có thể xác nhận"
                  : undefined
              }
            >
              <Check /> Xác nhận tất cả{confirmable.length > 0 && confirmable.length !== selectedOrders.length ? ` (${confirmable.length})` : ""}
            </button>
            <button
              type="button"
              className="adm-oact is-danger"
              onClick={() => setCancelTargets(cancellable)}
              disabled={cancellable.length === 0 || updatingIds.size > 0}
              title={cancellable.length === 0 ? "Không có đơn nào trong số đã chọn có thể huỷ" : undefined}
            >
              <Ban /> Huỷ đơn{cancellable.length > 0 && cancellable.length !== selectedOrders.length ? ` (${cancellable.length})` : ""}
            </button>
            {awaitingSelected > 0 && (
              <span className="adm-obulk-note">
                <Clock /> {awaitingSelected} chờ thanh toán
              </span>
            )}
            <button type="button" className="adm-obulk-clear" onClick={() => setSelected(new Set())}>
              <X /> Clear
            </button>
          </div>
        ) : (
          <div className="admin-toolbar adm-otoolbar">
            <AdminSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Tìm theo mã đơn, tên khách hoặc số điện thoại…"
              isSearching={searchIsWaiting}
              size="sm"
              className="adm-osearch"
            />
            <div className="adm-ofilters">
              <AdminSelect
                value={payment}
                options={PAYMENT_OPTIONS}
                onChange={(v) => setPayment(v as PaymentFilter)}
                className="adm-ofilter-payment"
              />
              <div className={`adm-odate ${dateFilterActive ? "is-active" : ""}`}>
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                  aria-label="Đặt từ ngày"
                />
                <span aria-hidden="true">–</span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  aria-label="Đến ngày"
                />
              </div>
              <AdminSelect
                value={String(pageSize)}
                options={PAGE_SIZES.map((n) => ({ value: String(n), label: `${n} / trang` }))}
                onChange={(v) => setPageSize(Number(v))}
                className="adm-ofilter-size"
              />
              {hasFilters && (
                <button type="button" className="adm-obulk-clear" onClick={clearFilters}>
                  <X /> Clear
                </button>
              )}
            </div>
          </div>
        )}
        {(debouncedSearchTerm || dateFilterActive) && !loading && (
          <div className="adm-ometa">
            <AdminSearchMeta searching={searchIsWaiting}>
              {total === 0 ? "Không có kết quả" : `${total} kết quả`}
              {dateFilterActive && sortedOrders.length !== orders.length && ` · khoảng ngày đang ẩn ${orders.length - sortedOrders.length} đơn trên trang này`}
            </AdminSearchMeta>
          </div>
        )}

        <div role="table" aria-label="Orders" aria-busy={loading} className={`adm-otable ${refreshing ? "is-refreshing" : ""}`}>
          <div role="rowgroup" className="adm-othead">
            <div role="row" className="adm-orow is-head">
              <div role="columnheader" className="adm-oth c-sel">
                <label className="adm-ocheck">
                  <input
                    ref={headerCheckRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={loading || sortedOrders.length === 0}
                    aria-label="Chọn tất cả đơn trên trang này"
                  />
                </label>
              </div>
              {headerCell("Mã đơn", "order")}
              {headerCell("Khách hàng", "customer")}
              {headerCell("Sản phẩm", undefined, "center")}
              {headerCell("Đặt lúc", "date")}
              {headerCell("Tổng tiền", "total", "right")}
              {headerCell("Trạng thái", "status", "center")}
              {headerCell("Thao tác", undefined, "center")}
            </div>
          </div>
          <div role="rowgroup" className="adm-otbody">
            {tableBody}
          </div>
        </div>

        {total > 0 && (
          <nav className="adm-ofoot" aria-label="Pagination">
            <span className="adm-ofoot-range">
              {rangeFrom}–{rangeTo} trong {total}
            </span>
            <div className="adm-ofoot-pager">
              <button
                type="button"
                className="adm-omore"
                disabled={page <= 1 || loading || refreshing}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Trang trước"
              >
                <ChevronLeft />
              </button>
              <span className="adm-ofoot-page">
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                className="adm-omore"
                disabled={page >= totalPages || loading || refreshing}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Trang sau"
              >
                <ChevronRight />
              </button>
            </div>
          </nav>
        )}
      </AdminPanel>

      {/* Cancel confirmation (row menu or bulk bar) */}
      {cancelTargets && (
        <AdminModal
          variant="danger"
          size="sm"
          icon={Ban}
          title={
            cancelTargets.length === 1
              ? `Huỷ đơn #${shortId(cancelTargets[0]._id)}?`
              : `Huỷ ${cancelTargets.length} đơn?`
          }
          onClose={() => updatingIds.size === 0 && setCancelTargets(null)}
          footer={
            <>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setCancelTargets(null)}
                disabled={updatingIds.size > 0}
              >
                Giữ lại
              </button>
              <button
                type="button"
                className="btn-modal-destructive"
                onClick={handleCancelConfirmed}
                disabled={updatingIds.size > 0}
              >
                {updatingIds.size > 0 ? "Đang huỷ…" : "Huỷ đơn"}
              </button>
            </>
          }
        >
          <div className="admin-dialog-body">
            <p className="text-sm text-muted-foreground">
              Đơn đã huỷ không thể đưa trở lại quy trình. Khách sẽ thấy đơn ở trạng thái đã huỷ.
            </p>
          </div>
        </AdminModal>
      )}

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <AdminModal
          variant="view"
          size="xl"
          icon={ShoppingBag}
          eyebrow="Chi tiết đơn"
          title={`#${shortId(selectedOrder._id)}`}
          subtitle={new Date(selectedOrder.createdAt).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          badges={
            <>
              <span className="adm-ostatus" data-status={selectedOrder.orderStatus}>
                {STATUS_LABELS[selectedOrder.orderStatus] ?? selectedOrder.orderStatus}
              </span>
              <span className={`adm-opaid ${selectedOrder.payment.status === "PAID" ? "is-paid" : ""}`}>
                {selectedOrder.payment.status === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
              </span>
            </>
          }
          onClose={() => setSelectedOrder(null)}
          footer={
            <>
              <button type="button" onClick={() => setSelectedOrder(null)} className="btn-modal-cancel">
                Đóng
              </button>
              {renderNextAction(selectedOrder)}
            </>
          }
        >
          <div className="admin-dialog-body">
            {detailLoading ? (
              // Dialog xem chi tiết đơn (read action): skeleton đúng hình
              // dạng khối thông tin + danh sách sản phẩm trong đơn.
              <AdminDialogSkeleton items={4} rows={3} />
            ) : (
              <>
                {selectedOrder.orderStatus === "PENDING" && getConfirmBlocker(selectedOrder) && (
                  <div className="adm-dlg-alert">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{getConfirmBlocker(selectedOrder)} — chưa thể xác nhận đơn này.</span>
                  </div>
                )}

                <AdminDialogSection icon={CreditCard}>Thanh toán</AdminDialogSection>
                <AdminDetailGrid>
                  <AdminDetailItem label="Phương thức">
                    {PAYMENT_METHOD_LABELS[toText(selectedOrder.payment.method)] ?? (selectedOrder.payment.method || "N/A")}
                  </AdminDetailItem>
                  <AdminDetailItem label="Mã giao dịch" mono>
                    {selectedOrder.payment.transactionNo}
                  </AdminDetailItem>
                </AdminDetailGrid>

                <AdminDialogSection icon={MapPin}>Địa chỉ giao hàng</AdminDialogSection>
                <AdminDetailItem
                  label={`${selectedOrder.shippingAddress.fullName} · ${selectedOrder.shippingAddress.phone}`}
                >
                  <span className="font-normal">
                    {selectedOrder.shippingAddress.address}
                    {selectedOrder.shippingAddress.ward && (
                      <>
                        <br />
                        <span className="text-muted-foreground">
                          {selectedOrder.shippingAddress.ward}, {selectedOrder.shippingAddress.district},{" "}
                          {selectedOrder.shippingAddress.city}
                        </span>
                      </>
                    )}
                  </span>
                </AdminDetailItem>

                <AdminDialogSection icon={Package}>Sản phẩm trong đơn ({selectedOrder.items.length})</AdminDialogSection>
                <ul className="adm-lines">
                  {selectedOrder.items.map((item, index) => (
                    <li key={index} className="adm-line">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.productName || item.name || "Product"}
                          className="adm-line-img"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = "true";
                              target.src = `https://picsum.photos/seed/${item.productId}/100/100`;
                            }
                          }}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.productName || item.name || "Product"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.color && <>Màu: {item.color} · </>}
                          {item.quantity} × <Money value={item.price || 0} />
                        </p>
                      </div>
                      <p className="text-sm font-semibold shrink-0">
                        <Money value={(item.price || 0) * item.quantity} />
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="adm-summary">
                  <div className="adm-summary-row">
                    <span>Tạm tính</span>
                    <Money value={selectedOrder.itemsPrice} />
                  </div>
                  <div className="adm-summary-row">
                    <span>Phí giao hàng</span>
                    <Money value={selectedOrder.shippingFee} />
                  </div>
                  {/* 🪙 Coin system — tạm tắt, sẽ bật lại khi phát triển tính năng dùng Coin:
                  {selectedOrder.coinUsed && selectedOrder.coinUsed > 0 && (
                    <div className="adm-summary-row text-primary">
                      <span>Coin Discount</span>
                      <span>-{formatPrice(selectedOrder.coinUsed)}</span>
                    </div>
                  )}
                  */}
                  {(selectedOrder.discount ?? 0) > 0 && (
                    <div className="adm-summary-row text-primary">
                      <span>Giảm giá</span>
                      <span>-{formatPrice(selectedOrder.discount ?? 0)}</span>
                    </div>
                  )}
                  <div className="adm-summary-row is-total">
                    <span>Tổng cộng</span>
                    <Money value={selectedOrder.totalPrice} />
                  </div>
                </div>

                {selectedOrder.note && (
                  <AdminDetailItem label="Ghi chú">
                    <span className="font-normal">{selectedOrder.note}</span>
                  </AdminDetailItem>
                )}
                {selectedOrder.cancelReason && (
                  <AdminDetailItem label="Lý do huỷ" className="is-danger">
                    <span className="font-normal">{selectedOrder.cancelReason}</span>
                  </AdminDetailItem>
                )}
              </>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
}
