// ============================================================
// StaffReports — route /staff/reports
// Staff xem reports được assigned cho mình
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { orderReportService } from "../../../features/orderReport/services/orderReport.service";
import type { OrderReport } from "../../../features/orderReport/types/orderReport.types";
import { useAuth } from "../../../hooks/useAuth";
import { Badge } from "../../components/ui/badge";
import { CheckCircle, XCircle, Eye } from "lucide-react";

const STATUS_OPTIONS = ["", "PENDING", "DONE", "CANCELLED"];

export function StaffReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<OrderReport[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  // Detail modal state
  const [selectedReport, setSelectedReport] = useState<OrderReport | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [noteUpdating, setNoteUpdating] = useState(false);
  const [newNote, setNewNote] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await orderReportService.getAll({
        page,
        limit: 10,
        assignedStaff: user?.id,
        status: filterStatus || undefined,
      });
      setReports(data.data.reports);
      setTotalPages(data.data.totalPages);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, user?.id]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateStatus = async (id: string, status: string) => {
    setStatusUpdating(true);
    try {
      await orderReportService.updateStatus(id, status, newNote);
      toast.success(`Report marked as ${status}`);
      setSelectedReport(null);
      setNewNote("");
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
      setNewNote("");
      fetchReports();
    } catch {
      toast.error("Failed to update note");
    } finally {
      setNoteUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl mb-2">My Assigned Reports</h1>
        <p className="text-muted-foreground">Handle reports assigned to you by admin</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 rounded-lg border border-border bg-card text-sm"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse bg-muted rounded-lg" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center border border-border">
          <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="mb-2">No Reports Assigned</h3>
          <p className="text-muted-foreground">When admin assigns you a report, it will appear here.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report._id} className="bg-card rounded-2xl p-5 border border-border">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={
                          report.status === "PENDING"
                            ? "secondary"
                            : report.status === "DONE"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {report.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        #{report._id.slice(-8)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{report.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {report.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Order: #{report.orderId.slice(-8)} •{" "}
                      {format(new Date(report.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="text-primary hover:underline text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-muted-foreground self-center">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-muted disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{selectedReport.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Report #{selectedReport._id.slice(-8)} • Order #
                    {selectedReport.orderId.slice(-8)}
                  </p>
                </div>
                <Badge
                  variant={
                    selectedReport.status === "PENDING"
                      ? "secondary"
                      : selectedReport.status === "DONE"
                      ? "default"
                      : "destructive"
                  }
                >
                  {selectedReport.status}
                </Badge>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm">{selectedReport.description}</p>
              </div>

              {selectedReport.images && selectedReport.images.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Images
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedReport.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="w-20 h-20 rounded-lg object-cover" />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Created
                </p>
                <p className="text-sm">
                  {format(new Date(selectedReport.createdAt), "MMM dd, yyyy HH:mm")}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Admin Note
                </p>
                <textarea
                  value={newNote || selectedReport.adminNote || ""}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm min-h-[80px]"
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

              {selectedReport.status === "PENDING" && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => handleUpdateStatus(selectedReport._id, "DONE")}
                    disabled={statusUpdating}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Mark as Done
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedReport._id, "CANCELLED")}
                    disabled={statusUpdating}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600"
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    Cancel Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}