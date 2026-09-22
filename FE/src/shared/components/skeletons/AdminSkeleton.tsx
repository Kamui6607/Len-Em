// ============================================================
// AdminSkeleton — bộ skeleton DÙNG CHUNG cho mọi trang admin
// ============================================================
// Mục tiêu: thay hết các kiểu loading chắp vá (chữ "Loading...",
// spinner quay, vài khối animate-pulse) bằng MỘT hệ skeleton thống
// nhất, đúng hình dạng nội dung thật (bảng / card / form / dialog).
//
// Nguyên tắc:
//  - Nền shimmer dùng class `.admin-skeleton` có sẵn trong globals.css
//    → tự đổi màu + độ sáng theo light/dark, không cần CSS mới.
//  - Kích thước khối bám theo layout thật của từng trang: cột ảnh +
//    tiêu đề, cột badge, cột giá, cột actions (view/edit/delete...) nên
//    khi data về bố cục không bị "nhảy".
//  - Mọi component đều `aria-busy`/`aria-hidden` để screen reader
//    không đọc các khối giả này.
//
// Cách dùng nhanh:
//   <AdminTableSkeleton columns={["media", { type: "money", align: "center" }]} />  // cả panel (list page)
//   <AdminTableBodySkeleton columns={[...]} rows={6} />                            // chỉ body bảng (đã có panel + toolbar thật)
//   <AdminSkeletonRows columns={[...]} rows={5} />                                 // chỉ <tr> (đặt trong <tbody> có sẵn)
//   <AdminListSkeleton rows={4} itemClassName="h-20 rounded-xl" />                 // list card (mobile)
//   <AdminPickerSkeleton rows={4} />                                               // list chọn product/lesson trong form
//   <AdminFormSkeleton />                                                          // trang form (create/edit)
//   <AdminDialogSkeleton />                                                        // nội dung dialog xem chi tiết (read)
// ============================================================

import { cn } from "../ui/utils";
import { AdminPanel } from "../admin/AdminPanel";

/* ----------------------------------------------------------------
   Khối shimmer cơ bản
   ---------------------------------------------------------------- */

/**
 * Một khối xám nhấp nháy. Dùng `.admin-skeleton` (globals.css) nên
 * có sẵn shimmer + biến thể dark mode, khớp với AdminStatCard.
 */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("admin-skeleton rounded-md", className)} />;
}

/* ----------------------------------------------------------------
   Mô tả cột cho skeleton bảng
   ---------------------------------------------------------------- */

/** Hình dạng nội dung của 1 ô trong bảng admin. */
export type AdminSkeletonCellType =
  /** Ảnh vuông 48px + 2 dòng chữ (products, kits, courses) */
  | "media"
  /** Avatar tròn 40px + 2 dòng chữ (users, refunds) */
  | "avatar"
  /** Ô icon vuông 44px + 2 dòng chữ (lessons) */
  | "icon"
  /** 2 dòng chữ không có ảnh (order id + phương thức thanh toán) */
  | "stack"
  /** 1 dòng ngắn cỡ mono (mã đơn / mã invoice) */
  | "mono"
  /** 1 dòng chữ vừa */
  | "text"
  /** 1 dòng chữ ngắn */
  | "line"
  /** 1 pill trạng thái */
  | "badge"
  /** 1 số ngắn */
  | "number"
  /** 1 dòng giá */
  | "money"
  /** 2 nút thao tác tròn (view / edit / delete) */
  | "actions"
  /** 3-4 nút thao tác tròn */
  | "actionsWide";

export interface AdminSkeletonColumn {
  type: AdminSkeletonCellType;
  /** Căn lề của ô + header, mặc định "left" (giống bảng thật) */
  align?: "left" | "center" | "right";
  /** Class thêm cho <th> (vd "w-[300px]") */
  className?: string;
}

export type AdminSkeletonColumnInput = AdminSkeletonCellType | AdminSkeletonColumn;

function normalizeColumn(column: AdminSkeletonColumnInput): AdminSkeletonColumn {
  return typeof column === "string" ? { type: column } : column;
}

/** Độ rộng lệch nhẹ giữa các hàng → nhìn tự nhiên hơn 1 khối lặp cứng. */
const LINE_WIDTHS = ["w-32", "w-40", "w-28", "w-36", "w-24", "w-44"];

function justifyClass(align: AdminSkeletonColumn["align"]) {
  if (align === "center") return "justify-center";
  if (align === "right") return "justify-end";
  return "justify-start";
}

/* ----------------------------------------------------------------
   Render 1 ô theo hình dạng cột
   ---------------------------------------------------------------- */

function CellSkeleton({ column, rowIndex }: { column: AdminSkeletonColumn; rowIndex: number }) {
  const softWidth = LINE_WIDTHS[rowIndex % LINE_WIDTHS.length];

  switch (column.type) {
    case "media":
      return (
        <div className="flex items-center gap-3">
          <SkeletonBlock className="size-12 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-3.5 w-40 max-w-full" />
            <SkeletonBlock className="h-3 w-24 max-w-[70%]" />
          </div>
        </div>
      );
    case "avatar":
      return (
        <div className="flex items-center gap-3">
          <SkeletonBlock className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-3.5 w-32 max-w-full" />
            <SkeletonBlock className="h-3 w-40 max-w-[80%]" />
          </div>
        </div>
      );
    case "icon":
      return (
        <div className="flex items-center gap-3">
          <SkeletonBlock className="size-11 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-3.5 w-44 max-w-full" />
            <SkeletonBlock className="h-3 w-28 max-w-[70%]" />
          </div>
        </div>
      );
    case "stack":
      return (
        <div className="space-y-2">
          <SkeletonBlock className="h-3.5 w-24" />
          <SkeletonBlock className="h-3 w-16" />
        </div>
      );
    case "mono":
      return <SkeletonBlock className="h-3 w-16" />;
    case "badge":
      return <SkeletonBlock className="h-6 w-20 rounded-full" />;
    case "number":
      return <SkeletonBlock className="h-3.5 w-10" />;
    case "money":
      return <SkeletonBlock className="h-3.5 w-20" />;
    case "actions":
      return (
        <div className={cn("flex items-center gap-2", justifyClass(column.align))}>
          <SkeletonBlock className="size-8 rounded-lg" />
          <SkeletonBlock className="size-8 rounded-lg" />
        </div>
      );
    case "actionsWide":
      return (
        <div className={cn("flex items-center gap-2", justifyClass(column.align))}>
          <SkeletonBlock className="size-8 rounded-lg" />
          <SkeletonBlock className="size-8 rounded-lg" />
          <SkeletonBlock className="size-8 rounded-lg" />
        </div>
      );
    // "text" | "line"
    default:
      return <SkeletonBlock className={cn("h-3.5", softWidth)} />;
  }
}

/** Bọc nội dung ô theo căn lề của cột (giống `text-align` ở bảng thật). */
function Cell({ column, rowIndex }: { column: AdminSkeletonColumn; rowIndex: number }) {
  const content = <CellSkeleton column={column} rowIndex={rowIndex} />;
  if (!column.align || column.align === "left") return content;
  return <div className={cn("flex", justifyClass(column.align))}>{content}</div>;
}

/* ----------------------------------------------------------------
   1. Hàng + thân bảng
   ---------------------------------------------------------------- */

interface AdminSkeletonRowsProps {
  columns: AdminSkeletonColumnInput[];
  rows?: number;
}

/**
 * Chỉ render các `<tr>` giả — đặt trực tiếp trong `<tbody>` có sẵn
 * (dùng cho AdminUsersDesktop: bảng + toolbar + phân trang là thật).
 */
export function AdminSkeletonRows({ columns, rows = 6 }: AdminSkeletonRowsProps) {
  const normalized = columns.map(normalizeColumn);
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-border last:border-0">
          {normalized.map((column, columnIndex) => (
            <td key={columnIndex} className="px-6 py-4">
              <Cell column={column} rowIndex={rowIndex} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

interface AdminTableBodySkeletonProps {
  columns: AdminSkeletonColumnInput[];
  rows?: number;
  /** Render luôn hàng header giả (mặc định true) */
  header?: boolean;
  className?: string;
  tableClassName?: string;
}

/**
 * Thân bảng skeleton: `<div class="overflow-x-auto">` + `<table class="admin-table">`.
 * Dùng để thay ĐÚNG vùng body của bảng khi panel + toolbar bên ngoài đã render thật
 * (products, kits, refunds, reports, support-diy...).
 */
export function AdminTableBodySkeleton({
  columns,
  rows = 6,
  header = true,
  className,
  tableClassName,
}: AdminTableBodySkeletonProps) {
  const normalized = columns.map(normalizeColumn);
  return (
    <div
      className={cn("overflow-x-auto", className)}
      style={{ background: "var(--card)" }}
      aria-busy="true"
    >
      <table className={cn("admin-table w-full", tableClassName)}>
        {header && (
          <thead className="bg-muted">
            <tr>
              {normalized.map((column, index) => (
                <th
                  key={index}
                  className={cn(
                    "px-6 py-4 text-sm font-medium text-muted-foreground",
                    column.className,
                  )}
                  style={{ textAlign: column.align }}
                >
                  <div className={cn("flex", justifyClass(column.align ?? "left"))}>
                    <SkeletonBlock className="h-3.5 w-16" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          <AdminSkeletonRows columns={columns} rows={rows} />
        </tbody>
      </table>
    </div>
  );
}

/* ----------------------------------------------------------------
   2. Panel đầy đủ (toolbar + bảng + phân trang)
   ---------------------------------------------------------------- */

interface AdminTableSkeletonProps {
  columns: AdminSkeletonColumnInput[];
  rows?: number;
  /** Ô search giả ở trên bảng (mặc định true) */
  toolbar?: boolean;
  /** Số ô filter giả cạnh ô search (AdminSelect / chips) */
  filters?: number;
  /** Thanh phân trang giả dưới bảng */
  pagination?: boolean;
  /** Bọc trong <AdminPanel> — tắt khi nơi gọi đã có panel bao ngoài */
  panel?: boolean;
  className?: string;
}

/**
 * Skeleton cho CẢ khối danh sách admin: toolbar + bảng + phân trang.
 * Dùng khi trạng thái loading thay thế toàn trang (courses, lessons, orders).
 */
export function AdminTableSkeleton({
  columns,
  rows = 6,
  toolbar = true,
  filters = 0,
  pagination = false,
  panel = true,
  className,
}: AdminTableSkeletonProps) {
  const content = (
    <>
      {toolbar && (
        <div
          className="flex flex-col gap-3 border-b border-border p-6 sm:flex-row sm:items-center"
          style={{ background: "var(--surface)" }}
        >
          <SkeletonBlock className="h-12 flex-1 rounded-xl" />
          {Array.from({ length: filters }).map((_, index) => (
            <SkeletonBlock key={index} className="h-12 w-full rounded-xl sm:w-44" />
          ))}
        </div>
      )}

      <AdminTableBodySkeleton columns={columns} rows={rows} />

      {pagination && (
        <div className="flex items-center justify-between gap-4 border-t border-border p-4">
          <SkeletonBlock className="h-4 w-36" />
          <div className="flex items-center gap-2">
            <SkeletonBlock className="size-9 rounded-lg" />
            <SkeletonBlock className="h-9 w-16 rounded-lg" />
            <SkeletonBlock className="size-9 rounded-lg" />
          </div>
        </div>
      )}
    </>
  );

  if (!panel) return <div className={className}>{content}</div>;
  return <AdminPanel className={className}>{content}</AdminPanel>;
}

/* ----------------------------------------------------------------
   3. Danh sách card (mobile) / khối rời
   ---------------------------------------------------------------- */

interface AdminListSkeletonProps {
  rows?: number;
  /**
   * "block": các khối chữ nhật shimmer (list card mobile — DIY, reports, support)
   * "card": card có avatar + 3 dòng + 2 field (users mobile)
   */
  variant?: "block" | "card";
  className?: string;
  itemClassName?: string;
}

export function AdminListSkeleton({
  rows = 4,
  variant = "block",
  className,
  itemClassName,
}: AdminListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true">
      {Array.from({ length: rows }).map((_, index) =>
        variant === "card" ? (
          <div
            key={index}
            className={cn("rounded-2xl border p-4", itemClassName)}
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-start gap-3">
              <SkeletonBlock className="size-11 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-3.5 w-32 max-w-full" />
                <SkeletonBlock className="h-3 w-24 max-w-[60%]" />
                <SkeletonBlock className="h-3 w-44 max-w-[80%]" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <SkeletonBlock className="h-10 rounded-lg" />
              <SkeletonBlock className="h-10 rounded-lg" />
            </div>
          </div>
        ) : (
          <SkeletonBlock key={index} className={cn("h-20 rounded-xl", itemClassName)} />
        ),
      )}
    </div>
  );
}

/* ----------------------------------------------------------------
   4. Picker trong form (chọn product / lesson / kit)
   ---------------------------------------------------------------- */

interface AdminPickerSkeletonProps {
  rows?: number;
  /** Có ảnh thumbnail nhỏ bên trái (kit product selector) */
  withThumb?: boolean;
  className?: string;
}

export function AdminPickerSkeleton({
  rows = 4,
  withThumb = false,
  className,
}: AdminPickerSkeletonProps) {
  return (
    <div className={cn("space-y-1", className)} aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-2">
          <SkeletonBlock className="size-4 shrink-0 rounded" />
          {withThumb && <SkeletonBlock className="size-10 shrink-0 rounded-lg" />}
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-3 w-40 max-w-full" />
            <SkeletonBlock className="h-2.5 w-24 max-w-[50%]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------
   5. Trang form (create / edit)
   ---------------------------------------------------------------- */

export function AdminFormSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)} aria-busy="true">
      {/* Nút back + tiêu đề trang */}
      <div className="space-y-3">
        <SkeletonBlock className="h-9 w-28 rounded-xl" />
        <SkeletonBlock className="h-6 w-56" />
        <SkeletonBlock className="h-3.5 w-72 max-w-full" />
      </div>

      {/* Layout 2 cột giống form admin (main + sidebar) */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <AdminPanel hover={false}>
            <div className="space-y-5 p-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <SkeletonBlock className="h-3.5 w-24" />
                  <SkeletonBlock className="h-11 rounded-xl" />
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel hover={false}>
            <div className="space-y-4 p-6">
              <SkeletonBlock className="h-3.5 w-32" />
              <AdminPickerSkeleton rows={4} />
            </div>
          </AdminPanel>
        </div>

        <div className="space-y-6">
          <AdminPanel hover={false}>
            <div className="space-y-4 p-6">
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-40 rounded-xl" />
              <SkeletonBlock className="h-11 rounded-xl" />
              <SkeletonBlock className="h-11 rounded-xl" />
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   6. Dialog xem chi tiết (read action)
   ---------------------------------------------------------------- */

interface AdminDialogSkeletonProps {
  /** Số ô "label + value" ở khối thông tin phía trên */
  items?: number;
  /** Số dòng hàng hoá / variant phía dưới */
  rows?: number;
  className?: string;
}

export function AdminDialogSkeleton({ items = 4, rows = 3, className }: AdminDialogSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)} aria-busy="true">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className="space-y-2">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-4 w-32 max-w-full" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border p-3"
            style={{ background: "var(--surface)", borderColor: "var(--border-light)" }}
          >
            <SkeletonBlock className="size-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-3.5 w-40 max-w-full" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
            <SkeletonBlock className="h-3.5 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
