import { useState } from "react";
import { Flag, CheckCircle, XCircle } from "lucide-react";
import { useReports } from "../../../context/ReportContext";
import { useAuth } from "../../../hooks/useAuth";
import { useNotifications } from "../../context/NotificationContext";
import { toast } from "sonner";

export function StaffReports() {
  const { resolveReport, cannotResolveReport, getReportsByAssignedUser } = useReports();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [resolveModal, setResolveModal] = useState<{ id: string; action: "resolve" | "cannot" } | null>(null);
  const [note, setNote] = useState("");

  const myReports = getReportsByAssignedUser(user?.email || "");

  const handleResolve = () => {
    if (!resolveModal || !note.trim()) return;

    if (resolveModal.action === "resolve") {
      resolveReport(resolveModal.id, note);
      addNotification({
        type: "report_update",
        title: "Report Resolved",
        message: `Report has been resolved. Note: ${note}`,
      });
      toast.success("Report marked as resolved");
    } else {
      cannotResolveReport(resolveModal.id, note);
      toast.success("Report marked as cannot be resolved");
    }
    setResolveModal(null);
    setNote("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl mb-2">My Assigned Reports</h1>
        <p className="text-muted-foreground">Handle reports assigned to you by admin</p>
      </div>

      {myReports.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center border border-border">
          <Flag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="mb-2">No Reports Assigned</h3>
          <p className="text-muted-foreground">When admin assigns you a report, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myReports.map((report) => (
            <div key={report.id} className="bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase text-muted-foreground">{report.targetType.replace("_", " ")}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <h3 className="font-semibold text-sm truncate">{report.targetTitle}</h3>
                  </div>
                  <p className="text-sm"><span className="font-medium">Reason:</span> {report.reason}</p>
                  {report.description && (
                    <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>Reported by: {report.reporterName}</span>
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {report.status === "assigned" && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setResolveModal({ id: report.id, action: "resolve" })}
                    className="flex items-center gap-1.5 text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-full hover:bg-secondary/90 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolved
                  </button>
                  <button
                    onClick={() => setResolveModal({ id: report.id, action: "cannot" })}
                    className="flex items-center gap-1.5 text-sm bg-destructive/10 text-destructive px-4 py-2 rounded-full hover:bg-destructive/20 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Cannot Resolve
                  </button>
                </div>
              )}

              {report.status === "resolved" && (
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <CheckCircle className="w-4 h-4" />
                  Resolved
                </div>
              )}

              {report.status === "cannot_resolve" && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <XCircle className="w-4 h-4" />
                  Cannot resolve
                </div>
              )}

              {report.resolutionNote && (
                <div className="mt-3 p-3 bg-muted/50 rounded-xl">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Note:</p>
                  <p className="text-xs">{report.resolutionNote}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setResolveModal(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-1">
              {resolveModal.action === "resolve" ? "Mark as Resolved" : "Mark as Cannot Resolve"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Add a note about how this was handled.</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe what was done..."
              rows={3}
              className="w-full px-3 py-2.5 bg-input-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setResolveModal(null)} className="flex-1 py-2.5 rounded-full text-sm border border-border hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={!note.trim()}
                className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                  resolveModal.action === "resolve"
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    : "bg-destructive text-white hover:bg-destructive/90"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}