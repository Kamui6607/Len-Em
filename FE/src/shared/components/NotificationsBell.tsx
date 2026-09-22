import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";
import { NotificationIcon, getNotificationCategoryTint } from "./NotificationIcon";
import { useAuthStore } from "../store/auth.store";
import { cn } from "./ui/utils";
import {
  NOTIFICATION_CATEGORY_LABELS,
  getNotificationCategory,
  isHighPriority,
  resolveNotificationPath,
} from "../types/notification.types";
import { Link } from "react-router";

export function NotificationsBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const role = useAuthStore((s) => s.user?.roleId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-2 text-[var(--color-text)] hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-[var(--destructive)] text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Inbox className="size-8 mx-auto mb-2 opacity-30" />
                No notifications
              </div>
            ) : (
              notifications.slice(0, 20).map((notif) => {
                const path = resolveNotificationPath(notif, role);
                const body = (
                  <>
                    <div className="flex items-center gap-1.5">
                      {isHighPriority(notif.priority) && (
                        <span className="shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-destructive">
                          Urgent
                        </span>
                      )}
                      <p className="text-sm font-medium text-foreground">{notif.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">
                      {notif.message}
                    </p>
                  </>
                );
                return (
                  <div
                    key={notif._id}
                    className={cn(
                      "flex items-start gap-3 p-4 border-b border-border last:border-0 transition-colors",
                      !notif.read && "bg-primary/5",
                    )}
                  >
                    <NotificationIcon type={notif.type} muted={notif.read} />
                    <div className="flex-1 min-w-0">
                      {path ? (
                        <Link
                          to={path}
                          onClick={() => {
                            markAsRead(notif._id);
                            setOpen(false);
                          }}
                          className="block"
                        >
                          {body}
                        </Link>
                      ) : (
                        <>{body}</>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${getNotificationCategoryTint(notif.type)}`}
                        >
                          {NOTIFICATION_CATEGORY_LABELS[getNotificationCategory(notif.type)]}
                        </span>
                        {new Date(notif.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif._id)}
                          className="text-[10px] text-primary hover:underline"
                        >
                          Read
                        </button>
                      )}
                      <button
                        onClick={() => clearNotification(notif._id)}
                        className="text-[10px] text-muted-foreground hover:text-destructive"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Link
            to={role === "admin" ? "/admin/notifications" : "/notifications"}
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-3 text-center text-xs font-medium text-primary hover:bg-muted transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
