// ============================================================
// StaffReports — route /staff/reports
// Staff xử lý các báo cáo đơn hàng mà Admin giao cho mình.
// - Lọc theo trạng thái bằng tab (mặc định "Đang chờ" — việc cần làm).
// - Ghi chú: sửa trên bản nháp khởi tạo từ ghi chú đã lưu; chỉ bật nút
//   lưu khi có thay đổi (trước đây ô ghi chú dùng `newNote || adminNote`
//   nên không thể xoá hết chữ).
// - Đánh dấu Xong / Huỷ kèm ghi chú hiện tại, có hỏi lại trước khi đổi.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CheckCircle2, Flag, XCircle, ImageIcon, Save } from "lucide-react";
import { orderReportService } from "../../../features/orderReport/services/orderReport.service";
import type { OrderReport } from "../../../features/orderReport/types/orderReport.types";
import { useAuth } from "../../../shared/hooks/useAuth";
import { shortId, toText } from "../../../lib/displayText";
import { cn } from "../../../shared/components/ui/utils";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import { AdminModal } from "../../../shared/components/admin/AdminModal";
import { AdminPagination } from "../../../shared/components/admin/AdminPagination";

type ReportStatus = OrderReport["status"];

const PAGE_SIZE = 10;

const STATUS_TABS: { value: ReportStatus | ""; label: string }[] = [
  { value: "PENDING", label: "Đang chờ" },
  { value: "DONE", label: "Đã xong" },
  { value: "CANCELLED", label: "Đã huỷ" },
  { value: "", label: "Tất cả" },
];

const STATUS_META: Record<ReportStatus, { label: string; badge: string }> = {
  PENDING: { label: "Đang chờ", badge: "badge-orange" },
  DONE: { label: "Đã xong", badge: "badge-green" },
  CANCELLED: { label: "Đã huỷ", badge: "badge-red" },
};

function formatDate(value: string, pattern: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : format(date, pattern);
}

export function StaffReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<OrderReport[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ReportStatus | "">("PENDING");

  // Hộp chi tiết
  const [selected, setSelected] = useState<OrderReport | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"DONE" | "CANCELLED" | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await orderReportService.getAll({
        page,
        limit: PAGE_SIZE,
        assignedStaff: user?.id,
        status: filterStatus || undefined,
      });
      const list = Array.isArray(data.data?.reports) ? data.data.reports : [];
      setReports(list);
      setTotal(data.data?.total ?? list.length);
      setTotalPages(Math.max(1, data.data?.totalPages ?? 1));
    } catch {
      toast.error("Không tải được danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, user?.id]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const openReport = (report: OrderReport) => {
    setSelected(report);
    setNoteDraft(toText(report.adminNote));
    setPendingStatus(null);
  };

  const closeReport = () => {
    if (savingNote || updatingStatus) return;
    setSelected(null);
    setPendingStatus(null);
  };

  const savedNote = selected ? toText(selected.adminNote) : "";
  const noteDirty = noteDraft.trim() !== savedNote.trim();

  const handleSaveNote = async () => {
    if (!selected || !noteDirty) return;
    setSavingNote(true);
    try {
      await orderReportService.updateNote(selected._id, noteDraft.trim());
      const updated = { ...selected, adminNote: noteDraft.trim() };
      setSelected(updated);
      setReports((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      toast.success("Đã lưu ghi chú");
    } catch {
      toast.error("Không lưu được ghi chú");
    } finally {
      setSavingNote(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selected || !pendingStatus) return;
    setUpdatingStatus(true);
    try {
      await orderReportService.updateStatus(selected._id, pendingStatus, noteDraft.trim() || undefined);
      toast.success(pendingStatus === "DONE" ? "Đã đánh dấu báo cáo là xong" : "Đã huỷ báo cáo");
      setSelected(null);
      setPendingStatus(null);
      void fetchReports();
    } catch {
      toast.error("Không cập nhật được trạng thái");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const activeTab = STATUS_TABS.find((tab) => tab.value === filterStatus);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Được giao cho bạn"
        title="Báo cáo đơn hàng"
        subtitle="Xử lý các khiếu nại của khách mà Admin đã giao cho bạn."
      />

      <AdminPanel hover={false}>
        <div className="admin-toolbar staff-tabs" role="tablist" aria-label="Lọc theo trạng thái">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value || "all"}
              type="button"
              role="tab"
              aria-selected={filterStatus === tab.value}
              className={cn("staff-tab", filterStatus === tab.value && "is-active")}
              onClick={() => {
                setFilterStatus(tab.value);
                setPage(1);
              }}
            >
              {tab.label}
              {filterStatus === tab.value && !loading && <span className="staff-tab-count">{total}</span>}
            </button>
          ))}
        </div>

        <div className="staff-reports">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="admin-skeleton h-24 rounded-2xl" />)
          ) : reports.length === 0 ? (
            <div className="admin-empty-state">
              <Flag size={40} />
              <p>
                {filterStatus === "PENDING"
                  ? "Không có báo cáo nào đang chờ bạn"
                  : `Không có báo cáo "${activeTab?.label.toLowerCase()}"`}
              </p>
              <p className="text-sm">Khi Admin giao báo cáo cho bạn, nó sẽ xuất hiện ở đây.</p>
            </div>
          ) : (
            reports.map((report) => {
              const meta = STATUS_META[report.status] ?? STATUS_META.PENDING;
              return (
                <button
                  key={report._id}
                  type="button"
                  className="staff-report"
                  onClick={() => openReport(report)}
                >
                  <span className="min-w-0 flex-1 text-left">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${meta.badge}`}>{meta.label}</span>
                      <span className="staff-report-id">#{shortId(report._id)}</span>
                    </span>
                    <span className="staff-report-title">{toText(report.title) || "Báo cáo"}</span>
                    <span className="staff-report-desc">{toText(report.description)}</span>
                    <span className="staff-report-meta">
                      Đơn #{shortId(report.orderId)} · {formatDate(report.createdAt, "dd/MM/yyyy")}
                      {Array.isArray(report.images) && report.images.length > 0 && (
                        <>
                          {" "}
                          · <ImageIcon className="inline h-3.5 w-3.5" /> {report.images.length}
                        </>
                      )}
                    </span>
                  </span>
                  <span className="staff-report-open">Xem &amp; xử lý</span>
                </button>
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
        disabled={loading}
      />

      {selected && (
        <AdminModal
          title={toText(selected.title) || "Báo cáo"}
          onClose={closeReport}
          className="max-w-lg w-full"
        >
          <div className="admin-dialog-body">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className={`badge ${(STATUS_META[selected.status] ?? STATUS_META.PENDING).badge}`}>
                {(STATUS_META[selected.status] ?? STATUS_META.PENDING).label}
              </span>
              <span>Báo cáo #{shortId(selected._id)}</span>
              <span>· Đơn #{shortId(selected.orderId)}</span>
              <span>· {formatDate(selected.createdAt, "dd/MM/yyyy HH:mm")}</span>
            </div>

            <div>
              <p className="staff-label">Nội dung khách báo</p>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {toText(selected.description) || "—"}
              </p>
            </div>

            {Array.isArray(selected.images) && selected.images.length > 0 && (
              <div>
                <p className="staff-label">Ảnh đính kèm</p>
                <div className="flex flex-wrap gap-2">
                  {selected.images.map((img, i) => (
                    <a key={i} href={toText(img)} target="_blank" rel="noreferrer" className="staff-report-img">
                      <img src={toText(img)} alt={`Ảnh ${i + 1}`} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="staff-note" className="staff-label">
                Ghi chú xử lý
              </label>
              <textarea
                id="staff-note"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                className="input w-full min-h-[96px] resize-y"
                placeholder="Bạn đã làm gì để xử lý báo cáo này?"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {noteDirty ? "Có thay đổi chưa lưu" : savedNote ? "Đã lưu" : "Chưa có ghi chú"}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleSaveNote}
                  disabled={!noteDirty || savingNote}
                >
                  <Save className="h-4 w-4" />
                  {savingNote ? "Đang lưu…" : "Lưu ghi chú"}
                </button>
              </div>
            </div>

            {selected.status === "PENDING" && pendingStatus && (
              <div className={cn("staff-confirm", pendingStatus === "DONE" ? "is-done" : "is-cancel")}>
                {pendingStatus === "DONE"
                  ? "Đánh dấu báo cáo này là ĐÃ XỬ LÝ XONG?"
                  : "Huỷ báo cáo này? (dùng khi báo cáo không hợp lệ)"}
                {noteDraft.trim() && " Ghi chú hiện tại sẽ được lưu kèm."}
              </div>
            )}
          </div>

          <div className="admin-dialog-footer">
            {selected.status !== "PENDING" ? (
              <button type="button" className="btn-modal-cancel" onClick={closeReport}>
                Đóng
              </button>
            ) : pendingStatus ? (
              <>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setPendingStatus(null)}
                  disabled={updatingStatus}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  className={pendingStatus === "DONE" ? "btn-modal-primary" : "btn-modal-destructive"}
                  onClick={handleUpdateStatus}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? "Đang cập nhật…" : pendingStatus === "DONE" ? "Xác nhận xong" : "Xác nhận huỷ"}
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-modal-cancel" onClick={() => setPendingStatus("CANCELLED")}>
                  <XCircle className="h-4 w-4" />
                  Huỷ báo cáo
                </button>
                <button type="button" className="btn-modal-primary" onClick={() => setPendingStatus("DONE")}>
                  <CheckCircle2 className="h-4 w-4" />
                  Đánh dấu xong
                </button>
              </>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
}
