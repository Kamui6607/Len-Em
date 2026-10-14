// ============================================================
// MyReportsPage — route /orders/reports
// Khách theo dõi các báo cáo sự cố đã gửi + phản hồi từ shop.
//  - GET /order-reports/my chỉ hỗ trợ page/limit (BE bỏ qua search/status)
//    → tải một lượt rồi lọc / tìm / phân trang ngay trên client.
//  - Tự làm mới mỗi 30s khi tab đang mở. Không tự bắn toast khi trạng thái
//    đổi: BE đã gửi thông báo realtime cho việc đó.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flag,
  ImageIcon,
  MessageSquareText,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { orderReportService } from "../../features/orderReport/services/orderReport.service";
import type { OrderReport } from "../../features/orderReport/types/orderReport.types";
import { ReportFormDialog } from "../../features/orderReport/components/ReportFormDialog";
import {
  formatReportDate,
  reportCode,
  reportErrorMessage,
  reportImages,
  reportOrderCode,
  reportOrderId,
  statusMeta,
  type ReportStatus,
} from "../../features/orderReport/reportMeta";
import { toText } from "../../lib/displayText";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../shared/components/ui/dialog";
import "../../styles/purchased.css";
import "../../styles/reports.css";

const PAGE_SIZE = 8;
const FETCH_LIMIT = 100;
const POLLING_INTERVAL = 30000;

const TABS: { value: ReportStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Đang xử lý" },
  { value: "DONE", label: "Đã giải quyết" },
  { value: "CANCELLED", label: "Đã đóng" },
];

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function MyReportsPage() {
  const [reports, setReports] = useState<OrderReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<ReportStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [viewing, setViewing] = useState<OrderReport | null>(null);
  const [editing, setEditing] = useState<OrderReport | null>(null);
  const [deleting, setDeleting] = useState<OrderReport | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchReports = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await orderReportService.getMyReports({ page: 1, limit: FETCH_LIMIT });
      const list = Array.isArray(data.data?.reports) ? data.data.reports : [];
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReports(list);
      setLoadError(false);
      // Hộp chi tiết đang mở → cập nhật theo dữ liệu mới (vd. shop vừa phản hồi).
      setViewing((current) => (current ? list.find((r) => r._id === current._id) ?? current : current));
    } catch {
      if (!silent) setLoadError(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchReports(true);
    }, POLLING_INTERVAL);
    return () => window.clearInterval(interval);
  }, [fetchReports]);

  const counts = useMemo(() => {
    const c: Record<ReportStatus | "ALL", number> = { ALL: reports.length, PENDING: 0, DONE: 0, CANCELLED: 0 };
    reports.forEach((r) => {
      if (r.status in c) c[r.status] += 1;
    });
    return c;
  }, [reports]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim().replace(/^#/, ""));
    return reports.filter((r) => {
      if (tab !== "ALL" && r.status !== tab) return false;
      if (!q) return true;
      return [toText(r.title), r._id, reportOrderId(r)].some((field) => normalize(field).includes(q));
    });
  }, [reports, tab, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filtering = tab !== "ALL" || query.trim() !== "";

  const replaceReport = (updated: OrderReport) => {
    setReports((prev) => prev.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)));
    setViewing((current) => (current?._id === updated._id ? { ...current, ...updated } : current));
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await orderReportService.delete(deleting._id);
      setReports((prev) => prev.filter((r) => r._id !== deleting._id));
      if (viewing?._id === deleting._id) setViewing(null);
      toast.success("Đã xoá báo cáo");
      setDeleting(null);
    } catch (error) {
      toast.error(reportErrorMessage(error, "Không xoá được báo cáo. Vui lòng thử lại."));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-12">
      <div className="mx-auto max-w-4xl">
        <Link to="/purchased" className="rp-back">
          <ArrowLeft className="size-4" />
          Đơn hàng của tôi
        </Link>

        <header className="purchased-hero">
          <div className="min-w-0">
            <p className="purchased-eyebrow">Hỗ trợ đơn hàng</p>
            <h1 className="purchased-title">Báo cáo của tôi</h1>
            <div className="purchased-title-stitch" aria-hidden />
            <p className="purchased-subtitle">
              Theo dõi các sự cố bạn đã báo và phản hồi từ Len&amp;Em. Báo cáo đang xử lý vẫn có thể sửa hoặc xoá.
            </p>
          </div>
          {!loading && reports.length > 0 && (
            <div className="purchased-hero-count">
              <span className="purchased-hero-count-num">{counts.PENDING}</span>
              <span className="purchased-hero-count-label">đang xử lý</span>
            </div>
          )}
        </header>

        {loading ? (
          <div className="grid gap-4">
            <div className="purchased-skeleton h-12 w-full rounded-2xl" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="purchased-skeleton h-40 w-full rounded-3xl" />
            ))}
          </div>
        ) : loadError ? (
          <div className="purchased-empty">
            <span className="rp-empty-mark" aria-hidden="true">
              <Flag className="size-8" />
            </span>
            <h2 className="purchased-empty-title">Không tải được báo cáo</h2>
            <p className="purchased-empty-desc">Kết nối có trục trặc. Bạn thử tải lại nhé.</p>
            <button type="button" className="purchased-empty-btn" onClick={() => void fetchReports()}>
              <RotateCcw className="size-4" />
              Thử lại
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="purchased-empty">
            <span className="rp-empty-mark" aria-hidden="true">
              <Flag className="size-8" />
            </span>
            <h2 className="purchased-empty-title">Chưa có báo cáo nào</h2>
            <p className="purchased-empty-desc">
              Nếu đơn hàng có vấn đề, mở đơn đó và bấm biểu tượng <Flag className="inline size-3.5 align-[-2px]" /> để báo
              cho chúng mình.
            </p>
            <Link to="/purchased" className="purchased-empty-btn">
              Đến đơn hàng của tôi
            </Link>
          </div>
        ) : (
          <>
            {/* Toolbar: trạng thái + tìm kiếm */}
            <div className="rp-toolbar">
              <div className="rp-tabs" role="tablist" aria-label="Lọc theo trạng thái">
                {TABS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.value}
                    className="rp-tab"
                    onClick={() => {
                      setTab(t.value);
                      setPage(1);
                    }}
                  >
                    {t.label}
                    <span className="rp-tab-count">{counts[t.value]}</span>
                  </button>
                ))}
              </div>
              <label className="rp-search">
                <Search className="size-4 shrink-0" aria-hidden="true" />
                <span className="sr-only">Tìm báo cáo</span>
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm theo tiêu đề, mã báo cáo hoặc mã đơn"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} aria-label="Xoá tìm kiếm" className="rp-search-clear">
                    <X className="size-3.5" />
                  </button>
                )}
              </label>
            </div>

            {filtered.length === 0 ? (
              <div className="rp-noresult">
                <p>Không có báo cáo nào phù hợp.</p>
                {filtering && (
                  <button
                    type="button"
                    className="rp-btn-ghost"
                    onClick={() => {
                      setTab("ALL");
                      setQuery("");
                    }}
                  >
                    Bỏ lọc
                  </button>
                )}
              </div>
            ) : (
              <ul className="rp-list">
                {pageItems.map((report) => (
                  <ReportCard
                    key={report._id}
                    report={report}
                    onOpen={() => setViewing(report)}
                    onEdit={() => setEditing(report)}
                    onDelete={() => setDeleting(report)}
                  />
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <nav className="rp-pager" aria-label="Phân trang">
                <button
                  type="button"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span>
                  Trang <b>{currentPage}</b> / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  aria-label="Trang sau"
                >
                  <ChevronRight className="size-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </div>

      <ReportDetailDialog
        report={viewing}
        onClose={() => setViewing(null)}
        onEdit={(r) => setEditing(r)}
        onDelete={(r) => setDeleting(r)}
      />

      {editing && (
        <ReportFormDialog
          mode="edit"
          report={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={(updated) => updated && replaceReport(updated)}
        />
      )}

      <Dialog open={!!deleting} onOpenChange={(open) => !open && !deleteBusy && setDeleting(null)}>
        <DialogContent className="rp-dialog glass-panel-solid sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="rp-dialog-title">Xoá báo cáo này?</DialogTitle>
            <DialogDescription className="rp-dialog-sub">
              Báo cáo #{deleting ? reportCode(deleting) : ""} sẽ bị xoá và không thể khôi phục. Nếu sự cố vẫn còn, bạn có
              thể sửa báo cáo thay vì xoá.
            </DialogDescription>
          </DialogHeader>
          <div className="rp-actions">
            <button type="button" className="rp-btn-ghost" onClick={() => setDeleting(null)} disabled={deleteBusy}>
              Giữ lại
            </button>
            <button type="button" className="rp-btn-danger" onClick={confirmDelete} disabled={deleteBusy}>
              <Trash2 className="size-4" />
              {deleteBusy ? "Đang xoá…" : "Xoá báo cáo"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Thẻ báo cáo trong danh sách ──
function ReportCard({
  report,
  onOpen,
  onEdit,
  onDelete,
}: {
  report: OrderReport;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = statusMeta(report.status);
  const images = reportImages(report);
  const note = toText(report.adminNote).trim();
  const editable = report.status === "PENDING";

  return (
    <li className="rp-card" data-tone={meta.tone}>
      <button type="button" className="rp-card-main" onClick={onOpen}>
        <span className="rp-card-top">
          <span className={`badge ${meta.badge}`}>{meta.customerLabel}</span>
          <span className="rp-code">#{reportCode(report)}</span>
          <span className="rp-date">{formatReportDate(report.createdAt)}</span>
        </span>
        <span className="rp-card-title">{toText(report.title) || "Báo cáo"}</span>
        <span className="rp-card-desc">{toText(report.description)}</span>
        <span className="rp-card-meta">
          <span>Đơn #{reportOrderCode(report)}</span>
          {images.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <ImageIcon className="size-3.5" aria-hidden="true" />
              {images.length} ảnh
            </span>
          )}
        </span>
        {note && (
          <span className="rp-card-note">
            <MessageSquareText className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              <b>Len&amp;Em:</b> {note}
            </span>
          </span>
        )}
      </button>
      <span className="rp-card-actions">
        <button type="button" className="rp-link" onClick={onOpen}>
          Xem chi tiết
        </button>
        {editable && (
          <>
            <button type="button" className="rp-icon-btn" onClick={onEdit} aria-label="Sửa báo cáo" title="Sửa">
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              className="rp-icon-btn is-danger"
              onClick={onDelete}
              aria-label="Xoá báo cáo"
              title="Xoá"
            >
              <Trash2 className="size-3.5" />
            </button>
          </>
        )}
      </span>
    </li>
  );
}

// ── Chi tiết báo cáo: tiến trình + nội dung + phản hồi của shop ──
function ReportDetailDialog({
  report,
  onClose,
  onEdit,
  onDelete,
}: {
  report: OrderReport | null;
  onClose: () => void;
  onEdit: (report: OrderReport) => void;
  onDelete: (report: OrderReport) => void;
}) {
  const meta = report ? statusMeta(report.status) : null;
  const images = report ? reportImages(report) : [];
  const note = report ? toText(report.adminNote).trim() : "";
  const closed = report && report.status !== "PENDING";

  return (
    <Dialog open={!!report} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rp-dialog glass-panel-solid max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        {report && meta && (
          <div className="grid gap-5">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <span className={`badge ${meta.badge}`}>{meta.customerLabel}</span>
                <span className="rp-code">Báo cáo #{reportCode(report)}</span>
              </div>
              <DialogTitle className="rp-detail-title">{toText(report.title) || "Báo cáo"}</DialogTitle>
              <DialogDescription className="rp-dialog-sub">
                Đơn{" "}
                <Link to={`/purchased/${reportOrderId(report)}`} className="rp-order-link" onClick={onClose}>
                  #{reportOrderCode(report)}
                </Link>{" "}
                · Gửi lúc {formatReportDate(report.createdAt, "HH:mm dd/MM/yyyy")}
              </DialogDescription>
            </DialogHeader>

            {/* Tiến trình: Đã gửi → Đang xử lý → Giải quyết / Đóng */}
            <ol className="rp-steps" data-tone={meta.tone} aria-label="Tiến trình xử lý">
              <li className="is-done">
                <span className="rp-step-dot" />
                <span>
                  Đã gửi
                  <small>{formatReportDate(report.createdAt)}</small>
                </span>
              </li>
              <li className={closed ? "is-done" : "is-current"}>
                <span className="rp-step-dot" />
                <span>Đang xử lý</span>
              </li>
              <li className={closed ? "is-done is-final" : ""}>
                <span className="rp-step-dot" />
                <span>
                  {report.status === "CANCELLED" ? "Đã đóng" : "Đã giải quyết"}
                  {closed && <small>{formatReportDate(report.updatedAt)}</small>}
                </span>
              </li>
            </ol>

            <section>
              <p className="rp-label">Bạn đã báo</p>
              <p className="rp-detail-text">{toText(report.description) || "—"}</p>
            </section>

            {images.length > 0 && (
              <section>
                <p className="rp-label">Ảnh đính kèm</p>
                <div className="rp-thumbs">
                  {images.map((src, i) => (
                    <a key={i} href={src} target="_blank" rel="noreferrer" className="rp-thumb is-link">
                      <img src={src} alt={`Ảnh ${i + 1}`} />
                    </a>
                  ))}
                </div>
              </section>
            )}

            <section className={`rp-reply${note ? "" : " is-empty"}`}>
              <p className="rp-reply-head">
                <MessageSquareText className="size-4" aria-hidden="true" />
                Phản hồi từ Len&amp;Em
              </p>
              <p className="rp-detail-text">
                {note ||
                  (report.status === "PENDING"
                    ? "Chưa có phản hồi — chúng mình đang xem báo cáo của bạn và sẽ cập nhật sớm."
                    : "Báo cáo đã được xử lý.")}
              </p>
            </section>

            <div className="rp-actions">
              {report.status === "PENDING" ? (
                <>
                  <button type="button" className="rp-btn-ghost is-danger" onClick={() => onDelete(report)}>
                    <Trash2 className="size-4" />
                    Xoá
                  </button>
                  <button type="button" className="rp-btn-primary" onClick={() => onEdit(report)}>
                    <Pencil className="size-4" />
                    Sửa báo cáo
                  </button>
                </>
              ) : (
                <Link to={`/purchased/${reportOrderId(report)}`} className="rp-btn-primary" onClick={onClose}>
                  Xem đơn hàng
                </Link>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
