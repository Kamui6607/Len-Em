// ============================================================
// AdminModal — khung dialog DÙNG CHUNG cho admin (portal + CSS-only)
// ============================================================
// Vì sao cần component này (thay cho motion.div + AnimatePresence):
//
// 1. Modal phải nằm ngoài cây trang (portal → document.body).
//    Trước đây modal render ngay trong <div className="space-y-6"> của trang,
//    mà vùng nội dung admin nằm trong <main className="overflow-y-auto">.
//    Khi modal dùng autoFocus (ô search trong picker), trình duyệt cuộn MỌI
//    ancestor scrollable để lôi element vào viewport — kể cả <main> phía sau
//    tấm overlay. Kết quả: nền trang (đang bị blur) nhảy sang nội dung khác
//    → người dùng thấy "như có thêm 1 trang chèn vào rồi mất đi".
//    Portal cắt đứt quan hệ này: ancestor của modal chỉ còn <body>.
//
// 2. Chỉ có MỘT nguồn animation. CSS đã có sẵn `.admin-dialog-overlay`
//    (fade) + `.admin-dialog-content` (rise + scale). Trước đây framer-motion
//    animate thêm opacity/scale/y trên cùng 2 element → 2 animation chồng nhau
//    (lệch duration/easing), modal giật và khi đóng còn 1 bản "bóng ma" 0.2s.
//
// 3. Overlay được đẩy sang layer riêng + `overscroll-behavior: contain`:
//    backdrop-filter blur(8px) chỉ phải tính 1 lần (không repaint cả trang
//    mỗi frame) và cuộn trong modal không kéo theo trang phía sau.
//
// Giao diện "craft" (xem admin.css § 8): mỗi popup mang một `variant`
//   view   → xem chi tiết   (tông info)
//   edit   → chỉnh sửa      (tông warning)
//   create → tạo mới        (tông success)
//   danger → xác nhận xóa…  (tông destructive)
// variant quyết định màu ô icon, eyebrow viết tay và icon mặc định.
// ============================================================

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Eye, PencilLine, Plus, X } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { cn } from "../ui/utils";

export type AdminModalVariant = "view" | "edit" | "create" | "danger";
export type AdminModalSize = "sm" | "md" | "lg" | "xl";

const VARIANT_META: Record<AdminModalVariant, { eyebrow: string; icon: ElementType }> = {
  view: { eyebrow: "Chi tiết", icon: Eye },
  edit: { eyebrow: "Chỉnh sửa", icon: PencilLine },
  create: { eyebrow: "Tạo mới", icon: Plus },
  danger: { eyebrow: "Xác nhận", icon: AlertTriangle },
};

const SIZE_CLASS: Record<AdminModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
};

interface AdminModalProps {
  /** Tiêu đề hiển thị ở header (string để dùng luôn làm aria-label) */
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Loại popup — quyết định tông màu, eyebrow và icon mặc định */
  variant?: AdminModalVariant;
  /** Icon trong ô vuông ở header (mặc định theo variant) */
  icon?: ElementType;
  /** Thay ô icon bằng avatar / ảnh thu nhỏ */
  media?: ReactNode;
  /** Dòng chữ viết tay phía trên tiêu đề (mặc định theo variant; `null` để ẩn) */
  eyebrow?: ReactNode | null;
  /** Dòng phụ dưới tiêu đề (id, username, …) */
  subtitle?: ReactNode;
  /** Badge trạng thái dưới tiêu đề */
  badges?: ReactNode;
  /** Nút phụ cạnh nút đóng (report, …) */
  headerActions?: ReactNode;
  /** Thanh nút cố định ở đáy — render trong `.admin-dialog-footer` */
  footer?: ReactNode;
  /** Bề rộng: sm 28rem · md 32rem · lg 42rem (mặc định) · xl 48rem */
  size?: AdminModalSize;
  /** Class thêm cho khung content */
  className?: string;
  /** Bấm ra ngoài để đóng (mặc định true) */
  closeOnBackdrop?: boolean;
  /** Ẩn nút X (mặc định false) */
  hideCloseButton?: boolean;
}

export function AdminModal({
  title,
  onClose,
  children,
  variant = "view",
  icon,
  media,
  eyebrow,
  subtitle,
  badges,
  headerActions,
  footer,
  size = "lg",
  className,
  closeOnBackdrop = true,
  hideCloseButton = false,
}: AdminModalProps) {
  // Esc để đóng — hành vi chuẩn của dialog.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Khóa cuộn trang phía sau khi modal mở.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const meta = VARIANT_META[variant];
  const Icon = icon ?? meta.icon;
  const eyebrowText = eyebrow === undefined ? meta.eyebrow : eyebrow;

  return createPortal(
    <div
      className="admin-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}
      onClick={closeOnBackdrop ? onClose : undefined}
      style={{
        // Layer riêng cho overlay: blur nền chỉ tính 1 lần → mở/đóng mượt.
        transform: "translateZ(0)",
        willChange: "opacity",
        overscrollBehavior: "contain",
      }}
    >
      <div
        className={cn("admin-dialog-content adm-dlg w-full", SIZE_CLASS[size], className)}
        data-variant={variant}
        onClick={(event) => event.stopPropagation()}
        style={{ overscrollBehavior: "contain" }}
      >
        <header className="admin-dialog-header adm-dlg-head">
          {media ?? (
            <span className="adm-dlg-icon" aria-hidden="true">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div className="adm-dlg-titles">
            {eyebrowText && <span className="adm-dlg-eyebrow">{eyebrowText}</span>}
            <h2 className="adm-dlg-title">{title}</h2>
            {subtitle && <p className="adm-dlg-sub">{subtitle}</p>}
            {badges && <div className="adm-dlg-badges">{badges}</div>}
          </div>
          {(headerActions || !hideCloseButton) && (
            <div className="adm-dlg-head-actions">
              {headerActions}
              {!hideCloseButton && (
                <button type="button" onClick={onClose} aria-label="Đóng" className="adm-dlg-close">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </header>
        {children}
        {footer && <div className="admin-dialog-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// ── Mảnh ghép dùng trong body ────────────────────────────────

/** Tiêu đề nhóm trong body: icon + nhãn + đường chỉ kéo dài. */
export function AdminDialogSection({
  icon: Icon,
  children,
  className,
}: {
  icon?: ElementType;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("adm-dlg-section", className)}>
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{children}</span>
    </p>
  );
}

/** Lưới ô chi tiết (popup xem): 1 cột trên mobile, 2 cột từ sm. */
export function AdminDetailGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("adm-detail-grid", className)}>{children}</div>;
}

/** Ô nhãn + giá trị chỉ đọc. */
export function AdminDetailItem({
  icon: Icon,
  label,
  children,
  span,
  mono,
  className,
}: {
  icon?: ElementType;
  label: ReactNode;
  children: ReactNode;
  /** Chiếm hết bề ngang lưới */
  span?: boolean;
  /** Giá trị dạng mã (id) */
  mono?: boolean;
  className?: string;
}) {
  const empty = children === null || children === undefined || children === "";
  return (
    <div className={cn("adm-detail", span && "is-span", className)}>
      <p className="adm-detail-label">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        {label}
      </p>
      <div className={cn("adm-detail-value", mono && "is-mono")}>{empty ? "—" : children}</div>
    </div>
  );
}

/** Khung trường nhập: nhãn (icon + *) + control + lỗi / gợi ý. */
export function AdminField({
  icon: Icon,
  label,
  required,
  error,
  hint,
  span,
  htmlFor,
  children,
  className,
}: {
  icon?: ElementType;
  label: ReactNode;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  span?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("adm-field", span && "is-span", error && "has-error", className)}>
      <label htmlFor={htmlFor} className="adm-field-label">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        {label}
        {required && <span className="adm-field-req">*</span>}
      </label>
      {children}
      {error ? <p className="adm-field-error">{error}</p> : hint ? <p className="adm-field-hint">{hint}</p> : null}
    </div>
  );
}
