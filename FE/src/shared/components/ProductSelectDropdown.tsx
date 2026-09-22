// ============================================================
// ProductSelectDropdown — chọn sản phẩm bằng DANH SÁCH có sẵn
// (thay cho kiểu "gõ search rồi mới thấy kết quả").
// Bấm vào field -> xổ danh sách -> bấm từng sản phẩm để thêm.
// Dùng ở:
//   - admin/DIYFormPage               (Materials)
//   - supportDIY/SupportDIYCreatePage (Sản phẩm liên quan)
// ============================================================

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Package, Plus } from "lucide-react";
import { formatPrice } from "../../lib/formatPrice";
import { AdminPickerSkeleton } from "./skeletons/AdminSkeleton";

export interface ProductSelectOption {
  productId: string;
  /** Variant mặc định (variant đầu tiên) — DIY post cần variantId khi submit */
  variantId?: string;
  name: string;
  thumbnail: string;
  price: number;
}

interface ProductSelectDropdownProps {
  options: ProductSelectOption[];
  /** productId của các sản phẩm đã chọn -> hiện dấu tick + không cho thêm lại */
  selectedIds: string[];
  onSelect: (option: ProductSelectOption) => void;
  isLoading?: boolean;
  placeholder?: string;
  /**
   * Class cho "khung" giống các field khác trong cùng form:
   * - admin: `input w-full`
   * - supportDIY: `diy-input w-full`
   */
  triggerClassName?: string;
  className?: string;
  disabled?: boolean;
}

export function ProductSelectDropdown({
  options,
  selectedIds,
  onSelect,
  isLoading = false,
  placeholder = "Chọn sản phẩm...",
  triggerClassName = "input w-full",
  className = "",
  disabled = false,
}: ProductSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        // Layout đặt bằng inline style vì `.diy-input` (CSS unlayered) set
        // display:block nên utility `flex` của Tailwind sẽ bị đè.
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
        className={triggerClassName}
      >
        <span className="truncate" style={{ color: "var(--foreground-muted)" }}>
          {placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--foreground-muted)" }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "100%",
            zIndex: 999,
            maxHeight: "300px",
            overflowY: "auto",
            overflowX: "hidden",
            background: "var(--dropdown-bg, var(--card))",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            boxShadow: "var(--shadow-float, 0 12px 32px rgba(0, 0, 0, 0.18))",
          }}
        >
          {isLoading ? (
            // Skeleton list thay cho dòng chữ "Đang tải sản phẩm…" để đồng bộ
            // với các picker khác (admin DIY form, support DIY form).
            <AdminPickerSkeleton className="py-2" rows={3} withThumb />
          ) : options.length === 0 ? (
            <p className="px-4 py-3 text-sm text-center" style={{ color: "var(--foreground-muted)" }}>
              Không có sản phẩm nào
            </p>
          ) : (
            options.map((option) => {
              const selected = selectedIds.includes(option.productId);
              return (
                <button
                  key={option.productId}
                  type="button"
                  disabled={selected}
                  onClick={() => {
                    if (selected) return;
                    onSelect(option);
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.background =
                        "var(--dropdown-hover-bg, var(--surface-secondary))";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.6rem 0.9rem",
                    borderBottom: "1px solid var(--border)",
                    background: "transparent",
                    cursor: selected ? "default" : "pointer",
                    opacity: selected ? 0.55 : 1,
                  }}
                >
                  {option.thumbnail ? (
                    <img
                      src={option.thumbnail}
                      alt={option.name}
                      className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--surface-secondary)" }}
                    >
                      <Package size={16} style={{ color: "var(--foreground-muted)" }} />
                    </span>
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm truncate" style={{ color: "var(--foreground)" }}>
                      {option.name}
                    </span>
                    <span className="block text-xs" style={{ color: "var(--foreground-muted)" }}>
                      {formatPrice(option.price)}
                    </span>
                  </span>
                  {selected ? (
                    <Check size={16} className="flex-shrink-0" style={{ color: "var(--primary)" }} />
                  ) : (
                    <Plus size={16} className="flex-shrink-0" style={{ color: "var(--foreground-muted)" }} />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
