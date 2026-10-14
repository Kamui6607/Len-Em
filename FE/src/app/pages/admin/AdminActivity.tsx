import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity as ActivityIcon, CreditCard, LogIn, PackagePlus, PencilLine, ShoppingCart, Trash2, UserPlus } from "lucide-react";
import { useAdmin, type Activity } from "../../../shared/contexts/AdminContext";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import {
  AdminCellStack,
  AdminDataGrid,
  AdminDateCell,
  AdminGridFooter,
  AdminGridToolbar,
  AdminPill,
  useAdminGridSort,
  type AdminGridColumn,
  type AdminTone,
} from "../../../shared/components/admin/AdminDataGrid";

/** Records per page — every admin list uses the same page size. */
const PAGE_SIZE = 10;

const TYPE_META: Record<Activity["type"], { label: string; icon: LucideIcon; tone: AdminTone }> = {
  login: { label: "Đăng nhập", icon: LogIn, tone: "neutral" },
  purchase: { label: "Mua hàng", icon: ShoppingCart, tone: "blue" },
  payment_confirmed: { label: "Xác nhận đơn", icon: CreditCard, tone: "green" },
  user_created: { label: "Người dùng", icon: UserPlus, tone: "violet" },
  product_created: { label: "Tạo sản phẩm", icon: PackagePlus, tone: "cyan" },
  product_updated: { label: "Sửa sản phẩm", icon: PencilLine, tone: "amber" },
  product_deleted: { label: "Xoá sản phẩm", icon: Trash2, tone: "rose" },
};

export function AdminActivity() {
  const { activities } = useAdmin();
  const [page, setPage] = useState(1);
  const {
    inputValue: searchTerm,
    debouncedValue: debouncedSearch,
    setInputValue: setSearchTerm,
    isWaiting,
    clear: clearSearch,
  } = useDebouncedSearch({ delay: 300, minChars: 0 });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Activity logs live in memory (AdminContext) — filter, sort and page here.
  const needle = debouncedSearch.trim().toLowerCase();
  const matched = needle
    ? activities.filter(
        (a) => a.description.toLowerCase().includes(needle) || a.userName.toLowerCase().includes(needle),
      )
    : activities;
  const { sort, apply: applySort } = useAdminGridSort<Activity>((a, field) => {
    if (field === "time") return new Date(a.timestamp).getTime();
    if (field === "type") return TYPE_META[a.type]?.label ?? a.type;
    if (field === "user") return a.userName;
    return null;
  });
  const sorted = applySort(matched);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const columns: AdminGridColumn<Activity>[] = [
    {
      key: "description",
      header: "Hoạt động",
      width: "minmax(300px, 3fr)",
      minWidth: 300,
      card: "title",
      render: (a) => {
        const Icon = TYPE_META[a.type]?.icon ?? ActivityIcon;
        return <AdminCellStack media={<Icon />} primary={a.description} />;
      },
    },
    {
      key: "type",
      header: "Loại",
      width: "150px",
      minWidth: 140,
      align: "center",
      sortable: true,
      card: "aside",
      render: (a) => (
        <AdminPill tone={TYPE_META[a.type]?.tone ?? "neutral"} fixed={false}>
          {TYPE_META[a.type]?.label ?? a.type}
        </AdminPill>
      ),
    },
    {
      key: "user",
      header: "Người thực hiện",
      width: "minmax(150px, 1fr)",
      minWidth: 150,
      sortable: true,
      render: (a) => <span className="adm-gprimary">{a.userName}</span>,
    },
    {
      key: "time",
      header: "Thời gian",
      width: "120px",
      minWidth: 120,
      sortable: true,
      render: (a) => <AdminDateCell value={a.timestamp} />,
    },
  ];

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow="Giám sát"
        title="Nhật ký hoạt động"
        subtitle={`${activities.length} hoạt động gần đây của hệ thống (lưu trên trình duyệt này)`}
      />

      <AdminPanel hover={false} className="adm-gpanel">
        <AdminGridToolbar
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: "Tìm theo nội dung hoặc người thực hiện…",
            isSearching: isWaiting,
          }}
          onReset={searchTerm ? clearSearch : undefined}
        />

        <AdminDataGrid<Activity>
          ariaLabel="Nhật ký hoạt động"
          rows={rows}
          rowKey={(a) => a.id}
          columns={columns}
          sort={sort}
          rowHeight={56}
          empty={{
            icon: ActivityIcon,
            title: needle ? "Không có hoạt động phù hợp" : "Chưa có hoạt động nào được ghi nhận",
          }}
        />

        <AdminGridFooter page={safePage} totalPages={totalPages} total={sorted.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </AdminPanel>
    </div>
  );
}
