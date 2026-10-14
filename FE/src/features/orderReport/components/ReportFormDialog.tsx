// ============================================================
// ReportFormDialog — khách gửi (hoặc sửa) báo cáo sự cố cho một đơn hàng.
//  - Chip "vấn đề hay gặp" điền sẵn tiêu đề
//  - Đếm ký tự + báo lỗi ngay dưới ô (giới hạn khớp BE)
//  - Ảnh: kéo-thả / chọn, tối đa 5, xem trước + gỡ (chỉ khi tạo mới —
//    PUT /order-reports/:id của form này chỉ sửa chữ)
//  - Gửi xong: màn hình xác nhận + lối tắt sang "Báo cáo của tôi"
// ============================================================

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Link } from "react-router";
import { CheckCircle2, Flag, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../shared/components/ui/dialog";
import { shortId, toId } from "../../../lib/displayText";
import { orderReportService } from "../services/orderReport.service";
import type { OrderReport } from "../types/orderReport.types";
import {
  REPORT_DESC_MAX,
  REPORT_DESC_MIN,
  REPORT_ISSUE_PRESETS,
  REPORT_MAX_IMAGES,
  REPORT_TITLE_MAX,
  REPORT_TITLE_MIN,
  reportCode,
  reportErrorMessage,
  reportImages,
} from "../reportMeta";
import "../../../styles/reports.css";

type ReportFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Gọi sau khi gửi / lưu thành công. */
  onSaved?: (report?: OrderReport) => void;
} & (
  | { mode: "create"; orderId: string; report?: undefined }
  | { mode: "edit"; report: OrderReport; orderId?: undefined }
);

export function ReportFormDialog(props: ReportFormDialogProps) {
  const { open, onOpenChange, onSaved, mode } = props;
  const editing = mode === "edit" ? props.report : undefined;
  const orderId = editing ? toId(editing.orderId) : props.orderId ?? "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doneCode, setDoneCode] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mở lại → bắt đầu từ giá trị của báo cáo đang sửa (hoặc form trống).
  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? "");
    setDescription(editing?.description ?? "");
    setFiles([]);
    setTriedSubmit(false);
    setDoneCode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const titleLen = title.trim().length;
  const descLen = description.trim().length;
  const titleError =
    titleLen === 0 ? "Hãy đặt tiêu đề ngắn cho sự cố." : titleLen < REPORT_TITLE_MIN ? `Cần ít nhất ${REPORT_TITLE_MIN} ký tự.` : "";
  const descError =
    descLen === 0
      ? "Hãy mô tả điều đã xảy ra."
      : descLen < REPORT_DESC_MIN
        ? `Cần ít nhất ${REPORT_DESC_MIN} ký tự — còn ${REPORT_DESC_MIN - descLen} ký tự nữa.`
        : "";
  const valid = !titleError && !descError;
  const unchanged = editing ? title.trim() === editing.title.trim() && description.trim() === editing.description.trim() : false;

  const addFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const images = Array.from(incoming).filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) return;
    setFiles((prev) => {
      const next = [...prev, ...images];
      if (next.length > REPORT_MAX_IMAGES) toast.info(`Chỉ đính kèm tối đa ${REPORT_MAX_IMAGES} ảnh.`);
      return next.slice(0, REPORT_MAX_IMAGES);
    });
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriedSubmit(true);
    if (!valid || submitting || unchanged) return;
    setSubmitting(true);
    try {
      if (editing) {
        const { data } = await orderReportService.update(editing._id, {
          title: title.trim(),
          description: description.trim(),
        });
        toast.success("Đã cập nhật báo cáo");
        // PUT trả { data: { report } } (POST thì trả thẳng { data: report }).
        const body = data?.data as unknown as { report?: OrderReport } | undefined;
        onSaved?.({ ...editing, title: title.trim(), description: description.trim(), ...(body?.report ?? {}) });
        onOpenChange(false);
      } else {
        const { data } = await orderReportService.create({
          orderId,
          title: title.trim(),
          description: description.trim(),
          images: files,
        });
        const created = (data?.data as unknown as { report?: OrderReport } & OrderReport) ?? undefined;
        const report = created?.report ?? created;
        setDoneCode(report?._id ? reportCode(report) : "");
        onSaved?.(report);
      }
    } catch (error) {
      toast.error(reportErrorMessage(error, editing ? "Không lưu được báo cáo. Vui lòng thử lại." : "Không gửi được báo cáo. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="rp-dialog glass-panel-solid max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        {doneCode !== null ? (
          <div className="rp-done" role="status">
            <span className="rp-done-icon" aria-hidden="true">
              <CheckCircle2 className="size-7" />
            </span>
            <DialogTitle className="rp-done-title">Đã gửi báo cáo</DialogTitle>
            <DialogDescription className="rp-done-desc">
              {doneCode ? (
                <>
                  Mã báo cáo <b>#{doneCode}</b>.{" "}
                </>
              ) : null}
              Đội ngũ Len&amp;Em sẽ xem và phản hồi bạn sớm nhất — bạn sẽ nhận được thông báo khi có cập nhật.
            </DialogDescription>
            <div className="rp-done-actions">
              <button type="button" className="rp-btn-ghost" onClick={() => onOpenChange(false)}>
                Đóng
              </button>
              <Link to="/orders/reports" className="rp-btn-primary" onClick={() => onOpenChange(false)}>
                Xem báo cáo của tôi
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="grid gap-5">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="rp-dialog-icon" aria-hidden="true">
                  <Flag className="size-4" />
                </span>
                <div className="min-w-0 text-left">
                  <DialogTitle className="rp-dialog-title">{editing ? "Sửa báo cáo" : "Báo cáo sự cố"}</DialogTitle>
                  <DialogDescription className="rp-dialog-sub">
                    Đơn <b>#{shortId(orderId)}</b>
                    {editing ? ` · Báo cáo #${reportCode(editing)}` : " · Kể cho chúng mình điều chưa ổn nhé"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Vấn đề hay gặp */}
            <div>
              <p className="rp-label">Vấn đề bạn gặp</p>
              <div className="rp-chips" role="group" aria-label="Vấn đề hay gặp">
                {REPORT_ISSUE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="rp-chip"
                    aria-pressed={title.trim() === preset}
                    onClick={() => setTitle(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="rp-label-row">
                <label htmlFor="rp-title" className="rp-label">
                  Tiêu đề<span className="rp-req">*</span>
                </label>
                <span className="rp-count">
                  {titleLen}/{REPORT_TITLE_MAX}
                </span>
              </div>
              <input
                id="rp-title"
                value={title}
                maxLength={REPORT_TITLE_MAX}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Cuộn len bị đứt sợi"
                aria-invalid={triedSubmit && !!titleError}
                className={`rp-input${triedSubmit && titleError ? " is-invalid" : ""}`}
              />
              {triedSubmit && titleError && <p className="rp-error">{titleError}</p>}
            </div>

            <div>
              <div className="rp-label-row">
                <label htmlFor="rp-desc" className="rp-label">
                  Mô tả chi tiết<span className="rp-req">*</span>
                </label>
                <span className={`rp-count${descLen > 0 && descLen < REPORT_DESC_MIN ? " is-short" : ""}`}>
                  {descLen}/{REPORT_DESC_MAX}
                </span>
              </div>
              <textarea
                id="rp-desc"
                value={description}
                maxLength={REPORT_DESC_MAX}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Sản phẩm nào, tình trạng ra sao, bạn mong muốn được hỗ trợ thế nào (đổi, trả, hoàn tiền…)"
                aria-invalid={triedSubmit && !!descError}
                className={`rp-input rp-textarea${triedSubmit && descError ? " is-invalid" : ""}`}
              />
              {triedSubmit && descError ? (
                <p className="rp-error">{descError}</p>
              ) : (
                <p className="rp-hint">Mô tả càng rõ, chúng mình xử lý càng nhanh.</p>
              )}
            </div>

            {editing ? (
              reportImages(editing).length > 0 && (
                <div>
                  <p className="rp-label">Ảnh đã gửi</p>
                  <div className="rp-thumbs">
                    {reportImages(editing).map((src, i) => (
                      <span key={i} className="rp-thumb">
                        <img src={src} alt={`Ảnh ${i + 1}`} />
                      </span>
                    ))}
                  </div>
                  <p className="rp-hint">Ảnh đã gửi không thể thay đổi.</p>
                </div>
              )
            ) : (
              <div>
                <div className="rp-label-row">
                  <span className="rp-label">Ảnh minh hoạ (không bắt buộc)</span>
                  <span className="rp-count">
                    {files.length}/{REPORT_MAX_IMAGES}
                  </span>
                </div>
                <div className="rp-thumbs">
                  {previews.map((src, i) => (
                    <span key={src} className="rp-thumb">
                      <img src={src} alt={`Ảnh ${i + 1}`} />
                      <button
                        type="button"
                        className="rp-thumb-remove"
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label={`Gỡ ảnh ${i + 1}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                  {files.length < REPORT_MAX_IMAGES && (
                    <label
                      className={`rp-drop${dragging ? " is-dragging" : ""}${files.length > 0 ? " is-compact" : ""}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={onDrop}
                    >
                      <ImagePlus className="size-5" aria-hidden="true" />
                      {files.length === 0 ? (
                        <span>
                          <b>Chọn ảnh</b> hoặc kéo thả vào đây
                        </span>
                      ) : (
                        <span className="sr-only">Thêm ảnh</span>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={(e) => {
                          addFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            <div className="rp-actions">
              <button type="button" className="rp-btn-ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
                Huỷ
              </button>
              <button type="submit" className="rp-btn-primary" disabled={submitting || unchanged}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {editing ? (submitting ? "Đang lưu…" : "Lưu thay đổi") : submitting ? "Đang gửi…" : "Gửi báo cáo"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
