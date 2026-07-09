import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router";
import { orderReportService } from "../../features/orderReport/services/orderReport.service";
import type { ReportTargetType } from "../../types/report.types";

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  className?: string;
}

export function ReportButton({ targetType, targetId, targetTitle, className = "" }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    if (!description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    setSubmitting(true);
    try {
      // For purchased orders, use the real OrderReport API
      if (targetType === "purchased_order") {
        await orderReportService.create({
          orderId: targetId,
          title: `Report for ${targetTitle}`,
          description: description.trim(),
        });
      } else {
        // For DIY posts, use the real OrderReport API with the post ID
        await orderReportService.create({
          orderId: targetId,
          title: `Report for ${targetTitle}`,
          description: description.trim(),
        });
      }

      toast.success("Report submitted. Our team will review it.");
      setOpen(false);
      setDescription("");
    } catch {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
                <label className="block text-sm font-medium mb-1.5">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us what's wrong with this item..."
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
                  disabled={submitting || !description.trim()}
                  className="flex-1 py-2.5 rounded-full text-sm font-medium bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
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