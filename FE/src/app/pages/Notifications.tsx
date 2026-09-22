import { useMemo, useState } from "react";
import { ArrowLeft, CheckCheck, Inbox, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useNotifications } from "../../shared/contexts/NotificationContext";
import {
  NotificationRow,
  NotificationSectionHeader,
} from "../../shared/components/NotificationRow";
import { useAuthStore } from "../../shared/store/auth.store";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_LABELS,
  getNotificationCategory,
  resolveNotificationPath,
  type Notification,
  type NotificationCategory,
} from "../../shared/types/notification.types";
import { NOTIFICATION_DATE_GROUPS, getDateGroup } from "../../lib/notificationTime";

/** How many notifications a section shows before "View all" takes over. */
const SECTION_PREVIEW = 4;

export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotifications();
  const role = useAuthStore((s) => s.user?.roleId);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [category, setCategory] = useState<"all" | NotificationCategory>("all");

  /** How many notifications per category — shown on the filter chips. */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const notif of notifications) {
      const key = getNotificationCategory(notif.type);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [notifications]);

  /** Unread per category so the Unread chip can respect the selected tab. */
  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const notif of notifications) {
      if (notif.read) continue;
      const key = getNotificationCategory(notif.type);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [notifications]);

  /** Newest first — keeps the list stable between REST history and socket pushes. */
  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [notifications],
  );

  const filteredNotifications = sortedNotifications.filter((notif) => {
    if (category !== "all" && getNotificationCategory(notif.type) !== category) return false;
    return filter === "unread" ? !notif.read : true;
  });

  /** Tab "All" (no unread filter) → split into one section per notification type. */
  const isSectionedView = category === "all" && filter === "all";

  const sections = useMemo(
    () =>
      NOTIFICATION_CATEGORIES.map((cat) => ({
        category: cat,
        items: sortedNotifications.filter((n) => getNotificationCategory(n.type) === cat),
      })).filter((section) => section.items.length > 0),
    [sortedNotifications],
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

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification._id);
    // Prefer the backend target path; fall back to the route matching its type.
    const path = resolveNotificationPath(notification, role);
    if (path) navigate(path);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success("All notifications marked as read");
  };

  const handleDelete = (notificationId: string) => {
    clearNotification(notificationId);
    toast.success("Notification dismissed");
  };

  const handleDeleteAll = () => {
    clearAllNotifications();
    toast.success("All notifications deleted");
  };

  return (
    <div className="max-w-3xl mx-auto pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
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

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/15 transition-colors"
              >
                <Trash2 className="size-4" />
                Delete all
              </button>
            )}
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
        </div>

        {/* Filter tabs — category (Orders / Reports / Support DIY / DIY / System)
            + Unread toggle, so each kind of notification can be viewed separately */}
        <div className="flex flex-wrap gap-2 px-6 pb-4 border-b border-border">
          <button
            className="chip !h-9 !px-4"
            data-active={category === "all" && filter === "all"}
            onClick={() => {
              setCategory("all");
              setFilter("all");
            }}
          >
            All <span className="opacity-60">{notifications.length}</span>
          </button>

          {NOTIFICATION_CATEGORIES.filter((cat) => categoryCounts[cat]).map((cat) => (
            <button
              key={cat}
              className="chip !h-9 !px-4"
              data-active={category === cat}
              onClick={() => setCategory(category === cat ? "all" : cat)}
            >
              {NOTIFICATION_CATEGORY_LABELS[cat]}
              <span className="opacity-60">{categoryCounts[cat]}</span>
            </button>
          ))}

          <button
            className="chip !h-9 !px-4"
            data-active={filter === "unread"}
            onClick={() => setFilter(filter === "unread" ? "all" : "unread")}
          >
            Unread
            <span className="opacity-60">
              {category === "all" ? unreadCount : (unreadCounts[category] ?? 0)}
            </span>
          </button>
        </div>

        {/* List / empty state */}
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-14 px-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center bg-muted">
              <Inbox className="size-6 text-muted-foreground/60" />
            </div>
            <p className="font-medium text-foreground">
              {filter === "unread"
                ? "No unread notifications"
                : category === "all"
                  ? "Nothing here yet"
                  : `No ${NOTIFICATION_CATEGORY_LABELS[category].toLowerCase()} notifications`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === "unread"
                ? "Switch to All to see everything you've received."
                : category === "all"
                  ? "New notifications will show up here."
                  : "Những thông báo thuộc loại khác vẫn còn ở tab All."}
            </p>
            {(filter === "unread" || category !== "all") && (
              <button
                onClick={() => {
                  setFilter("all");
                  setCategory("all");
                }}
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          isSectionedView ? (
            <div className="px-4 py-4 space-y-7">
              {sections.map((section) => {
                const unreadInSection = section.items.filter((n) => !n.read).length;
                const preview = section.items.slice(0, SECTION_PREVIEW);
                const hidden = section.items.length - preview.length;

                return (
                  <section key={section.category}>
                    {/* Section header — one block per notification type */}
                    <NotificationSectionHeader
                      category={section.category}
                      count={section.items.length}
                      unreadCount={unreadInSection}
                      actionLabel={hidden > 0 ? `View all (${section.items.length})` : undefined}
                      onAction={hidden > 0 ? () => setCategory(section.category) : undefined}
                    />

                    <div className="space-y-1.5">
                      {preview.map((notification, index) => (
                        <NotificationRow
                          key={notification._id}
                          notification={notification}
                          index={index}
                          onClick={handleNotificationClick}
                          onMarkRead={markAsRead}
                          onDelete={handleDelete}
                          showCategory={false}
                        />
                      ))}

                      {hidden > 0 && (
                        <button
                          onClick={() => setCategory(section.category)}
                          className="w-full rounded-xl border border-dashed border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                        >
                          +{hidden} more{" "}
                          {NOTIFICATION_CATEGORY_LABELS[section.category].toLowerCase()}
                        </button>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-4 space-y-6">
              {/* Header of the selected part — with a shortcut back to All */}
              {category !== "all" && (
                <NotificationSectionHeader
                  category={category}
                  count={filteredNotifications.length}
                  unreadCount={unreadCounts[category] ?? 0}
                  actionLabel="Show all"
                  onAction={() => setCategory("all")}
                />
              )}

              {NOTIFICATION_DATE_GROUPS.filter((group) => groupedNotifications[group]?.length).map((group) => (
                <div key={group} className="space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
                    {group}
                  </h2>

                  <div className="space-y-1.5">
                    {groupedNotifications[group].map((notification, index) => (
                      <NotificationRow
                        key={notification._id}
                        notification={notification}
                        index={index}
                        onClick={handleNotificationClick}
                        onMarkRead={markAsRead}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
