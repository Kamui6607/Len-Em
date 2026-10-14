// ============================================================
// StaffReports — route /staff/reports
// Staff xử lý các báo cáo đơn hàng mà Admin giao cho mình.
// - Lọc theo trạng thái bằng tab (mặc định "Đang chờ" — việc cần làm).
// - Hộp xử lý dùng chung với admin (ReportReviewModal): ghi chú nháp,
//   đánh dấu Xong / Huỷ có hỏi lại.
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { orderReportService } from "../../../features/orderReport/services/orderReport.service";
import type { OrderReport } from "../../../features/orderReport/types/orderReport.types";
import { ReportListItem, ReportReviewModal } from "../../../features/orderReport/components/ReportReview";
import type { ReportStatus } from "../../../features/orderReport/reportMeta";
import { useAuth } from "../../../shared/hooks/useAuth";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import { AdminPagination } from "../../../shared/components/admin/AdminPagination";

const PAGE_SIZE = 10;

const STATUS_TABS: { value: ReportStatus | ""; label: string }[] = [
  { value: "PENDING", label: "Đang chờ" },
  { value: "DONE", label: "Đã xong" },
  { value: "CANCELLED", label: "Đã huỷ" },
  { value: "", label: "Tất cả" },
];

export function StaffReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<OrderReport[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ReportStatus | "">("PENDING");
  const [selected, setSelected] = useState<OrderReport | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await orderReportService.getAll({
        page,
        limit: PAGE_SIZE,
        assignedStaff: user?.id,
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
  }, [page, filterStatus, user?.id]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const activeTab = STATUS_TABS.find((tab) => tab.value === filterStatus);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Được giao cho bạn"
        title="Báo cáo đơn hàng"
        subtitle="Xử lý các khiếu nại của khách mà Admin đã giao cho bạn."
      />

      <AdminPanel hover={false}>
        <div className="rv-tabs" role="tablist" aria-label="Lọc theo trạng thái">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value || "all"}
              type="button"
              role="tab"
              aria-selected={filterStatus === tab.value}
              className="rv-tab"
              onClick={() => {
                setFilterStatus(tab.value);
                setPage(1);
              }}
            >
              {tab.label}
              {filterStatus === tab.value && !loading && <span className="rv-tab-count">{total}</span>}
            </button>
          ))}
        </div>

        <div className="rv-list">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="admin-skeleton h-24 rounded-2xl" />)
          ) : reports.length === 0 ? (
            <div className="admin-empty-state">
              <Flag size={40} />
              <p>
                {filterStatus === "PENDING"
                  ? "Không có báo cáo nào đang chờ bạn"
                  : `Không có báo cáo "${activeTab?.label.toLowerCase()}"`}
              </p>
              <p className="text-sm">Khi Admin giao báo cáo cho bạn, nó sẽ xuất hiện ở đây.</p>
            </div>
          ) : (
            reports.map((report) => (
              <ReportListItem key={report._id} report={report} onOpen={() => setSelected(report)} />
            ))
          )}
        </div>
      </AdminPanel>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={total}
        pageSize={PAGE_SIZE}
        disabled={loading}
      />

      {selected && (
        <ReportReviewModal
          report={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setSelected(updated);
            setReports((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
          }}
          onDeleted={() => void fetchReports()}
        />
      )}
    </div>
  );
}
