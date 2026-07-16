import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Eye, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { orderReportService } from "../../../features/orderReport/services/orderReport.service";
import { useDebouncedSearch } from "../../../hooks/useDebouncedSearch";
import { userService } from "../../../features/users/services/user.service";
import type { OrderReport } from "../../../features/orderReport/types/orderReport.types";
import type { UsersListResponse } from "../../../features/users/services/user.service";
import { useAuth } from "../../../hooks/useAuth";

type ApiUser = UsersListResponse["result"]["users"][0];

const STATUS_OPTIONS = ["", "PENDING", "DONE", "CANCELLED"];

type SortField = "id" | "title" | "orderId" | "status" | "date";
type SortDirection = "asc" | "desc";

export function AdminReports() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const [reports, setReports] = useState<OrderReport[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const { inputValue, debouncedValue, setInputValue } = useDebouncedSearch({ delay: 400, minChars: 0 });

  // Detail modal state
  const [selectedReport, setSelectedReport] = useState<OrderReport | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [noteUpdating, setNoteUpdating] = useState(false);
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");

  // Delete confirm state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await orderReportService.getAll({
        page,
        limit: 10,
        search: debouncedValue || undefined,
        status: filterStatus || undefined,
      });
      setReports(data.data.reports);
      setTotalPages(data.data.totalPages);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedValue, filterStatus]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  useEffect(() => {
    // Fetch all users and filter client-side by roleName === "Staff"
    const timer = setTimeout(() => {
      userService.getAllUsers({ page: 1, limit: 50 })
        .then((response) => {
          const users = response.data?.data?.result?.users || [];
          setApiUsers(users);
        })
        .catch((error) => {
          console.warn("Failed to load users for staff assignment:", error);
          setApiUsers([]);
        });
    }, 100); // Small delay to ensure auth is ready
    
    return () => clearTimeout(timer);
  }, []);

  const staffUsers = apiUsers.filter((u) => {
    const roleStr = typeof u.roleId === "object" ? u.roleId?.roleName : String(u.roleId);
    return roleStr === "Staff";
  });

  const handleUpdateStatus = async (id: string, status: string) => {
    setStatusUpdating(true);
    try {
      await orderReportService.updateStatus(id, status);
      toast.success(`Report marked as ${status}`);
      setSelectedReport(null);
      fetchReports();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedReport || !newNote.trim()) return;
    setNoteUpdating(true);
    try {
      await orderReportService.updateNote(selectedReport._id, newNote);
      toast.success("Note updated");
      setSelectedReport({ ...selectedReport, adminNote: newNote });
      fetchReports();
    } catch {
      toast.error("Failed to update note");
    } finally {
      setNoteUpdating(false);
    }
  };

  const handleAssignStaff = async (reportId: string) => {
    if (!selectedStaff) return;
    try {
      await orderReportService.assignStaff(reportId, selectedStaff);
      toast.success("Staff assigned");
      setAssignModal(null);
      setSelectedStaff(null);
      fetchReports();
    } catch {
      toast.error("Failed to assign staff");
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  function SortableHeader({ label, field, align = "left" }: { label: string; field: SortField; align?: "left" | "right" }) {
    const active = sortField === field;
    return (
      <th className={`px-6 py-4 text-sm font-medium text-muted-foreground ${align === "right" ? "text-right" : "text-left"}`}>
        <button
          type="button"
          onClick={() => handleSort(field)}
          className={`group inline-flex items-center gap-1 transition-colors hover:text-foreground focus:outline-none ${active ? "text-foreground" : ""} ${align === "right" ? "flex-row-reverse" : ""}`}
        >
          {label}
          <span className="flex flex-col items-center justify-center -space-y-[3px]">
            <ChevronUp className={`w-2.5 h-2.5 ${active && sortDirection === "asc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
            <ChevronDown className={`w-2.5 h-2.5 ${active && sortDirection === "desc" ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
          </span>
        </button>
      </th>
    );
  }

  const sortedReports = [...reports].sort((a, b) => {
    if (!sortField) return 0;
    const getValue = (report: OrderReport) => {
      switch (sortField) {
        case "id": return report._id;
        case "title": return report.title;
        case "orderId": return report.orderId;
        case "status": return report.status;
        case "date": return new Date(report.createdAt).getTime();
      }
    };
    const cmp = String(getValue(a)).localeCompare(String(getValue(b)));
    return sortDirection === "asc" ? cmp : -cmp;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="mb-2">Order Reports</h1>
          <p className="text-muted-foreground">Customer issue reports and complaints management</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="admin-panel-glow rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg" style={{ borderColor: "var(--border)" }}>
        <div className="p-6 border-b border-border" style={{ background: "var(--surface)" }}>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search by report ID or title..."
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setPage(1); }}
              className="input px-4 py-2 w-64"
            />
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="input px-4 py-2"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.filter(Boolean).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="space-y-3 p-6" style={{ background: "var(--card)" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-muted rounded-lg" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground" style={{ background: "var(--card)" }}>
          No reports found.
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto" style={{ background: "var(--card)" }}>
            <table className="admin-table w-full text-sm">
              <thead>
                <tr>
                  <SortableHeader label="ID" field="id" />
                  <SortableHeader label="Title" field="title" />
                  <SortableHeader label="Order ID" field="orderId" />
                  <SortableHeader label="Status" field="status" />
                  <SortableHeader label="Date" field="date" />
                  <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedReports.map((report) => (
                  <tr key={report._id} className="border-b border-border hover:bg-[var(--surface-secondary)] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{report._id.slice(-8)}</td>
                    <td className="px-6 py-4 max-w-[200px] truncate text-sm">{report.title}</td>
                    <td className="px-6 py-4 font-mono text-xs">{report.orderId.slice(-8)}</td>
                    <td className="px-6 py-4">
                       <span className={`badge ${
                         report.status === "PENDING" ? "badge-orange" :
                         report.status === "DONE" ? "badge-green" :
                         "badge-red"
                       }`}>
                         {report.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{format(new Date(report.createdAt), "MMM dd, yyyy")}</td>
                    <td className="px-6 py-4 text-left">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="admin-action-btn view text-xs"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setSelectedReport(null);
                            setDeleteTargetId(report._id);
                          }}
                          className="admin-action-btn delete text-xs ml-1"
                          title="Delete report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3 p-4" style={{ background: "var(--card)" }}>
            {reports.map((report) => (
              <div key={report._id} className="p-4 rounded-xl border border-border bg-surface">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-sm truncate">{report.title}</span>
                   <span className={`badge ml-2 whitespace-nowrap ${
                     report.status === "PENDING" ? "badge-orange" :
                     report.status === "DONE" ? "badge-green" :
                     "badge-red"
                   }`}>{report.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Order: #{report.orderId.slice(-8)}</p>
                <button onClick={() => setSelectedReport(report)} className="text-primary hover:underline text-xs">View Details</button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4 p-4">
              <button
                onClick={() => setPage(p => Math.max(1, p-1))}
                disabled={page <= 1}
                className="btn-secondary"
              >
                Prev
              </button>
              <span className="text-sm text-muted-foreground self-center">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p+1))}
                disabled={page >= totalPages}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedReport(null)}>
          <div className="bg-popover rounded-2xl border border-border shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{selectedReport.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Report #{selectedReport._id.slice(-8)} · Order #{selectedReport.orderId.slice(-8)}
                  </p>
                </div>
                 <span className={`badge ${
                   selectedReport.status === "PENDING" ? "badge-orange" :
                   selectedReport.status === "DONE" ? "badge-green" :
                   "badge-red"
                 }`}>{selectedReport.status}</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{selectedReport.description}</p>
              </div>

              {selectedReport.images && selectedReport.images.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Images</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedReport.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="w-20 h-20 rounded-lg object-cover" />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Created</p>
                <p className="text-sm">{format(new Date(selectedReport.createdAt), "MMM dd, yyyy HH:mm")}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Admin Note</p>
                <textarea
                  value={newNote || selectedReport.adminNote || ""}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="input w-full px-3 py-2 min-h-[80px]"
                  placeholder="Add admin note..."
                />
                <button
                  onClick={handleUpdateNote}
                  disabled={noteUpdating || !newNote.trim()}
                  className="mt-2 px-4 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {noteUpdating ? "Saving..." : "Save Note"}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                {selectedReport.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedReport._id, "DONE")}
                      disabled={statusUpdating}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: "var(--accent-green)",
                        color: "var(--accent-green-text)",
                      }}
                    >
                      Mark as Done
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReport._id, "CANCELLED")}
                      disabled={statusUpdating}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: "var(--accent-red)",
                        color: "var(--accent-red-text)",
                      }}
                    >
                      Cancel Report
                    </button>
                  </>
                )}
                <button
                  onClick={() => setAssignModal(selectedReport._id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-card border border-border hover:bg-muted"
                >
                  {selectedReport.assignedStaff ? "Reassign" : "Assign Staff"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTargetId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setDeleteTargetId(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-2">Delete Report</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this report? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await orderReportService.delete(deleteTargetId);
                    toast.success("Report deleted successfully");
                    setDeleteTargetId(null);
                    fetchReports();
                  } catch {
                    toast.error("Failed to delete report");
                    setDeleteTargetId(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setAssignModal(null)}>
          <div className="bg-popover rounded-2xl border border-border shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold">Assign Staff</h3>
            </div>
            {staffUsers.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">No staff available.</div>
            ) : (
              <div className="p-3 space-y-1 max-h-60 overflow-y-auto">
                {staffUsers.map((staff) => (
                  <button
                    key={staff.userId}
                    onClick={() => setSelectedStaff(staff.userId)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedStaff === staff.userId ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                    }`}
                  >
                    <p className="font-medium text-sm">{staff.fullName}</p>
                    <p className="text-xs text-muted-foreground">{staff.email}</p>
                  </button>
                ))}
              </div>
            )}
            <div className="p-4 pt-2 flex gap-3">
              <button onClick={() => { setAssignModal(null); setSelectedStaff(null); }} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button
                onClick={() => handleAssignStaff(assignModal)}
                disabled={!selectedStaff}
                className="btn-primary flex-1 py-2.5"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}