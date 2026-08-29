// ============================================================
// AdminNotifications — route /admin/notifications
// Trang notifications riêng cho Admin, nằm bên trong admin panel.
// Admin CHỈ xem/dùng notification Report.
// ============================================================

import { useMemo, useState } from "react";
import { Check, CheckCheck, Flag, Trash2, CalendarClock } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useNotifications } from "../../../shared/contexts/NotificationContext";
import { useHoldToDelete } from "../../../shared/hooks/useHoldToDelete";
import { isReportNotification } from "../../../shared/types/notification.types";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel, AdminPanelBody } from "../../../shared/components/admin/AdminPanel";

function getDateGroup(date: Date): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfWeek) return "This week";
  return "Earlier";
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
}

const GROUP_ORDER = ["Today", "Yesterday", "This week", "Earlier"];

function DeleteButton({
  notificationId,
  onDelete,
}: {
  notificationId: string;
  onDelete: (id: string) => void;
}) {
  const { isHolding, holdProgress, startHold, cancelHold, cancelHoldOnLeave } = useHoldToDelete({
    onDelete: () => onDelete(notificationId),
  });
  return (
    <button
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        startHold();
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        cancelHold();
      }}
      onPointerLeave={() => cancelHoldOnLeave()}
      onContextMenu={(e) => e.preventDefault()}
      className={`admin-action-btn delete relative ${isHolding ? "bg-destructive/20 text-destructive" : ""}`}
      style={{ width: 28, height: 28 }}
      aria-label="Hold to dismiss"
      title="Hold 2s to dismiss"
    >
      <Trash2 className="size-3.5" />
      {isHolding && (
        <svg className="absolute inset-0 -rotate-90" width="28" height="28" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="12" fill="none" stroke="var(--destructive)" strokeWidth="2" strokeLinecap="round" strokeDasharray={`${holdProgress * 75.4} 75.4`} opacity="0.6" />
        </svg>
      )}
    </button>
  );
}

export function AdminNotifications() {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const reportNotifications = useMemo(
    () => notifications.filter((n) => isReportNotification(n.type)),
    [notifications],
  );
  const unreadCount = reportNotifications.filter((n) => !n.read).length;
  const filteredNotifications = reportNotifications.filter((n) =>
    filter === "unread" ? !n.read : true,
  );

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, typeof filteredNotifications> = {};
    for (const notif of filteredNotifications) {
      const group = getDateGroup(new Date(notif.createdAt));
      if (!groups[group]) groups[group] = [];
      groups[group].push(notif);
    }
    return groups;
  }, [filteredNotifications]);

  const handleNotificationClick = (notificationId: string, targetPath?: string) => {
    markAsRead(notificationId);
    if (targetPath) window.location.assign(targetPath);
  };
  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success("All report notifications marked as read");
  };
  const handleDelete = (notificationId: string) => {
    clearNotification(notificationId);
    toast.success("Notification dismissed");
  };
  const handleDeleteAll = () => {
    clearAllNotifications();
    toast.success("All report notifications deleted");
  };

  let cardIndex = 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Report Notifications"
        subtitle="Notifications về Report cho Admin — không nhận các tin nhắn khác"
        actions={
          <>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
              >
                <CheckCheck className="size-4" />
                Mark all read
              </button>
            )}
            {reportNotifications.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/15 transition-colors"
              >
                <Trash2 className="size-4" />
                Delete all
              </button>
            )}
            <Link
              to="/admin/reports"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium bg-card border border-border hover:bg-muted transition-colors"
            >
              <Flag className="size-4" />
              Manage Reports
            </Link>
          </>
        }
      />
      <AdminPanel>
        {/* Filter tabs */}
        <div
          className="flex gap-2 px-6 py-4 border-b"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <button
            className={`chip !h-9 !px-4 ${filter === "all" ? "chip-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({reportNotifications.length})
          </button>
          <button
            className={`chip !h-9 !px-4 ${filter === "unread" ? "chip-active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <AdminPanelBody className="p-0">
          {reportNotifications.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
              >
                <Flag className="size-7" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                No report notifications
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Các báo cáo mới từ người dùng sẽ xuất hiện tại đây
              </p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              <CalendarClock className="size-8 mx-auto mb-2 opacity-30" />
              No report notifications
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {GROUP_ORDER.filter((group) => groupedNotifications[group]?.length).map(
                (group) => (
                  <div key={group} className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
                      {group}
                    </h2>
                    <div className="space-y-1.5">
                      {groupedNotifications[group].map((notification) => {
                        const delay = cardIndex++ * 40;
                        return (
                          <div
                            key={notification._id}
                            onClick={() =>
                              handleNotificationClick(
                                notification._id,
                                notification.targetPath,
                              )
                            }
                            className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors animate-fade-in ${
                              !notification.read
                                ? "bg-primary/5 hover:bg-primary/10"
                                : "hover:bg-muted"
                            }`}
                            style={{ animationDelay: `${delay}ms` }}
                          >
                            {!notification.read && (
                              <span className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-full" />
                            )}
                            <div
                              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ml-1 ${
                                !notification.read
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <Flag className="size-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h3 className="text-sm font-semibold text-foreground">
                                    {notification.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground/60 mt-1.5">
                                    {formatRelativeTime(notification.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                                  {!notification.read && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification._id);
                                      }}
                                      className="admin-action-btn view"
                                      style={{ width: 28, height: 28 }}
                                      aria-label="Mark as read"
                                    >
                                      <Check className="size-3.5" />
                                    </button>
                                  )}
                                  <DeleteButton
                                    notificationId={notification._id}
                                    onDelete={handleDelete}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </AdminPanelBody>
      </AdminPanel>
    </div>
  );
}
