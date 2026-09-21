// ============================================================
// AdminPagination — Previous / Page x of y / Next bar
// ============================================================
// One implementation for every admin list page so pagers look and behave the
// same everywhere (the design follows /admin/permissions: two `btn-secondary`
// buttons with the page indicator between them).
// Renders nothing when there is a single page — a one-page list needs no pager.
// ============================================================

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export interface AdminPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Total record count — adds the "showing x–y of N" hint when provided. */
  totalItems?: number;
  /** Records per page, used together with `totalItems` for that hint. */
  pageSize?: number;
  /** Disables both buttons (e.g. while a page is being fetched). */
  disabled?: boolean;
  /** Extra wrapper classes (e.g. `mt-4 border-t pt-4`). */
  className?: string;
}

export function AdminPagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  disabled = false,
  className,
}: AdminPaginationProps) {
  const { t } = useLanguage();

  if (totalPages <= 1) return null;

  const from = pageSize ? (page - 1) * pageSize + 1 : null;
  const to = pageSize && totalItems ? Math.min(page * pageSize, totalItems) : null;
  const showRange = from !== null && to !== null && totalItems !== undefined;

  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-3 ${className ?? ""}`}
      aria-label={t("admin.pagination.label")}
    >
      <button
        type="button"
        className="btn-secondary"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        <ChevronLeft className="h-4 w-4" />
        {t("admin.pagination.previous")}
      </button>

      <span className="text-sm text-muted-foreground">
        {t("admin.pagination.pageInfo", { page, totalPages })}
        {showRange && (
          <span className="ml-2 opacity-80">
            {t("admin.pagination.showing", { from, to, total: totalItems })}
          </span>
        )}
      </span>

      <button
        type="button"
        className="btn-secondary"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
      >
        {t("admin.pagination.next")}
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
