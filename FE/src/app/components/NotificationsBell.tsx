import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { cn } from "./ui/utils";
import { Link } from "react-router";

export function NotificationsBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
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
          <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
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
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Bell className="size-8 mx-auto mb-2 opacity-30" />
                No notifications
              </div>
            ) : (
              notifications.slice(0, 20).map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "flex items-start gap-3 p-4 border-b border-border last:border-0 transition-colors",
                    !notif.read && "bg-primary/5"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    {notif.targetPath ? (
                      <Link
                        to={notif.targetPath}
                        onClick={() => { markAsRead(notif.id); setOpen(false); }}
                        className="block"
                      >
                        <p className="text-sm font-medium text-foreground">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                      </Link>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-foreground">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                      </>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Read
                      </button>
                    )}
                    <button
                      onClick={() => clearNotification(notif.id)}
                      className="text-[10px] text-muted-foreground hover:text-destructive"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}