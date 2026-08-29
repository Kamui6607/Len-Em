import { Activity } from "lucide-react";
import { useAdmin } from "../../../shared/contexts/AdminContext";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel, AdminPanelHeader, AdminPanelBody } from "../../../shared/components/admin/AdminPanel";

export function AdminActivity() {
  const { activities } = useAdmin();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Activity Logs"
        subtitle="Nhật ký hoạt động gần đây của hệ thống"
      />

      <AdminPanel>
        <AdminPanelHeader icon={<Activity className="w-4.5 h-4.5" />} title="Activity Logs" />
        <AdminPanelBody>
          {activities.length > 0 ? (
            <ul className="space-y-4">
              {activities.slice(0, 50).map((a) => (
                <li key={a.id} className="admin-activity-item flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                  <span
                    className="admin-activity-dot mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ background: "var(--primary)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{a.description}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.userName} • {new Date(a.timestamp).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có hoạt động nào được ghi nhận.
            </p>
          )}
        </AdminPanelBody>
      </AdminPanel>
    </div>
  );
}