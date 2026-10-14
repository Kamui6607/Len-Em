// ============================================================
// AdminReports — route /admin/reports (Admin + Staff có quyền xem)
// Báo cáo sự cố đơn hàng của khách:
//  - Tab trạng thái có số đếm (mặc định "Đang chờ" — việc cần xử lý)
//  - Tìm theo tiêu đề / mã báo cáo / mã đơn (BE: search, debounce 400ms)
//  - Mỗi dòng hiện người xử lý ("Chưa giao" nổi bật để Admin phân việc)
//  - Hộp xử lý dùng chung với staff; Admin có thêm giao việc + xoá
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ClipboardCheck, Clock, Eye, Flag, Image as ImageIcon, Layers, RefreshCw, UserRound, XCircle } from "lucide-react";
import { orderReportService } from "../../../features/orderReport/services/orderReport.service";
import type { OrderReport } from "../../../features/orderReport/types/orderReport.types";
import {
  assigneeName,
  ReportReviewModal,
  type StaffOption,
} from "../../../features/orderReport/components/ReportReview";
import {
  reportCode,
  reportImages,
  reportOrderCode,
  statusMeta,
  type ReportStatus,
} from "../../../features/orderReport/reportMeta";
import { toText } from "../../../lib/displayText";
import { userService, type UserRoleRef, type UsersListResponse } from "../../../features/users/services/user.service";
import { loadRoles } from "../../../shared/api/roleService";
import { useDebouncedSearch } from "../../../shared/hooks/useDebouncedSearch";
import { useAuth } from "../../../shared/hooks/useAuth";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import { AdminSearchMeta, ADMIN_SEARCH_DEBOUNCE_MS } from "../../../shared/components/admin/AdminSearch";
import {
  AdminActionButton,
  AdminCellStack,
  AdminDataGrid,
  AdminDateCell,
  AdminGridFooter,
  AdminGridToolbar,
  AdminPill,
  AdminRowActions,
  AdminRowMenu,
  AdminStatusTabs,
  type AdminGridColumn,
  type AdminStatusTab,
  type AdminTone,
} from "../../../shared/components/admin/AdminDataGrid";

type ApiUser = UsersListResponse["result"]["users"][0];
type TabValue = ReportStatus | "";

const PAGE_SIZE = 10;

const STATUS_TABS: AdminStatusTab<TabValue>[] = [
  { value: "PENDING", label: "Đang chờ", icon: Clock, tone: "amber" },
  { value: "DONE", label: "Đã xong", icon: CheckCircle2, tone: "green" },
  { value: "CANCELLED", label: "Đã huỷ", icon: XCircle, tone: "rose" },
  { value: "", label: "Tất cả", icon: Layers },
];

const STATUS_TONE: Record<ReportStatus, AdminTone> = {
  PENDING: "amber",
  DONE: "green",
  CANCELLED: "rose",
};

/** Danh sách Staff để giao việc (endpoint /users chỉ dành cho Admin). */
async function loadStaffOptions(): Promise<StaffOption[]> {
  let staffRoleId: string | undefined;
  try {
    const roles = await loadRoles({ limit: 100 });
    staffRoleId = roles.find((role) => role.roleName === "Staff")?._id;
  } catch {
    // Không tra được role → lọc theo roleId nhúng trong từng user bên dưới
  }
  const collected: ApiUser[] = [];
  const seen = new Set<string>();
  for (let p = 1; p <= 5; p++) {
    const { data } = await userService.getAllUsers({ page: p, limit: 20, roleId: staffRoleId });
    for (const user of data.data?.result?.users ?? []) {
      if (!user.userId || seen.has(user.userId)) continue;
      seen.add(user.userId);
      collected.push(user);
    }
    if (p >= (data.data?.result?.totalPages ?? 1)) break;
  }
  const roleOf = (user: ApiUser) =>
    typeof user.roleId === "string" ? { id: user.roleId, name: user.roleId } : {
      id: (user.roleId as UserRoleRef | undefined)?._id ?? "",
      name: (user.roleId as UserRoleRef | undefined)?.roleName ?? "",
    };
  const staff = collected.filter((u) => {
    const role = roleOf(u);
    return (staffRoleId && role.id === staffRoleId) || role.name === "Staff";
  });
  return staff.map((u) => ({ id: u.userId, name: u.fullName || u.username, email: u.email }));
}

export function AdminReports() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [reports, setReports] = useState<OrderReport[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TabValue>("PENDING");
  const [counts, setCounts] = useState<Partial<Record<TabValue, number>>>({});
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [selected, setSelected] = useState<OrderReport | null>(null);

  const {
    inputValue,
    debouncedValue,
    setInputValue,
    isWaiting: searchIsWaiting,
    clear: clearSearch,
  } = useDebouncedSearch({ delay: ADMIN_SEARCH_DEBOUNCE_MS, minChars: 0 });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await orderReportService.getAll({
        page,
        limit: PAGE_SIZE,
        search: debouncedValue.trim() || undefined,
        status: filterStatus || undefined,
      });
      const list = Array.isArray(data.data?.reports) ? data.data.reports : [];
      setReports(list);
      setTotal(data.data?.total ?? list.length);
      setTotalPages(Math.max(1, data.data?.totalPages ?? 1));
    } catch {
      toast.error("Không tải được danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedValue, filterStatus]);

  // Số đếm cho từng tab (theo từ khoá đang tìm): 4 request limit=1, chỉ đọc `total`.
  const fetchCounts = useCallback(async () => {
    const search = debouncedValue.trim() || undefined;
    const entries = await Promise.all(
      STATUS_TABS.map(async (tab) => {
        try {
          const { data } = await orderReportService.getAll({ page: 1, limit: 1, search, status: tab.value || undefined });
          return [tab.value, data.data?.total ?? 0] as const;
        } catch {
          return [tab.value, undefined] as const;
        }
      }),
    );
    setCounts(Object.fromEntries(entries));
  }, [debouncedValue]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);
  useEffect(() => {
    void fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    loadStaffOptions()
      .then((list) => !cancelled && setStaff(list))
      .catch(() => !cancelled && setStaff([]));
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const refreshAll = () => {
    void fetchReports();
    void fetchCounts();
  };

  const searching = Boolean(inputValue || debouncedValue);

  const columns: AdminGridColumn<OrderReport>[] = [
    {
      key: "title",
      header: "Báo cáo",
      width: "minmax(260px, 2.4fr)",
      minWidth: 260,
      card: "title",
      render: (report) => (
        <AdminCellStack
          primary={
            <>
              <span className="adm-gid">#{reportCode(report)}</span> {toText(report.title) || "Báo cáo"}
            </>
          }
          secondary={toText(report.description)}
        />
      ),
    },
    {
      key: "order",
      header: "Đơn hàng",
      width: "120px",
      minWidth: 120,
      render: (report) => {
        const images = reportImages(report);
        return (
          <>
            <span className="adm-gmono adm-gprimary">#{reportOrderCode(report)}</span>
            {images.length > 0 && (
              <span className="adm-gsecondary inline-flex items-center gap-1">
                <ImageIcon className="h-3 w-3" aria-hidden="true" /> {images.length} ảnh
              </span>
            )}
          </>
        );
      },
    },
    ...(isAdmin
      ? [
          {
            key: "assignee",
            header: "Người xử lý",
            width: "minmax(140px, 1fr)",
            minWidth: 140,
            render: (report: OrderReport) => {
              const name = assigneeName(report, staff);
              return name ? (
                <span className="adm-gprimary inline-flex items-center gap-1.5">
                  <UserRound className="h-3.5 w-3.5 text-[var(--foreground-muted)]" aria-hidden="true" />
                  {name}
                </span>
              ) : (
                <AdminPill tone="amber" fixed={false}>
                  Chưa giao
                </AdminPill>
              );
            },
          } satisfies AdminGridColumn<OrderReport>,
        ]
      : []),
    {
      key: "date",
      header: "Ngày gửi",
      width: "100px",
      minWidth: 100,
      render: (report) => <AdminDateCell value={report.createdAt} />,
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "120px",
      minWidth: 120,
      align: "center",
      card: "aside",
      render: (report) => (
        <AdminPill tone={STATUS_TONE[report.status] ?? "neutral"}>{statusMeta(report.status).label}</AdminPill>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      width: "178px",
      minWidth: 178,
      align: "center",
      card: "actions",
      render: (report) => (
        <AdminRowActions>
          {report.status === "PENDING" ? (
            <AdminActionButton icon={ClipboardCheck} tone="green" label="Xử lý" onClick={() => setSelected(report)} />
          ) : (
            <AdminActionButton icon={Eye} label="Xem" onClick={() => setSelected(report)} />
          )}
          <AdminRowMenu
            ariaLabel="Thao tác khác"
            items={[{ label: "Xem chi tiết", icon: Eye, onSelect: () => setSelected(report) }]}
          />
        </AdminRowActions>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow="Chăm sóc khách hàng"
        title="Báo cáo đơn hàng"
        subtitle={
          isAdmin
            ? "Khiếu nại của khách về đơn hàng — giao cho nhân viên, theo dõi và đóng báo cáo."
            : "Khiếu nại của khách về đơn hàng — xem và xử lý báo cáo."
        }
        actions={
          <button type="button" className="btn-secondary" onClick={refreshAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        }
      />

      <AdminStatusTabs<TabValue>
        ariaLabel="Lọc theo trạng thái"
        value={filterStatus}
        onChange={(value) => {
          setFilterStatus(value);
          setPage(1);
        }}
        tabs={STATUS_TABS.map((tab) => ({ ...tab, count: counts[tab.value] }))}
      />

      <AdminPanel hover={false} className="adm-gpanel">
        <AdminGridToolbar
          search={{
            value: inputValue,
            onChange: (value) => {
              setInputValue(value);
              setPage(1);
            },
            placeholder: "Tìm theo tiêu đề, mã báo cáo hoặc mã đơn (24 ký tự)…",
            isSearching: searchIsWaiting,
          }}
          onReset={
            searching
              ? () => {
                  clearSearch();
                  setPage(1);
                }
              : undefined
          }
          meta={
            searching ? (
              <AdminSearchMeta searching={searchIsWaiting}>
                {total === 0 ? "Không có kết quả" : `${total} kết quả`}
              </AdminSearchMeta>
            ) : undefined
          }
        />

        <AdminDataGrid<OrderReport>
          ariaLabel="Báo cáo đơn hàng"
          rows={reports}
          rowKey={(r) => r._id}
          columns={columns}
          loading={loading}
          onRowClick={(r) => setSelected(r)}
          rowAccent={(r) => (r.status === "PENDING" ? "amber" : null)}
          empty={{
            icon: Flag,
            title: searching
              ? "Không tìm thấy báo cáo phù hợp"
              : filterStatus === "PENDING"
                ? "Không còn báo cáo nào đang chờ 🎉"
                : "Chưa có báo cáo nào",
            description: searching ? "Thử từ khoá khác, hoặc dán đủ 24 ký tự của mã báo cáo / mã đơn." : undefined,
          }}
        />

        <AdminGridFooter page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} disabled={loading} />
      </AdminPanel>

      {selected && (
        <ReportReviewModal
          report={selected}
          staff={staff}
          canAssign={isAdmin}
          canDelete={isAdmin}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setSelected(updated);
            setReports((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
          }}
          onDeleted={refreshAll}
        />
      )}
    </div>
  );
}
