// ============================================================
// AdminSearch — ô search + thanh toolbar search DÙNG CHUNG cho admin
// ============================================================
// Mọi trang admin dùng CHUNG 1 component: icon, spinner khi chờ
// debounce/fetch, nút xoá, focus glow, a11y (aria-label, enterKeyHint).
//
// LƯU Ý QUAN TRỌNG: globals.css là CSS *unlayered* nên padding của `.input`
// luôn thắng utility Tailwind (pl-12/py-3 sẽ bị bỏ qua — xem ghi chú trong
// globals.css). Vì vậy padding của field được set bằng inline style.
//
// Debounce không nằm trong component: nơi gọi dùng `useDebouncedSearch`
// (src/shared/hooks/useDebouncedSearch.ts) để mọi trang cùng delay 400ms, rồi
// truyền `isSearching` xuống đây để hiện spinner.
// ============================================================

import { Loader2, Search, ListFilter, RotateCcw, X } from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "../ui/utils";
import { useSearchHotkey } from "../../hooks/useSearchHotkey";

/* ----------------------------------------------------------------
   Hằng số debounce dùng chung cho toàn bộ admin
   ---------------------------------------------------------------- */

/** Milliseconds to wait after the user stops typing before firing search. */
export const ADMIN_SEARCH_DEBOUNCE_MS = 400;

/* ----------------------------------------------------------------
   Ô search
   ---------------------------------------------------------------- */

/** md = toolbar thường (h≈44px); sm = toolbar gọn. */
export type AdminSearchSize = "md" | "sm";

const FIELD_PADDING: Record<AdminSearchSize, { paddingTop: string; paddingBottom: string }> = {
  md: { paddingTop: "0.75rem", paddingBottom: "0.75rem" },
  sm: { paddingTop: "0.55rem", paddingBottom: "0.55rem" },
};

export interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Đang chờ debounce / đang gọi API → hiện spinner */
  isSearching?: boolean;
  size?: AdminSearchSize;
  /** Nhãn cho screen reader (mặc định dùng placeholder) */
  ariaLabel?: string;
  autoFocus?: boolean;
  /** Thuộc tính `name` của input (mặc định "q") */
  name?: string;
  /** Gợi ý phím tắt hiển thị trong kbd, vd "/" */
  hotkeyHint?: string;
  className?: string;
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  isSearching = false,
  size = "md",
  ariaLabel,
  autoFocus = false,
  name = "q",
  hotkeyHint = "/",
  className,
}: AdminSearchInputProps) {
  // "/" focus ô search (khi không đang gõ trong input khác) — giống GitHub/Gmail.
  // Các ô search phụ trong form (picker) truyền hotkeyHint="" để tắt, tránh
  // xung đột khi có nhiều ô trên cùng một màn hình.
  const inputId = useId();
  useSearchHotkey(hotkeyHint ? inputId : null);
  return (
    <div
      className={cn(
        "admin-search-field group relative w-full overflow-hidden rounded-2xl border transition-all duration-200",
        "focus-within:-translate-y-px focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_var(--primary-soft),var(--shadow-md)]",
        className,
      )}
      style={{
        background: "var(--input-bg)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
      onFocusCapture={(event) => {
        const field = event.currentTarget;
        field.style.borderColor = "var(--primary)";
        field.style.boxShadow = "0 0 0 3px var(--primary-soft), var(--shadow-sm)";
      }}
      onBlurCapture={(event) => {
        const field = event.currentTarget;
        field.style.borderColor = "var(--border)";
        field.style.boxShadow = "var(--shadow-sm)";
      }}
    >
      {/* vệt sáng trên cùng khi focus */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px opacity-0 transition-opacity duration-200 group-focus-within:opacity-100"
        style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }}
      />
      <Search
        aria-hidden="true"
        className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary"
      />

      <input
        id={inputId}
        name={name}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        autoFocus={autoFocus}
        // Ẩn nút xoá mặc định của trình duyệt — ta dùng nút X riêng bên dưới.
        className="w-full bg-transparent text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
        style={{
          paddingLeft: "3rem",
          paddingRight:
            value.length > 0 || isSearching ? "4.5rem" : hotkeyHint ? "3.5rem" : "1.25rem",
          ...FIELD_PADDING[size],
        }}
      />

      <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
        {isSearching && (
          <Loader2 aria-hidden="true" className="size-4 animate-spin text-primary" />
        )}
        {value.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            title="Xoá tìm kiếm (Esc)"
            className="flex size-6 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          !isSearching &&
          hotkeyHint && (
            <kbd
              aria-hidden="true"
              className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors group-focus-within:border-primary/40 group-focus-within:text-primary sm:block"
            >
              {hotkeyHint}
            </kbd>
          )
        )}
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------
   Dòng thông tin dưới thanh search (đang tìm / N kết quả …)
   ---------------------------------------------------------------- */

export function AdminSearchMeta({
  searching = false,
  className,
  children,
}: {
  searching?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      aria-live="polite"
      className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums",
        className,
      )}
    >
      {searching && <Loader2 aria-hidden="true" className="size-3.5 animate-spin text-primary/70" />}
      {children}
    </p>
  );
}

/* ----------------------------------------------------------------
   Thanh toolbar: search + filters + nút xoá lọc + dòng meta
   ---------------------------------------------------------------- */

export interface AdminSearchToolbarProps {
  /** Props cho ô search — bắt buộc để mọi toolbar có cùng một look */
  search: AdminSearchInputProps;
  /** Các control lọc đặt cạnh ô search (select, chips, …) */
  filters?: ReactNode;
  /** Nút "xoá bộ lọc" — chỉ hiện khi truyền vào (tức là đang có filter). */
  onReset?: () => void;
  resetLabel?: string;
  /** Dòng meta dưới toolbar (đang tìm / N kết quả …) */
  meta?: ReactNode;
  className?: string;
}

export function AdminSearchToolbar({
  search,
  filters,
  onReset,
  resetLabel,
  meta,
  className,
}: AdminSearchToolbarProps) {
  return (
    <div
      className={cn("admin-toolbar border-b border-border p-6", className)}
      style={{ background: "var(--surface)" }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <AdminSearchInput {...search} className={cn("sm:flex-1", search.className)} />

        {filters && <div className="flex flex-wrap items-center gap-3">{filters}</div>}

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            title={resetLabel ?? "Clear filters"}
            aria-label={resetLabel ?? "Clear filters"}
            className="admin-toolbar-reset group inline-flex shrink-0 items-center gap-2 self-start rounded-2xl border border-border bg-[var(--card)] px-3.5 py-2.5 text-sm font-medium text-muted-foreground shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-px hover:border-primary/40 hover:text-primary hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:translate-y-0 sm:self-center"
          >
            <span className="relative flex size-4 items-center justify-center" aria-hidden="true">
              <ListFilter className="size-4 transition-all duration-200 group-hover:rotate-12 group-hover:scale-110 group-hover:opacity-0" />
              <RotateCcw className="absolute size-4 scale-75 opacity-0 transition-all duration-200 group-hover:rotate-[-120deg] group-hover:scale-100 group-hover:opacity-100" />
            </span>
            <span className="whitespace-nowrap">{resetLabel ?? "Clear filters"}</span>
          </button>
        )}
      </div>

      {meta && <div className="mt-3">{meta}</div>}
    </div>
  );
}
