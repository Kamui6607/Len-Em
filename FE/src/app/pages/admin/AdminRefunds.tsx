import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  DollarSign,
  User,
  Package,
  X,
  Calendar,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "../../../lib/formatPrice";
import { refundService, type RefundInvoice } from "../../../api/refundService";
import { useAuth } from "../../../hooks/useAuth";
import { AdminSelect } from "../../components/admin/AdminSelect";
import { useDebouncedSearch } from "../../../hooks/useDebouncedSearch";

// ─── Helpers ─────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "badge-warm";
    case "PROCESSED":
      return "badge-green";
    case "REJECTED":
      return "badge-red";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

// ─── Detail Modal ────────────────────────────────────────

function RefundDetailModal({
  invoice,
  onClose,
}: {
  invoice: RefundInvoice;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="admin-dialog-content max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-dialog-header">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Refund Invoice</h3>
            <button
              onClick={onClose}
              style={{ color: "var(--foreground-muted)" }}
              className="admin-action-btn"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            #{invoice._id}
          </p>
        </div>
        <div className="admin-dialog-body space-y-4">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <span className={`badge ${getStatusBadgeClass(invoice.status)}`}>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  invoice.status === "PENDING"
                    ? "bg-amber-500"
                    : invoice.status === "PROCESSED"
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                }`}
              />
              {invoice.status}
            </span>
          </div>

          {/* Amount */}
          <div
            className="flex items-center justify-between py-2 border-t"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Amount
            </span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(invoice.amount)}
            </span>
          </div>

          {/* Order info */}
          <div
            className="py-2 border-t"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span className="text-sm font-medium flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              Order
            </span>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-xs">
                {getOrderId(invoice).slice(-8).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">
                {formatPrice(getOrderTotal(invoice))}
              </span>
            </div>
          </div>

          {/* Customer info */}
          <div
            className="py-2 border-t"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span className="text-sm font-medium flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Customer
            </span>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{getUserName(invoice)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Email</span>
              <span className="text-xs">{getUserEmail(invoice)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs">
                {getUserId(invoice).slice(-8).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div
            className="py-2 border-t"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span className="text-sm font-medium flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Cancel Reason
            </span>
            <p className="text-sm text-muted-foreground">
              {invoice.reason || "—"}
            </p>
          </div>

          {/* Timestamps */}
          <div
            className="py-2 border-t"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span className="text-sm font-medium flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Timeline
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(invoice.createdAt)}</span>
            </div>
            {invoice.processedAt && (
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-muted-foreground">Processed</span>
                <span>{formatDate(invoice.processedAt)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="admin-dialog-footer !justify-stretch">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg btn-glass-destructive"
          >
            Close
          </button>
        </div>
      </div>
    </div>
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
  const isProcess = action === "PROCESSED";
  return (
    <div className="admin-dialog-overlay" onClick={onCancel}>
      <div
        className="admin-dialog-content max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-dialog-header">
          <h3 className="text-base font-semibold">
            {isProcess ? "Process Refund" : "Reject Refund"}
          </h3>
        </div>
        <div className="admin-dialog-body">
          <p className="text-sm text-muted-foreground">
            {isProcess
              ? `Confirm processing refund of ${formatPrice(invoice.amount)} for order ${getOrderId(invoice).slice(-8).toUpperCase()}?`
              : `Reject refund request of ${formatPrice(invoice.amount)} for order ${getOrderId(invoice).slice(-8).toUpperCase()}?`}
          </p>
          {isProcess && (
            <p className="text-xs text-muted-foreground mt-2">
              This action will mark the refund as processed.
            </p>
          )}
        </div>
        <div className="admin-dialog-footer">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-modal-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={isProcess ? "btn-modal-primary" : "btn-modal-destructive"}
          >
            {loading ? "Processing…" : isProcess ? "Process Refund" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export function AdminRefunds() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [invoices, setInvoices] = useState<RefundInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const { inputValue: searchInput, debouncedValue: debouncedSearch, setInputValue: setSearchInput } = useDebouncedSearch({ delay: 400, minChars: 0 });

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
      toast.error("Failed to load refund invoices");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // ── Process / Reject ──
  const handleProcess = async () => {
    if (!processTarget) return;
    const { invoice, action } = processTarget;
    try {
      setProcessing(true);
      await refundService.process(invoice._id, { status: action });
      toast.success(
        action === "PROCESSED"
          ? "Refund processed successfully"
          : "Refund rejected",
      );
      setProcessTarget(null);
      fetchInvoices();
    } catch {
      toast.error("Failed to process refund");
    } finally {
      setProcessing(false);
    }
  };

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="mb-2">Refund Management</h1>
          <p className="text-muted-foreground">
            {total} refund invoice{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <button onClick={fetchInvoices} className="btn-secondary">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="admin-panel-glow rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg">
        {/* Filters */}
        <div
          className="admin-toolbar p-6 border-b border-border"
          style={{ background: "var(--surface)" }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <div className="admin-search-wrap relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by invoice ID or order ID…"
                className="input w-full"
                style={{
                  paddingLeft: "3rem",
                  paddingRight: "1rem",
                  paddingTop: "0.75rem",
                  paddingBottom: "0.75rem",
                }}
              />
            </div>
            <AdminSelect
              value={statusFilter || ""}
              options={[
                { value: "", label: "All status" },
                {
                  value: "PENDING",
                  label: "PENDING",
                  dotClassName: "bg-amber-500",
                },
                {
                  value: "PROCESSED",
                  label: "PROCESSED",
                  dotClassName: "bg-emerald-500",
                },
                {
                  value: "REJECTED",
                  label: "REJECTED",
                  dotClassName: "bg-rose-500",
                },
              ]}
              onChange={(val) => setStatusFilter(val)}
              className="min-w-[160px]"
            />
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div
            className="p-8 text-center text-muted-foreground"
            style={{ background: "var(--card)" }}
          >
            Loading...
          </div>
        ) : invoices.length === 0 ? (
          <div
            className="admin-empty-state"
            style={{ background: "var(--card)" }}
          >
            <DollarSign size={40} />
            <p>No refund invoices found</p>
          </div>
        ) : (
          <div
            className="overflow-x-auto"
            style={{ background: "var(--card)" }}
          >
            <table className="admin-table w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Invoice ID
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Order
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Reason
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  {isAdmin && (
                    <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground w-[180px]">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr
                    key={inv._id}
                    className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                    onClick={() => setDetailInvoice(inv)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs">
                        {inv._id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="font-mono text-xs">
                          {getOrderId(inv).slice(-8).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {getUserName(inv)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {getUserEmail(inv)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-sm">
                        {formatPrice(inv.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {inv.reason || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`badge ${getStatusBadgeClass(inv.status)}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            inv.status === "PENDING"
                              ? "bg-amber-500"
                              : inv.status === "PROCESSED"
                                ? "bg-emerald-500"
                                : "bg-rose-500"
                          }`}
                        />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(inv.createdAt)}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {inv.status === "PENDING" ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProcessTarget({
                                    invoice: inv,
                                    action: "PROCESSED",
                                  });
                                }}
                                className="admin-action-btn edit"
                                title="Process refund"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProcessTarget({
                                    invoice: inv,
                                    action: "REJECTED",
                                  });
                                }}
                                className="admin-action-btn delete"
                                title="Reject refund"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground ml-2">
                              {inv.status === "PROCESSED" ? "Done" : "Rejected"}
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="admin-pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {detailInvoice && (
        <RefundDetailModal
          invoice={detailInvoice}
          onClose={() => setDetailInvoice(null)}
        />
      )}

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