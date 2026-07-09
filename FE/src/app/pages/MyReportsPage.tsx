// ============================================================
// MyReportsPage — route /orders/reports
// Customer xem danh sách reports của mình
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Link } from "react-router";
import { ArrowLeft, Search, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { orderReportService } from "../../features/orderReport/services/orderReport.service";
import type { OrderReport } from "../../features/orderReport/types/orderReport.types";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useDebouncedSearch } from "../../hooks/useDebouncedSearch";

const STATUS_OPTIONS = ["", "PENDING", "DONE", "CANCELLED"];

export function MyReportsPage() {
  const [reports, setReports] = useState<OrderReport[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const { inputValue, setInputValue } = useDebouncedSearch({ delay: 400, minChars: 0 });

  // Detail modal state
  const [selectedReport, setSelectedReport] = useState<OrderReport | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await orderReportService.getMyReports({
        page,
        limit: 10,
      });
      setReports(data.data.reports);
      setTotalPages(data.data.totalPages);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdate = async () => {
    if (!selectedReport || !editTitle.trim() || !editDescription.trim()) return;
    setUpdating(true);
    try {
      await orderReportService.update(selectedReport._id, {
        title: editTitle,
        description: editDescription,
      });
      toast.success("Report updated successfully");
      setShowEditModal(false);
      setSelectedReport(null);
      fetchReports();
    } catch {
      toast.error("Failed to update report");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      await orderReportService.delete(id);
      toast.success("Report deleted");
      fetchReports();
    } catch {
      toast.error("Failed to delete report");
    }
  };

  const openEditModal = (report: OrderReport) => {
    setEditTitle(report.title);
    setEditDescription(report.description);
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            to="/orders/my"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
          <h1 className="text-2xl font-bold">My Reports</h1>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title..."
              className="pl-9"
            />
          </div>
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

        {/* Reports List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No reports found.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report._id}
                  className="rounded-2xl border border-border bg-card p-5"
                >
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
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {report.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(report)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(report._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-sm text-muted-foreground self-center">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

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
                      <img
                        key={i}
                        src={img}
                        alt=""
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.adminNote && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Admin Note
                  </p>
                  <p className="text-sm">{selectedReport.adminNote}</p>
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
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold">Edit Report</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Title
                </label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Report title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Report description"
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-full text-sm border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updating || !editTitle.trim() || !editDescription.trim()}
                  className="flex-1 py-2.5 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}