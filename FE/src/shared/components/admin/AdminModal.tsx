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
// ============================================================

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../ui/utils";

interface AdminModalProps {
  /** Tiêu đề hiển thị ở header (string để dùng luôn làm aria-label) */
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Class cho khung content — mặc định `max-w-2xl w-full` */
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
        className={cn("admin-dialog-content", className ?? "max-w-2xl w-full")}
        onClick={(event) => event.stopPropagation()}
        style={{ overscrollBehavior: "contain" }}
      >
        <div className="admin-dialog-header relative">
          <h3 className="text-base font-semibold">{title}</h3>
          {!hideCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="admin-action-btn absolute top-4 right-4"
              style={{ color: "var(--foreground-muted)" }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
