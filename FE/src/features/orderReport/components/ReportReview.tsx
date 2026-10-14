// ============================================================
// Report review (admin + staff) — dòng báo cáo trong danh sách và hộp xử lý.
//  - Ghi chú: sửa trên bản nháp khởi tạo từ ghi chú đã lưu, chỉ bật nút lưu
//    khi có thay đổi (xoá hết chữ được).
//  - Đánh dấu Xong / Huỷ: hỏi lại trước, gửi kèm ghi chú hiện tại.
//  - Admin: giao / đổi nhân viên xử lý, xoá báo cáo (DELETE /:id/admin).
// ============================================================

import { useEffect, useState } from "react";
import { CheckCircle2, Flag, ImageIcon, Save, UserRound, XCircle } from "lucide-react";
import { toast } from "sonner";
import { toId, toText } from "../../../lib/displayText";
import { cn } from "../../../shared/components/ui/utils";
import { AdminModal } from "../../../shared/components/admin/AdminModal";
import { ConfirmDeleteButton } from "../../../shared/components/admin/ConfirmDeleteButton";
import { orderReportService } from "../services/orderReport.service";
import type { OrderReport } from "../types/orderReport.types";
import {
  formatReportDate,
  reportCode,
  reportImages,
  reportOrderCode,
  statusMeta,
} from "../reportMeta";
import "../../../styles/report-review.css";

export interface StaffOption {
  id: string;
  name: string;
  email?: string;
}

/** Tên người xử lý: assignedStaff có thể là id hoặc object đã populate. */
export function assigneeName(report: OrderReport, staff: StaffOption[] = []): string {
  const raw = report.assignedStaff as unknown;
  if (!raw) return "";
  if (typeof raw === "object") {
    const name = toText(raw);
    if (name) return name;
  }
  const id = toId(raw);
  return staff.find((s) => s.id === id)?.name ?? "Đã giao";
}

export function ReportListItem({
  report,
  onOpen,
  showAssignee,
  staff,
}: {
  report: OrderReport;
  onOpen: () => void;
  /** Admin: hiện người xử lý (hoặc "Chưa giao"). */
  showAssignee?: boolean;
  staff?: StaffOption[];
}) {
  const meta = statusMeta(report.status);
  const images = reportImages(report);
  const assignee = showAssignee ? assigneeName(report, staff) : "";
  return (
    <button type="button" className="rv-item" data-tone={meta.tone} onClick={onOpen}>
      <span className="min-w-0 flex-1">
        <span className="rv-item-head">
          <span className={`badge ${meta.badge}`}>{meta.label}</span>
          <span className="rv-code">#{reportCode(report)}</span>
        </span>
        <span className="rv-item-title">{toText(report.title) || "Báo cáo"}</span>
        <span className="rv-item-desc">{toText(report.description)}</span>
        <span className="rv-item-meta">
          <span>Đơn #{reportOrderCode(report)}</span>
          <span>{formatReportDate(report.createdAt)}</span>
          {images.length > 0 && (
            <span>
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" /> {images.length}
            </span>
          )}
          {showAssignee && (
            <span className={cn("rv-assignee", !assignee && "is-empty")}>
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
              {assignee || "Chưa giao"}
            </span>
          )}
        </span>
      </span>
      <span className="rv-open">{report.status === "PENDING" ? "Xem & xử lý" : "Xem"}</span>
    </button>
  );
}

export function ReportReviewModal({
  report,
  onClose,
  onUpdated,
  onDeleted,
  staff,
  canAssign = false,
  canDelete = false,
}: {
  report: OrderReport;
  onClose: () => void;
  /** Báo cáo đã đổi (ghi chú / người xử lý) — vẫn mở hộp. */
  onUpdated: (report: OrderReport) => void;
  /** Trạng thái đã đổi hoặc báo cáo đã xoá — danh sách cần tải lại. */
  onDeleted?: () => void;
  staff?: StaffOption[];
  canAssign?: boolean;
  canDelete?: boolean;
}) {
  const meta = statusMeta(report.status);
  const images = reportImages(report);
  const savedNote = toText(report.adminNote);
  const currentAssignee = toId(report.assignedStaff);

  const [noteDraft, setNoteDraft] = useState(savedNote);
  const [savingNote, setSavingNote] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"DONE" | "CANCELLED" | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assignee, setAssignee] = useState(currentAssignee);
  const [assigning, setAssigning] = useState(false);

  // Mở báo cáo khác trong cùng hộp → bắt đầu lại từ dữ liệu đã lưu của nó.
  useEffect(() => {
    setNoteDraft(toText(report.adminNote));
    setAssignee(toId(report.assignedStaff));
    setPendingStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report._id]);

  const busy = savingNote || updatingStatus || assigning;
  const noteDirty = noteDraft.trim() !== savedNote.trim();
  const close = () => {
    if (!busy) onClose();
  };

  const saveNote = async () => {
    if (!noteDirty) return;
    setSavingNote(true);
    try {
      await orderReportService.updateNote(report._id, noteDraft.trim());
      onUpdated({ ...report, adminNote: noteDraft.trim() });
      toast.success("Đã lưu ghi chú");
    } catch {
      toast.error("Không lưu được ghi chú");
    } finally {
      setSavingNote(false);
    }
  };

  const assign = async () => {
    if (!assignee || assignee === currentAssignee) return;
    setAssigning(true);
    try {
      await orderReportService.assignStaff(report._id, assignee);
      onUpdated({ ...report, assignedStaff: assignee });
      toast.success(`Đã giao cho ${staff?.find((s) => s.id === assignee)?.name ?? "nhân viên"}`);
    } catch {
      toast.error("Không giao được báo cáo");
    } finally {
      setAssigning(false);
    }
  };

  const updateStatus = async () => {
    if (!pendingStatus) return;
    setUpdatingStatus(true);
    try {
      await orderReportService.updateStatus(report._id, pendingStatus, noteDraft.trim() || undefined);
      toast.success(pendingStatus === "DONE" ? "Đã đánh dấu báo cáo là xong" : "Đã huỷ báo cáo");
      onDeleted?.();
      onClose();
    } catch {
      toast.error("Không cập nhật được trạng thái");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const remove = async () => {
    try {
      await orderReportService.adminDelete(report._id);
      toast.success("Đã xoá báo cáo");
      onDeleted?.();
      onClose();
    } catch {
      toast.error("Không xoá được báo cáo");
    }
  };

  return (
    <AdminModal
      variant="view"
      size="md"
      icon={Flag}
      eyebrow="Báo cáo đơn hàng"
      title={toText(report.title) || "Báo cáo"}
      subtitle={`#${reportCode(report)} · Đơn #${reportOrderCode(report)} · ${formatReportDate(report.createdAt, "HH:mm dd/MM/yyyy")}`}
      badges={<span className={`badge ${meta.badge}`}>{meta.label}</span>}
      onClose={close}
    >
      <div className="admin-dialog-body">

        {canAssign && (
          <div>
            <label htmlFor="rv-assignee" className="rv-label">
              Người xử lý
            </label>
            <div className="rv-assign">
              <select
                id="rv-assignee"
                className="input"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                disabled={assigning || !staff?.length}
              >
                <option value="">{staff?.length ? "Chọn nhân viên…" : "Chưa có nhân viên"}</option>
                {staff?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.email ? ` — ${s.email}` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-secondary"
                onClick={assign}
                disabled={!assignee || assignee === currentAssignee || assigning}
              >
                {assigning ? "Đang giao…" : currentAssignee ? "Đổi người" : "Giao việc"}
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="rv-label">Nội dung khách báo</p>
          <p className="rv-quote">{toText(report.description) || "—"}</p>
        </div>

        {images.length > 0 && (
          <div>
            <p className="rv-label">Ảnh đính kèm ({images.length})</p>
            <div className="rv-imgs">
              {images.map((img, i) => (
                <a key={i} href={img} target="_blank" rel="noreferrer" className="rv-img">
                  <img src={img} alt={`Ảnh ${i + 1}`} />
                </a>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="rv-note" className="rv-label">
            Ghi chú xử lý · khách sẽ thấy
          </label>
          <textarea
            id="rv-note"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            className="input w-full min-h-[96px] resize-y"
            placeholder="Bạn đã làm gì để xử lý báo cáo này?"
          />
          <div className="rv-note-foot">
            <span className={cn("rv-note-state", noteDirty && "is-dirty")}>
              {noteDirty ? "Có thay đổi chưa lưu" : savedNote ? "Đã lưu" : "Chưa có ghi chú"}
            </span>
            <button type="button" className="btn-secondary" onClick={saveNote} disabled={!noteDirty || savingNote}>
              <Save className="h-4 w-4" />
              {savingNote ? "Đang lưu…" : "Lưu ghi chú"}
            </button>
          </div>
        </div>

        {report.status === "PENDING" && pendingStatus && (
          <div className={cn("rv-confirm", pendingStatus === "DONE" ? "is-done" : "is-cancel")}>
            {pendingStatus === "DONE"
              ? "Đánh dấu báo cáo này là ĐÃ XỬ LÝ XONG?"
              : "Huỷ báo cáo này? (dùng khi báo cáo không hợp lệ)"}
            {noteDraft.trim() && " Ghi chú hiện tại sẽ được lưu kèm."}
          </div>
        )}
      </div>

      <div className="admin-dialog-footer">
        {canDelete && !pendingStatus && (
          <span className="rv-footer-start">
            <ConfirmDeleteButton onDelete={remove} itemName={toText(report.title) || "báo cáo này"} />
          </span>
        )}
        {report.status !== "PENDING" ? (
          <button type="button" className="btn-modal-cancel" onClick={close}>
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
              onClick={updateStatus}
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
  );
}
