// ============================================================
// AdminDataGrid — bảng danh sách dùng chung cho mọi trang admin
// (thiết kế lấy từ /admin/orders).
//
// - CSS grid (role=table): header và mọi dòng dùng CHUNG grid-template-columns
//   → mép trái/giữa/phải của tiêu đề luôn khớp nội dung cột.
// - Header dính dưới topbar khi cuộn; sort chỉ hiện ở cột sortable.
// - Chọn nhiều dòng (tuỳ chọn) + thanh thao tác hàng loạt (AdminGridToolbar).
// - Panel hẹp hơn tổng min-width các cột → tự gập mỗi dòng thành thẻ
//   (đo bằng ResizeObserver, không bao giờ cuộn ngang).
//
// Đi kèm: AdminGridToolbar, AdminGridFooter, AdminStatusTabs, AdminPill,
// AdminActionButton, AdminRowMenu, AdminMoney, useAdminConfirm.
// Style: admin.css § "Admin data grid" (.adm-g*).
// ============================================================

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ElementType, KeyboardEvent, ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Inbox,
  MoreHorizontal,
  RefreshCw,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { AdminSearchInput } from "./AdminSearch";
import type { AdminSearchInputProps } from "./AdminSearch";
import { AdminModal } from "./AdminModal";

/* ----------------------------------------------------------------
   Kiểu dữ liệu
   ---------------------------------------------------------------- */

export type AdminGridAlign = "left" | "center" | "right";

/** Màu dùng chung cho pill trạng thái, nút hành động và thẻ lọc. */
export type AdminTone = "amber" | "blue" | "violet" | "cyan" | "green" | "rose" | "neutral";

export interface AdminGridColumn<T> {
  key: string;
  header: ReactNode;
  /** Track của grid, vd "96px" hoặc "minmax(180px, 1.4fr)". */
  width: string;
  /** Bề rộng tối thiểu (px) — cộng lại để quyết định khi nào gập thành thẻ. */
  minWidth: number;
  align?: AdminGridAlign;
  /** Cột có sort — trường sort chính là `key`. */
  sortable?: boolean;
  render: (row: T) => ReactNode;
  /**
   * Vị trí trong dạng thẻ (panel hẹp):
   * title = dòng đầu bên trái · aside = dòng đầu bên phải (trạng thái) ·
   * field = cặp nhãn/giá trị · actions = cuối thẻ · hidden = ẩn.
   */
  card?: "title" | "aside" | "field" | "actions" | "hidden";
}

export interface AdminGridSort {
  field: string | null;
  direction: "asc" | "desc";
  onSort: (field: string) => void;
}

export interface AdminGridSelection {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

export interface AdminDataGridProps<T> {
  rows: T[];
  rowKey: (row: T) => string;
  columns: AdminGridColumn<T>[];
  loading?: boolean;
  /** Đang tải lại ngầm — làm mờ bảng, giữ dữ liệu cũ. */
  refreshing?: boolean;
  sort?: AdminGridSort;
  selection?: AdminGridSelection;
  /** Bấm cả dòng (vd mở chi tiết). Nút/menu trong dòng tự chặn lan sự kiện. */
  onRowClick?: (row: T) => void;
  /** Dòng cần chú ý → viền trái 3px theo tone (chỉ "amber"/"rose"). */
  rowAccent?: (row: T) => "amber" | "rose" | null | undefined;
  /** Dòng bị làm mờ (vd đã ẩn / đã xoá mềm). */
  rowMuted?: (row: T) => boolean;
  empty?: { icon?: ElementType; title: ReactNode; description?: ReactNode; action?: ReactNode };
  skeletonRows?: number;
  ariaLabel: string;
  /** Chiều cao tối thiểu một dòng (mặc định 60px). */
  rowHeight?: number;
}

/* ----------------------------------------------------------------
   Lưới chính
   ---------------------------------------------------------------- */

const SELECT_COL = 40;

export function AdminDataGrid<T>({
  rows,
  rowKey,
  columns,
  loading = false,
  refreshing = false,
  sort,
  selection,
  onRowClick,
  rowAccent,
  rowMuted,
  empty,
  skeletonRows = 8,
  ariaLabel,
  rowHeight = 60,
}: AdminDataGridProps<T>) {
  const { t } = useLanguage();
  const rootRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState(false);
  const minTotal = columns.reduce((sum, c) => sum + c.minWidth, 0) + (selection ? SELECT_COL : 0);

  // Gập thành thẻ khi panel hẹp hơn tổng min-width các cột.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setCards(el.clientWidth < minTotal);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minTotal]);

  const template = [selection ? `${SELECT_COL}px` : null, ...columns.map((c) => c.width)]
    .filter(Boolean)
    .join(" ");

  const keys = rows.map(rowKey);
  const selectedOnPage = selection ? keys.filter((k) => selection.selected.has(k)) : [];
  const allSelected = keys.length > 0 && selectedOnPage.length === keys.length;
  const headerCheckRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate = selectedOnPage.length > 0 && !allSelected;
    }
  }, [selectedOnPage.length, allSelected]);

  const toggleOne = (key: string) => {
    if (!selection) return;
    const next = new Set(selection.selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    selection.onChange(next);
  };
  const toggleAll = () => {
    if (!selection) return;
    selection.onChange(allSelected ? new Set() : new Set(keys));
  };

  const rowProps = (row: T, key: string) => {
    const accent = rowAccent?.(row);
    const isSelected = selection?.selected.has(key);
    return {
      role: "row" as const,
      tabIndex: onRowClick ? 0 : undefined,
      className: [
        cards ? "adm-gcard" : "adm-grow",
        onRowClick ? "is-clickable" : "",
        accent ? `is-accent-${accent}` : "",
        isSelected ? "is-selected" : "",
        rowMuted?.(row) ? "is-muted" : "",
      ]
        .filter(Boolean)
        .join(" "),
      onClick: onRowClick ? () => onRowClick(row) : undefined,
      onKeyDown: onRowClick
        ? (e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter" && e.target === e.currentTarget) onRowClick(row);
          }
        : undefined,
    };
  };

  const checkCell = (key: string) =>
    selection ? (
      <div role="cell" className="adm-gtd is-sel" onClick={(e) => e.stopPropagation()}>
        <label className="adm-gcheck">
          <input
            type="checkbox"
            checked={selection.selected.has(key)}
            onChange={() => toggleOne(key)}
            aria-label={t("admin.grid.selectRow")}
          />
        </label>
      </div>
    ) : null;

  let body: ReactNode;
  if (loading) {
    body = Array.from({ length: skeletonRows }, (_, i) => (
      <div key={i} role="row" className={cards ? "adm-gcard is-skeleton" : "adm-grow is-skeleton"} aria-hidden="true">
        {cards ? (
          <>
            <span className="admin-skeleton adm-gsk" style={{ width: "55%" }} />
            <span className="admin-skeleton adm-gsk is-sm" style={{ width: "35%" }} />
            <span className="admin-skeleton adm-gsk is-sm" style={{ width: "70%" }} />
          </>
        ) : (
          <>
            {selection && <div className="adm-gtd is-sel"><span className="admin-skeleton adm-gsk" style={{ width: 16, height: 16 }} /></div>}
            {columns.map((c) => (
              <div key={c.key} className={`adm-gtd is-${c.align ?? "left"}`}>
                <span className="admin-skeleton adm-gsk" style={{ width: c.minWidth > 150 ? "70%" : "60%" }} />
                {c.card !== "actions" && c.card !== "aside" && (
                  <span className="admin-skeleton adm-gsk is-sm" style={{ width: "40%" }} />
                )}
              </div>
            ))}
          </>
        )}
      </div>
    ));
  } else if (rows.length === 0) {
    const EmptyIcon = empty?.icon ?? Inbox;
    body = (
      <div className="admin-empty-state adm-gempty">
        <EmptyIcon size={40} />
        <p>{empty?.title ?? t("admin.grid.empty")}</p>
        {empty?.description && <p className="text-sm">{empty.description}</p>}
        {empty?.action && <div className="mt-4">{empty.action}</div>}
      </div>
    );
  } else if (cards) {
    body = rows.map((row) => {
      const key = rowKey(row);
      const by = (slot: AdminGridColumn<T>["card"]) => columns.filter((c) => (c.card ?? "field") === slot);
      const fields = by("field");
      return (
        <div key={key} {...rowProps(row, key)}>
          {checkCell(key)}
          <div className="adm-gcard-main">
            <div className="adm-gcard-head">
              <div className="adm-gcard-title">{by("title").map((c) => <div key={c.key} role="cell">{c.render(row)}</div>)}</div>
              <div className="adm-gcard-aside">{by("aside").map((c) => <div key={c.key} role="cell">{c.render(row)}</div>)}</div>
            </div>
            {fields.length > 0 && (
              <dl className="adm-gcard-fields">
                {fields.map((c) => (
                  <div key={c.key} role="cell">
                    <dt>{c.header}</dt>
                    <dd>{c.render(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {by("actions").map((c) => (
              <div key={c.key} role="cell" className="adm-gcard-actions">
                {c.render(row)}
              </div>
            ))}
          </div>
        </div>
      );
    });
  } else {
    body = rows.map((row) => {
      const key = rowKey(row);
      return (
        <div key={key} {...rowProps(row, key)}>
          {checkCell(key)}
          {columns.map((c) => (
            <div key={c.key} role="cell" className={`adm-gtd is-${c.align ?? "left"}`}>
              {c.render(row)}
            </div>
          ))}
        </div>
      );
    });
  }

  return (
    <div
      ref={rootRef}
      role="table"
      aria-label={ariaLabel}
      aria-busy={loading}
      className={`adm-grid ${cards ? "is-cards" : ""} ${refreshing ? "is-refreshing" : ""}`}
      style={{ ["--gcols" as string]: template, ["--grow-h" as string]: `${rowHeight}px` }}
    >
      {!cards && (
        <div role="rowgroup" className="adm-ghead">
          <div role="row" className="adm-grow is-head">
            {selection && (
              <div role="columnheader" className="adm-gth is-sel">
                <label className="adm-gcheck">
                  <input
                    ref={headerCheckRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={loading || rows.length === 0}
                    aria-label={t("admin.grid.selectAll")}
                  />
                </label>
              </div>
            )}
            {columns.map((c) => (
              <AdminGridHeaderCell key={c.key} column={c} sort={sort} />
            ))}
          </div>
        </div>
      )}
      <div role="rowgroup" className="adm-gbody">
        {body}
      </div>
    </div>
  );
}

function AdminGridHeaderCell<T>({ column, sort }: { column: AdminGridColumn<T>; sort?: AdminGridSort }) {
  const active = sort?.field === column.key;
  const align = column.align ?? "left";
  return (
    <div
      role="columnheader"
      className={`adm-gth is-${align}`}
      aria-sort={active ? (sort!.direction === "asc" ? "ascending" : "descending") : undefined}
    >
      {column.sortable && sort ? (
        <button
          type="button"
          className={`adm-gth-inner is-sortable ${active ? "is-active" : ""}`}
          onClick={() => sort.onSort(column.key)}
        >
          {column.header}
          <span className="adm-gth-sort" aria-hidden="true">
            <ChevronUp className={active && sort.direction === "asc" ? "is-on" : ""} />
            <ChevronDown className={active && sort.direction === "desc" ? "is-on" : ""} />
          </span>
        </button>
      ) : (
        <span className="adm-gth-inner">{column.header}</span>
      )}
    </div>
  );
}

/** Hook sort phía client cho trang hiện tại: trả về state + hàm sắp xếp. */
export function useAdminGridSort<T>(getValue: (row: T, field: string) => string | number | null | undefined) {
  const [field, setField] = useState<string | null>(null);
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const onSort = useCallback(
    (next: string) => {
      if (next === field) setDirection((d) => (d === "asc" ? "desc" : "asc"));
      else {
        setField(next);
        setDirection("asc");
      }
    },
    [field],
  );
  const apply = (rows: T[]) => {
    if (!field) return rows;
    return [...rows].sort((a, b) => {
      const va = getValue(a, field);
      const vb = getValue(b, field);
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va ?? "").localeCompare(String(vb ?? ""), "vi");
      return direction === "asc" ? cmp : -cmp;
    });
  };
  return { sort: { field, direction, onSort } as AdminGridSort, apply };
}

/* ----------------------------------------------------------------
   Toolbar: tìm kiếm trái · bộ lọc phải; thay bằng thanh hàng loạt khi có dòng được chọn
   ---------------------------------------------------------------- */

export interface AdminGridToolbarProps {
  search?: Pick<AdminSearchInputProps, "value" | "onChange" | "placeholder" | "isSearching">;
  filters?: ReactNode;
  /** Hiện nút "Xoá lọc" khi có bộ lọc đang bật. */
  onReset?: () => void;
  /** Số dòng đang chọn — > 0 thì hiện thanh hàng loạt. */
  selectedCount?: number;
  bulkActions?: ReactNode;
  /** Ghi chú nhỏ trong thanh hàng loạt (vd "2 chờ thanh toán"). */
  bulkNote?: ReactNode;
  onClearSelection?: () => void;
  /** Dòng phụ bên dưới (vd "12 kết quả"). */
  meta?: ReactNode;
}

export function AdminGridToolbar({
  search,
  filters,
  onReset,
  selectedCount = 0,
  bulkActions,
  bulkNote,
  onClearSelection,
  meta,
}: AdminGridToolbarProps) {
  const { t } = useLanguage();
  return (
    <>
      {selectedCount > 0 ? (
        <div className="admin-toolbar adm-gtoolbar is-bulk" role="toolbar" aria-label={t("admin.grid.bulkActions")}>
          <span className="adm-gbulk-count">{t("admin.grid.selected", { count: selectedCount })}</span>
          <span className="adm-gbulk-sep" aria-hidden="true" />
          {bulkActions}
          {bulkNote && <span className="adm-gbulk-note">{bulkNote}</span>}
          <button type="button" className="adm-gclear" onClick={onClearSelection}>
            <X /> {t("admin.grid.clearSelection")}
          </button>
        </div>
      ) : (
        <div className="admin-toolbar adm-gtoolbar">
          {search && (
            <AdminSearchInput
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
              isSearching={search.isSearching}
              size="sm"
              className="adm-gsearch"
            />
          )}
          {(filters || onReset) && (
            <div className="adm-gfilters">
              {filters}
              {onReset && (
                <button type="button" className="adm-gclear is-inline" onClick={onReset}>
                  <X /> {t("admin.clearFilters")}
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {meta && <div className="adm-gmeta">{meta}</div>}
    </>
  );
}

/* ----------------------------------------------------------------
   Chân bảng: "1–20 / 113" · ‹ Trang 1 / 6 ›
   ---------------------------------------------------------------- */

export function AdminGridFooter({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  if (total <= 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <nav className="adm-gfoot" aria-label={t("admin.pagination.label")}>
      <span>{t("admin.grid.range", { from, to, total })}</span>
      {totalPages > 1 && (
        <div className="adm-gfoot-pager">
          <button
            type="button"
            className="adm-gicon"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            aria-label={t("admin.pagination.previous")}
          >
            <ChevronLeft />
          </button>
          <span className="adm-gfoot-page">{t("admin.pagination.pageInfo", { page, totalPages })}</span>
          <button
            type="button"
            className="adm-gicon"
            disabled={disabled || page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            aria-label={t("admin.pagination.next")}
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </nav>
  );
}

/* ----------------------------------------------------------------
   Thẻ lọc trạng thái (kiêm số liệu)
   ---------------------------------------------------------------- */

export interface AdminStatusTab<V extends string> {
  value: V;
  label: string;
  icon: LucideIcon;
  tone?: AdminTone;
  /** undefined = đang tải (hiện skeleton); null = không hiện số. */
  count?: number | null;
}

export function AdminStatusTabs<V extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
}: {
  tabs: AdminStatusTab<V>[];
  value: V;
  onChange: (value: V) => void;
  ariaLabel: string;
}) {
  return (
    <div className="adm-gtabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-tone={tab.tone ?? "primary"}
            className={`adm-gtab ${active ? "is-active" : ""} ${tab.count === null ? "no-count" : ""}`}
            onClick={() => onChange(tab.value)}
          >
            <span className="adm-gtab-icon">
              <Icon className="w-4 h-4" />
            </span>
            <span className="adm-gtab-label">{tab.label}</span>
            {tab.count !== null && (
              <span className="adm-gtab-count">
                {tab.count ?? <span className="admin-skeleton inline-block h-5 w-6 rounded-md" />}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------
   Pill trạng thái · nút hành động · menu ⋯ · tiền
   ---------------------------------------------------------------- */

/** Pill trạng thái: nền nhạt + chữ cùng tông + chấm. Không viền, không glow. */
export function AdminPill({ tone, children, fixed = true }: { tone: AdminTone; children: ReactNode; fixed?: boolean }) {
  return (
    <span className={`adm-gpill ${fixed ? "is-fixed" : ""}`} data-tone={tone}>
      {children}
    </span>
  );
}

/**
 * Nút hành động chính của dòng: nền tint 15%, viền 40%, bo lg — luôn khác pill.
 * tone = màu của trạng thái ĐÍCH (vd Duyệt → green). Không tone = nút trung tính.
 */
export function AdminActionButton({
  icon: Icon,
  label,
  tone,
  onClick,
  busy = false,
  disabled = false,
  title,
  fixedWidth = true,
}: {
  icon: LucideIcon;
  label: ReactNode;
  tone?: AdminTone;
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
  title?: string;
  fixedWidth?: boolean;
}) {
  return (
    <button
      type="button"
      className={`adm-gact ${tone ? "is-tone" : ""} ${fixedWidth ? "is-fixed" : ""}`}
      data-tone={tone}
      disabled={disabled || busy}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {busy ? <RefreshCw className="animate-spin" /> : <Icon />}
      {label}
    </button>
  );
}

/** Ô giữ chỗ khi dòng không có hành động chính — giữ các nút ⋯ thẳng hàng. */
export function AdminActionPlaceholder({ icon: Icon, label }: { icon?: LucideIcon; label?: ReactNode }) {
  return label ? (
    <span className="adm-gact-wait">
      {Icon && <Icon />} {label}
    </span>
  ) : (
    <span className="adm-gact-slot" aria-hidden="true" />
  );
}

export interface AdminRowMenuItem {
  label: ReactNode;
  icon: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Đặt vạch ngăn phía trên mục này. */
  separated?: boolean;
}

export function AdminRowMenu({ items, ariaLabel }: { items: (AdminRowMenuItem | false | null | undefined)[]; ariaLabel: string }) {
  const visible = items.filter(Boolean) as AdminRowMenuItem[];
  if (visible.length === 0) return <span className="adm-gicon is-ghost" aria-hidden="true" />;
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="adm-gicon" aria-label={ariaLabel} onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        {/* Sự kiện React đi xuyên portal — chặn để bấm menu không mở dòng. */}
        <DropdownMenu.Content align="end" sideOffset={6} className="adm-gmenu" onClick={(e) => e.stopPropagation()}>
          {visible.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i}>
                {item.separated && i > 0 && <DropdownMenu.Separator className="adm-gmenu-sep" />}
                <DropdownMenu.Item
                  className={`adm-gmenu-item ${item.danger ? "is-danger" : ""}`}
                  disabled={item.disabled}
                  onSelect={item.onSelect}
                >
                  <Icon /> {item.label}
                </DropdownMenu.Item>
              </div>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/** Cụm hành động của dòng: [nút chính] [⋯], căn theo cột. */
export function AdminRowActions({ children }: { children: ReactNode }) {
  return <span className="adm-gactions">{children}</span>;
}

const vnd = new Intl.NumberFormat("vi-VN");

/** "396.001 ₫" — số tabular, ₫ tách riêng nhạt hơn. */
export function AdminMoney({ value }: { value: number }) {
  return (
    <span className="adm-gmoney">
      {vnd.format(Number(value) || 0)}
      <span className="adm-gmoney-cur">&nbsp;₫</span>
    </span>
  );
}

/** Ô ngày: "3 giờ trước" + ngày (dd/mm/yy) bên dưới, tooltip ngày giờ đầy đủ. */
export function AdminDateCell({ value, compact = false }: { value?: string | Date | null; compact?: boolean }) {
  const { t } = useLanguage();
  if (!value) return <span className="adm-gsecondary">—</span>;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <span className="adm-gsecondary">—</span>;
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  const relative =
    minutes < 1
      ? t("admin.grid.justNow")
      : minutes < 60
        ? t("admin.grid.minutesAgo", { count: minutes })
        : minutes < 60 * 24
          ? t("admin.grid.hoursAgo", { count: Math.round(minutes / 60) })
          : minutes < 60 * 24 * 30
            ? t("admin.grid.daysAgo", { count: Math.round(minutes / 1440) })
            : null;
  const short = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit" });
  if (compact) {
    return (
      <span className="adm-gsecondary" title={date.toLocaleString("vi-VN")}>
        {relative ?? short}
      </span>
    );
  }
  return (
    <span className="adm-gstack-text" title={date.toLocaleString("vi-VN")}>
      <span className="adm-gprimary">{relative ?? short}</span>
      {relative && <span className="adm-gsecondary adm-gnum-plain">{short}</span>}
    </span>
  );
}

/** Ô 2 dòng chuẩn: chữ chính + chữ phụ (truncate). */
export function AdminCellStack({
  primary,
  secondary,
  media,
  mono = false,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  media?: ReactNode;
  mono?: boolean;
}) {
  return (
    <span className="adm-gstack">
      {media && <span className="adm-gmedia">{media}</span>}
      <span className="adm-gstack-text">
        <span className="adm-gprimary">{primary}</span>
        {secondary != null && secondary !== "" && (
          <span className={`adm-gsecondary ${mono ? "is-mono" : ""}`}>{secondary}</span>
        )}
      </span>
    </span>
  );
}

/* ----------------------------------------------------------------
   Hộp xác nhận dùng chung (thay window.confirm)
   ---------------------------------------------------------------- */

interface ConfirmOptions {
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: ReactNode;
  danger?: boolean;
  icon?: ElementType;
}

/**
 * const { confirm, dialog } = useAdminConfirm();
 * if (await confirm({ title: "Xoá 3 sản phẩm?", danger: true })) …
 * Nhớ render {dialog} trong JSX của trang.
 */
export function useAdminConfirm() {
  const { t } = useLanguage();
  const [state, setState] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...options, resolve })),
    [],
  );
  const close = (ok: boolean) => {
    state?.resolve(ok);
    setState(null);
  };
  const dialog = state ? (
    <AdminModal
      variant={state.danger ? "danger" : "edit"}
      size="sm"
      icon={state.icon}
      title={state.title}
      onClose={() => close(false)}
      footer={
        <>
          <button type="button" className="btn-modal-cancel" onClick={() => close(false)}>
            {t("admin.grid.cancel")}
          </button>
          <button
            type="button"
            className={state.danger ? "btn-modal-destructive" : "btn-modal-primary"}
            onClick={() => close(true)}
          >
            {state.confirmLabel ?? t("admin.grid.confirm")}
          </button>
        </>
      }
    >
      {state.description && (
        <div className="admin-dialog-body">
          <p className="text-sm text-muted-foreground">{state.description}</p>
        </div>
      )}
    </AdminModal>
  ) : null;
  return { confirm, dialog };
}
