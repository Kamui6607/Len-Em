import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { useReports } from "../../context/ReportContext";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate } from "react-router";
import type { ReportTargetType } from "../../types/report.types";

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  className?: string;
}

export function ReportButton({ targetType, targetId, targetTitle, className = "" }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { createReport } = useReports();
  const { addNotification } = useNotifications();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please select a reason");
      return;
    }

    createReport({
      targetType,
      targetId,
      targetTitle,
      reason: reason.trim(),
      description: description.trim(),
      reporterId: user?.email || "unknown",
      reporterName: user?.fullName || "Unknown User",
    });

    addNotification({
      type: "report_update",
      title: "Report Submitted",
      message: `Your report on "${targetTitle}" has been submitted for review.`,
    });

    toast.success("Report submitted. Our team will review it.");
    setOpen(false);
    setReason("");
    setDescription("");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors ${className}`}
        aria-label="Report"
      >
        <Flag className="size-3.5" />
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold">Report Content</h3>
              <p className="text-xs text-muted-foreground mt-1">Reporting: {targetTitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Reason *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  aria-label="Report reason"
                  className="w-full px-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a reason...</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="spam">Spam</option>
                  <option value="misleading">Misleading or false information</option>
                  <option value="copyright">Copyright violation</option>
                  <option value="harassment">Harassment or hate speech</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide more details..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-full text-sm font-medium border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full text-sm font-medium bg-destructive text-white hover:bg-destructive/90 transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}