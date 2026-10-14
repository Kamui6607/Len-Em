// ============================================================
// Order reports — nhãn, màu và giới hạn dùng chung cho mọi màn hình
// (khách: gửi / xem báo cáo · staff · admin).
// Giới hạn khớp model BE (BE/src/models/orderReport.js + multer).
// ============================================================

import { format } from "date-fns";
import { shortId, toId, toText } from "../../lib/displayText";
import type { OrderReport } from "./types/orderReport.types";

export type ReportStatus = OrderReport["status"];

export const REPORT_TITLE_MIN = 5;
export const REPORT_TITLE_MAX = 120;
export const REPORT_DESC_MIN = 10;
export const REPORT_DESC_MAX = 1000;
export const REPORT_MAX_IMAGES = 5;

export const REPORT_STATUS_META: Record<
  ReportStatus,
  { label: string; customerLabel: string; badge: string; tone: "pending" | "done" | "cancelled" }
> = {
  PENDING: { label: "Đang chờ", customerLabel: "Đang xử lý", badge: "badge-orange", tone: "pending" },
  DONE: { label: "Đã xong", customerLabel: "Đã giải quyết", badge: "badge-green", tone: "done" },
  CANCELLED: { label: "Đã huỷ", customerLabel: "Đã đóng", badge: "badge-red", tone: "cancelled" },
};

export const statusMeta = (status: string | undefined) =>
  REPORT_STATUS_META[(status as ReportStatus) ?? "PENDING"] ?? REPORT_STATUS_META.PENDING;

/** Vấn đề hay gặp — bấm để điền sẵn tiêu đề. */
export const REPORT_ISSUE_PRESETS = [
  "Sản phẩm bị lỗi / hư hỏng",
  "Giao thiếu sản phẩm",
  "Giao sai sản phẩm / sai màu",
  "Giao hàng quá chậm",
  "Vấn đề khác về đơn hàng",
];

export const reportOrderId = (report: OrderReport) => toId(report.orderId);
export const reportCode = (report: OrderReport) => shortId(report._id);
export const reportOrderCode = (report: OrderReport) => shortId(report.orderId);
export const reportImages = (report: OrderReport) =>
  Array.isArray(report.images) ? report.images.map(toText).filter(Boolean) : [];

export function formatReportDate(value: string | undefined, pattern = "dd/MM/yyyy") {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? format(date, pattern) : "—";
}

/** Lỗi API → câu tiếng Việt dễ hiểu (BE trả message tiếng Anh của mongoose). */
export function reportErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "";
  if (/at least 5/i.test(message)) return `Tiêu đề cần ít nhất ${REPORT_TITLE_MIN} ký tự.`;
  if (/at least 10/i.test(message)) return `Mô tả cần ít nhất ${REPORT_DESC_MIN} ký tự.`;
  if (/own orders/i.test(message)) return "Bạn chỉ có thể báo cáo đơn hàng của chính mình.";
  if (/not PENDING/i.test(message)) return "Báo cáo đã được xử lý nên không thể thay đổi nữa.";
  if (/unexpected field|too many files/i.test(message)) return `Chỉ đính kèm tối đa ${REPORT_MAX_IMAGES} ảnh.`;
  return fallback;
}
