import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  DollarSign,
  Eye,
  Layers,
  Clock,
  User,
  Package,
  Receipt,
  Calendar,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../../../lib/formatPrice";
import { refundService, type RefundInvoice } from "../../../shared/api/refundService";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useLanguage } from "../../../shared/contexts/LanguageContext";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import { AdminSearchMeta } from "../../../shared/components/admin/AdminSearch";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import {
  AdminDetailGrid,
  AdminDetailItem,
  AdminDialogSection,
  AdminModal,
} from "../../../shared/components/admin/AdminModal";
import {
  AdminActionButton,
  AdminCellStack,
  AdminDataGrid,
  AdminDateCell,
  AdminGridFooter,
  AdminGridToolbar,
  AdminMoney,
  AdminPill,
  AdminRowActions,
  AdminRowMenu,
  AdminStatusTabs,
  useAdminGridSort,
  type AdminGridColumn,
  type AdminTone,
} from "../../../shared/components/admin/AdminDataGrid";

type RefundStatus = RefundInvoice["status"];

const STATUS_TONE: Record<RefundStatus, AdminTone> = {
  PENDING: "amber",
  PROCESSED: "green",
  REJECTED: "rose",
};

// ─── Helpers ─────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getOrderId(invoice: RefundInvoice): string {
  if (typeof invoice.orderId === "string") return invoice.orderId;
  return invoice.orderId?._id ?? "";
}

function getOrderTotal(invoice: RefundInvoice): number {
  if (typeof invoice.orderId === "string") return 0;
  return invoice.orderId?.totalPrice ?? 0;
}

function getUserName(invoice: RefundInvoice): string {
  if (typeof invoice.userId === "string") return "—";
  return invoice.userId?.fullName ?? "—";
}

function getUserEmail(invoice: RefundInvoice): string {
  if (typeof invoice.userId === "string") return "—";
  return invoice.userId?.email ?? "—";
}

function getUserId(invoice: RefundInvoice): string {
  if (typeof invoice.userId === "string") return invoice.userId;
  return invoice.userId?._id ?? "—";
}

const code = (id: string) => id.slice(-8).toUpperCase();

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0 || name === "—") return "?";
  return (parts.length === 1 ? parts[0][0] : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function StatusPill({ status }: { status: RefundStatus }) {
  const { t } = useLanguage();
  return <AdminPill tone={STATUS_TONE[status] ?? "neutral"}>{t(`admin.refunds.statuses.${status}`)}</AdminPill>;
}

// ─── Detail Modal ────────────────────────────────────────

function RefundDetailModal({ invoice, onClose }: { invoice: RefundInvoice; onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <AdminModal
      variant="view"
      size="md"
      icon={Receipt}
      eyebrow={t("admin.refunds.refundInvoice")}
      title={formatPrice(invoice.amount)}
      subtitle={<span className="font-mono">#{invoice._id}</span>}
      badges={<StatusPill status={invoice.status} />}
      onClose={onClose}
      footer={
        <button type="button" onClick={onClose} className="btn-modal-cancel">
          {t("admin.refunds.close")}
        </button>
      }
    >
      <div className="admin-dialog-body">
        <AdminDialogSection icon={Package}>{t("admin.refunds.order")}</AdminDialogSection>
        <AdminDetailGrid>
          <AdminDetailItem label={t("admin.refunds.orderId")} mono>
            {code(getOrderId(invoice))}
          </AdminDetailItem>
          <AdminDetailItem icon={DollarSign} label={t("admin.refunds.orderTotal")}>
            {formatPrice(getOrderTotal(invoice))}
          </AdminDetailItem>
        </AdminDetailGrid>

        <AdminDialogSection icon={User}>{t("admin.refunds.customer")}</AdminDialogSection>
        <AdminDetailGrid>
          <AdminDetailItem label={t("admin.refunds.name")}>{getUserName(invoice)}</AdminDetailItem>
          <AdminDetailItem label="Email">{getUserEmail(invoice)}</AdminDetailItem>
          <AdminDetailItem label={t("admin.refunds.userId")} mono span>
            {code(getUserId(invoice))}
          </AdminDetailItem>
        </AdminDetailGrid>

        <AdminDialogSection icon={FileText}>{t("admin.refunds.reason")}</AdminDialogSection>
        <AdminDetailItem label={t("admin.refunds.reason")}>{invoice.reason}</AdminDetailItem>

        <AdminDialogSection icon={Calendar}>{t("admin.refunds.timeline")}</AdminDialogSection>
        <AdminDetailGrid>
          <AdminDetailItem label={t("admin.refunds.created")}>{formatDate(invoice.createdAt)}</AdminDetailItem>
          <AdminDetailItem label={t("admin.refunds.processed")}>
            {invoice.processedAt ? formatDate(invoice.processedAt) : null}
          </AdminDetailItem>
        </AdminDetailGrid>
      </div>
    </AdminModal>
  );
}

// ─── Process Confirm Dialog ──────────────────────────────

function ProcessConfirmDialog({
  invoice,
  action,
  loading,
  onConfirm,
  onCancel,
}: {
  invoice: RefundInvoice;
  action: "PROCESSED" | "REJECTED";
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const isProcess = action === "PROCESSED";
  const orderCode = code(getOrderId(invoice));
  const amount = formatPrice(invoice.amount);
  return (
    <AdminModal
      variant={isProcess ? "edit" : "danger"}
      size="sm"
      icon={isProcess ? CheckCircle : XCircle}
      title={isProcess ? t("admin.refunds.processRefund") : t("admin.refunds.rejectRefund")}
      subtitle={`${t("admin.refunds.order")} #${orderCode} · ${amount}`}
      onClose={loading ? () => {} : onCancel}
      footer={
        <>
          <button type="button" onClick={onCancel} disabled={loading} className="btn-modal-cancel">
            {t("admin.grid.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={isProcess ? "btn-modal-primary" : "btn-modal-destructive"}
          >
            {loading
              ? t("admin.refunds.processing")
              : isProcess
                ? t("admin.refunds.processRefund")
                : t("admin.refunds.reject")}
          </button>
        </>
      }
    >
      <div className="admin-dialog-body">
        <p className="text-sm text-muted-foreground">
          {t(isProcess ? "admin.refunds.processConfirm" : "admin.refunds.rejectConfirm", { amount, order: orderCode })}
        </p>
      </div>
    </AdminModal>
  );
}

// ─── Main Component ──────────────────────────────────────

export function AdminRefunds() {
  const { t } = useLanguage();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [invoices, setInvoices] = useState<RefundInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number | undefined>>({});
  const limit = 10;
  const {
    inputValue: searchInput,
    debouncedValue: debouncedSearch,
    setInputValue: setSearchInput,
    isWaiting: searchIsWaiting,
    clear: clearSearch,
  } = useDebouncedSearch({ delay: 400, minChars: 0 });

  // Detail & process dialog state
  const [detailInvoice, setDetailInvoice] = useState<RefundInvoice | null>(null);
  const [processTarget, setProcessTarget] = useState<{
    invoice: RefundInvoice;
    action: "PROCESSED" | "REJECTED";
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  // ── Fetch invoices ──
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (statusFilter) params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data: response } = await refundService.getAll(params);
      const apiData = response.data;
      setInvoices(apiData.invoices ?? []);
      setTotal(apiData.total ?? 0);
      setTotalPages(apiData.totalPages ?? 1);
    } catch {
      toast.error(t("admin.refunds.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch, t]);

  // Số lượng cho thẻ trạng thái (limit=1, chỉ đọc total).
  const fetchCounts = useCallback(async () => {
    const keys = ["", "PENDING", "PROCESSED", "REJECTED"];
    const results = await Promise.allSettled(
      keys.map((status) => refundService.getAll(status ? { page: 1, limit: 1, status } : { page: 1, limit: 1 })),
    );
    const next: Record<string, number | undefined> = {};
    results.forEach((r, i) => {
      if (r.status === "fulfilled") next[keys[i] || "all"] = r.value.data.data.total;
    });
    setCounts(next);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  // ── Process / Reject ──
  const handleProcess = async () => {
    if (!processTarget) return;
    const { invoice, action } = processTarget;
    try {
      setProcessing(true);
      await refundService.process(invoice._id, { status: action });
      toast.success(action === "PROCESSED" ? t("admin.refunds.processSuccess") : t("admin.refunds.rejectSuccess"));
      setProcessTarget(null);
      fetchInvoices();
      fetchCounts();
    } catch {
      toast.error(action === "PROCESSED" ? t("admin.refunds.processError") : t("admin.refunds.rejectError"));
    } finally {
      setProcessing(false);
    }
  };

  const { sort, apply: applySort } = useAdminGridSort<RefundInvoice>((inv, field) => {
    if (field === "invoice") return new Date(inv.createdAt).getTime();
    if (field === "customer") return getUserName(inv);
    if (field === "amount") return inv.amount;
    if (field === "status") return inv.status;
    return null;
  });
  const rows = applySort(invoices);

  const columns: AdminGridColumn<RefundInvoice>[] = [
    {
      key: "invoice",
      header: t("admin.refunds.invoice"),
      width: "130px",
      minWidth: 130,
      sortable: true,
      card: "title",
      render: (inv) => (
        <>
          <span className="adm-gid">#{code(inv._id)}</span>
          <AdminDateCell value={inv.createdAt} compact />
        </>
      ),
    },
    {
      key: "customer",
      header: t("admin.refunds.customer"),
      width: "minmax(190px, 1.4fr)",
      minWidth: 190,
      sortable: true,
      render: (inv) => (
        <AdminCellStack
          media={<span className="adm-ginitials">{initials(getUserName(inv))}</span>}
          primary={getUserName(inv)}
          secondary={getUserEmail(inv)}
        />
      ),
    },
    {
      key: "reason",
      header: t("admin.refunds.reason"),
      width: "minmax(160px, 1.4fr)",
      minWidth: 160,
      render: (inv) => (
        <span className="adm-gclamp" title={inv.reason}>
          {inv.reason || "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: t("admin.refunds.amount"),
      width: "130px",
      minWidth: 130,
      align: "right",
      sortable: true,
      render: (inv) => (
        <>
          <AdminMoney value={inv.amount} />
          <span className="adm-gsecondary">
            {t("admin.refunds.order")} <span className="adm-gmono">#{code(getOrderId(inv))}</span>
          </span>
        </>
      ),
    },
    {
      key: "status",
      header: t("admin.refunds.status"),
      width: "120px",
      minWidth: 120,
      align: "center",
      sortable: true,
      card: "aside",
      render: (inv) => <StatusPill status={inv.status} />,
    },
    {
      key: "actions",
      header: t("admin.refunds.actions"),
      width: "178px",
      minWidth: 178,
      align: "center",
      card: "actions",
      render: (inv) => (
        <AdminRowActions>
          {isAdmin && inv.status === "PENDING" ? (
            <AdminActionButton
              icon={CheckCircle}
              tone="green"
              label={t("admin.refunds.process")}
              onClick={() => setProcessTarget({ invoice: inv, action: "PROCESSED" })}
            />
          ) : (
            <AdminActionButton icon={Eye} label={t("admin.refunds.view")} onClick={() => setDetailInvoice(inv)} />
          )}
          <AdminRowMenu
            ariaLabel={t("admin.grid.moreActions")}
            items={[
              { label: t("admin.refunds.view"), icon: Eye, onSelect: () => setDetailInvoice(inv) },
              isAdmin &&
                inv.status === "PENDING" && {
                  label: t("admin.refunds.reject"),
                  icon: XCircle,
                  danger: true,
                  separated: true,
                  onSelect: () => setProcessTarget({ invoice: inv, action: "REJECTED" }),
                },
            ]}
          />
        </AdminRowActions>
      ),
    },
  ];

  // ── Render ──
  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow={t("admin.refunds.eyebrow")}
        title={t("admin.refunds.title")}
        subtitle={t("admin.refunds.totalCount", { count: total })}
        actions={
          <button
            type="button"
            onClick={() => {
              fetchInvoices();
              fetchCounts();
            }}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("admin.grid.refresh")}
          </button>
        }
      />

      <AdminStatusTabs<string>
        ariaLabel={t("admin.refunds.status")}
        value={statusFilter}
        onChange={setStatusFilter}
        tabs={[
          { value: "", label: t("admin.refunds.all"), icon: Layers, count: counts.all },
          { value: "PENDING", label: t("admin.refunds.statuses.PENDING"), icon: Clock, tone: "amber", count: counts.PENDING },
          { value: "PROCESSED", label: t("admin.refunds.statuses.PROCESSED"), icon: CheckCircle, tone: "green", count: counts.PROCESSED },
          { value: "REJECTED", label: t("admin.refunds.statuses.REJECTED"), icon: XCircle, tone: "rose", count: counts.REJECTED },
        ]}
      />

      <AdminPanel hover={false} className="adm-gpanel">
        <AdminGridToolbar
          search={{
            value: searchInput,
            onChange: setSearchInput,
            placeholder: t("admin.refunds.searchPlaceholder"),
            isSearching: searchIsWaiting,
          }}
          onReset={
            searchInput || statusFilter
              ? () => {
                  clearSearch();
                  setStatusFilter("");
                }
              : undefined
          }
          meta={
            debouncedSearch ? (
              <AdminSearchMeta searching={searchIsWaiting}>
                {total === 0 ? t("admin.search.noResults") : t("admin.search.resultsCount", { count: total })}
              </AdminSearchMeta>
            ) : undefined
          }
        />

        <AdminDataGrid<RefundInvoice>
          ariaLabel={t("admin.refunds.title")}
          rows={rows}
          rowKey={(inv) => inv._id}
          columns={columns}
          loading={loading}
          sort={sort}
          onRowClick={(inv) => setDetailInvoice(inv)}
          rowAccent={(inv) => (inv.status === "PENDING" ? "amber" : null)}
          empty={{ icon: DollarSign, title: t("admin.refunds.noRefundsFound") }}
        />

        <AdminGridFooter page={page} totalPages={totalPages} total={total} pageSize={limit} onPageChange={setPage} disabled={loading} />
      </AdminPanel>

      {/* Detail Modal */}
      {detailInvoice && <RefundDetailModal invoice={detailInvoice} onClose={() => setDetailInvoice(null)} />}

      {/* Process Confirm Dialog */}
      {processTarget && (
        <ProcessConfirmDialog
          invoice={processTarget.invoice}
          action={processTarget.action}
          loading={processing}
          onConfirm={handleProcess}
          onCancel={() => setProcessTarget(null)}
        />
      )}
    </div>
  );
}
