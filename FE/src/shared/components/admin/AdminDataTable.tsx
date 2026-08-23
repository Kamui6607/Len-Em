import { Search, ChevronUp, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/** Filter/search bar that sits above an admin table, inside its own bordered strip. */
export function AdminTableToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="p-6 border-b border-border" style={{ background: "var(--surface)" }}>
      {children}
    </div>
  );
}

interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

/**
 * Standard search field with a leading icon. Replaces the previous
 * per-page version that set padding via a `style` prop
 * (`style={{ paddingLeft: "3rem", ... }}`) duplicated verbatim in
 * AdminCourses and AdminLessons — now a single Tailwind class.
 */
export function AdminSearchInput({ value, onChange, placeholder }: AdminSearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input w-full pl-12 pr-4 py-3"
      />
    </div>
  );
}

/** Wraps the <table> in the horizontal-scroll container used by every list page. */
export function AdminTableScroll({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto" style={{ background: "var(--card)" }}>
      <table className="admin-table w-full">{children}</table>
    </div>
  );
}

interface AdminSortableHeaderProps<T extends string> {
  label: string;
  field: T;
  activeField: T | null;
  direction: "asc" | "desc";
  onSort: (field: T) => void;
  align?: "left" | "right";
  className?: string;
}

/**
 * Generic sortable <th>. Previously AdminCourses and AdminLessons each
 * defined an identical local `SortableHeader` function (~25 lines,
 * copy-pasted). Now shared — pass your page's own SortField union as T.
 */
export function AdminSortableHeader<T extends string>({
  label,
  field,
  activeField,
  direction,
  onSort,
  align = "left",
  className = "",
}: AdminSortableHeaderProps<T>) {
  const active = activeField === field;
  return (
    <th
      className={`px-6 py-4 text-sm font-medium text-muted-foreground ${align === "right" ? "text-right" : "text-left"} ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`group inline-flex items-center gap-1 transition-colors hover:text-foreground focus:outline-none ${active ? "text-foreground" : ""} ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {label}
        <span className="flex flex-col items-center justify-center -space-y-[3px]">
          <ChevronUp
            className={`w-2.5 h-2.5 ${active && direction === "asc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}
          />
          <ChevronDown
            className={`w-2.5 h-2.5 ${active && direction === "desc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}
          />
        </span>
      </button>
    </th>
  );
}

/** Plain (non-sortable) header cell, kept visually identical to AdminSortableHeader. */
export function AdminTableHeaderCell({ label, align = "left" }: { label: string; align?: "left" | "right" }) {
  return (
    <th className={`px-6 py-4 text-sm font-medium text-muted-foreground ${align === "right" ? "text-right" : "text-left"}`}>
      {label}
    </th>
  );
}

/** Full-width empty-state row, e.g. "No courses yet". */
export function AdminTableEmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}

/** Full-page loading state: title + centered spinner/message, used before the table has data. */
export function AdminPageLoading({ title, message }: { title: string; message: string }) {
  return (
    <div className="space-y-6">
      <h1 className="admin-page-title text-2xl font-semibold mb-1">{title}</h1>
      <div className="flex items-center justify-center py-20 text-muted-foreground">{message}</div>
    </div>
  );
}
