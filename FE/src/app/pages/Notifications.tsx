import { useMemo, useState } from "react";
import { ArrowLeft, Check, CheckCheck, Inbox, Bell, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useNotifications } from "../context/NotificationContext";
import { useHoldToDelete } from "../../hooks/useHoldToDelete";

function getDateGroup(date: Date): "Today" | "Yesterday" | "This week" | "Earlier" {
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

const GROUP_ORDER = ["Today", "Yesterday", "This week", "Earlier"] as const;

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
      onPointerLeave={() => {
        cancelHoldOnLeave();
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={`admin-action-btn delete relative ${
        isHolding ? "bg-destructive/20 text-destructive" : ""
      }`}
      style={{ width: 28, height: 28 }}
      aria-label="Hold to dismiss"
      title="Hold 2s to dismiss"
    >
      <Trash2 className="size-3.5" />
      {/* Circular progress ring */}
      {isHolding && (
        <svg
          className="absolute inset-0 -rotate-90"
          width="28"
          height="28"
          viewBox="0 0 28 28"
        >
          <circle
            cx="14"
            cy="14"
            r="12"
            fill="none"
            stroke="var(--destructive)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${holdProgress * 75.4} 75.4`}
            opacity="0.6"
          />
        </svg>
      )}
    </button>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = notifications.filter((notif) => (filter === "unread" ? !notif.read : true));

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
    if (targetPath) navigate(targetPath);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success("All notifications marked as read");
  };

  const handleDelete = (notificationId: string) => {
    clearNotification(notificationId);
    toast.success("Notification dismissed");
  };

  let cardIndex = 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button sits outside the panel */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      {/* One unified panel — header, filters, and list all share these edges */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4 flex-wrap px-6 py-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
            >
              <CheckCheck className="size-4" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter tabs — fixed height, share the panel's left edge, own border below */}
        <div className="flex gap-2 px-6 pb-4 border-b border-border">
          <button
            className="chip !h-9 !px-4"
            data-active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All <span className="opacity-60">{notifications.length}</span>
          </button>
          <button
            className="chip !h-9 !px-4"
            data-active={filter === "unread"}
            onClick={() => setFilter("unread")}
          >
            Unread <span className="opacity-60">{unreadCount}</span>
          </button>
        </div>

        {/* List / empty state */}
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-14 px-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center bg-muted">
              <Inbox className="size-6 text-muted-foreground/60" />
            </div>
            <p className="font-medium text-foreground">
              {filter === "unread" ? "No unread notifications" : "Nothing here yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === "unread"
                ? "Switch to All to see everything you've received."
                : "New notifications will show up here."}
            </p>
            {filter === "unread" && (
              <button
                onClick={() => setFilter("all")}
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          <div className="px-4 py-4 space-y-6">
            {GROUP_ORDER.filter((group) => groupedNotifications[group]?.length).map((group) => (
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
                        onClick={() => handleNotificationClick(notification._id, notification.targetPath)}
                        className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors animate-fade-in ${
                          !notification.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted"
                        }`}
                        style={{ animationDelay: `${delay}ms` }}
                      >
                        {!notification.read && (
                          <span className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-full" />
                        )}

                        <div
                          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ml-1 ${
                            !notification.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Bell className="size-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-foreground">{notification.title}</h3>
                              <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
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
                                  title="Mark as read"
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}