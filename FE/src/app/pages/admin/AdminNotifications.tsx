// ============================================================
// AdminNotifications — route /admin/notifications
// Trang notifications riêng cho Admin, nằm bên trong admin panel.
// Admin nhận TẤT CẢ loại thông báo: đơn hàng (thanh toán / COD / huỷ đơn),
// Support DIY, bài DIY, Report và System.
// Tab "All" chia thành từng phần theo loại; chọn chip để xem riêng 1 phần.
// ============================================================

import { useMemo, useState } from "react";
import { CalendarClock, CheckCheck, Flag, Inbox, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { useNotifications } from "../../../shared/contexts/NotificationContext";
import {
  NotificationRow,
  NotificationSectionHeader,
} from "../../../shared/components/NotificationRow";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_LABELS,
  getNotificationCategory,
  resolveNotificationPath,
  type Notification,
  type NotificationCategory,
} from "../../../shared/types/notification.types";
import { NOTIFICATION_DATE_GROUPS, getDateGroup } from "../../../lib/notificationTime";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel, AdminPanelBody } from "../../../shared/components/admin/AdminPanel";

/** How many notifications a section shows before "View all" takes over. */
const SECTION_PREVIEW = 5;

export function AdminNotifications() {
  const navigate = useNavigate();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications();

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [category, setCategory] = useState<"all" | NotificationCategory>("all");

  /** Newest first — REST history and socket pushes must render consistently. */
  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [notifications],
  );

  /** Counters per category — drive the filter chips and the section headers. */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const notif of sortedNotifications) {
      const key = getNotificationCategory(notif.type);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [sortedNotifications]);

  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const notif of sortedNotifications) {
      if (notif.read) continue;
      const key = getNotificationCategory(notif.type);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [sortedNotifications]);

  const unreadCount = sortedNotifications.filter((n) => !n.read).length;
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
    const path = resolveNotificationPath(notification, "admin");
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
    <div className="space-y-6">
      <AdminPageHeader
        title="Notifications"
        subtitle="Thông báo cho Admin — đơn hàng, thanh toán, Report, Support DIY và bài DIY"
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
            {notifications.length > 0 && (
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
        {/* Filter tabs — category (one part per notification type) + Unread */}
        <div
          className="flex flex-wrap gap-2 px-6 py-4 border-b"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <button
            className="chip !h-9 !px-4"
            data-active={category === "all" && filter === "all"}
            onClick={() => {
              setCategory("all");
              setFilter("all");
            }}
          >
            All ({notifications.length})
          </button>
          {NOTIFICATION_CATEGORIES.filter((cat) => categoryCounts[cat]).map((cat) => (
            <button
              key={cat}
              className="chip !h-9 !px-4"
              data-active={category === cat}
              onClick={() => setCategory(category === cat ? "all" : cat)}
            >
              {NOTIFICATION_CATEGORY_LABELS[cat]} ({categoryCounts[cat]})
            </button>
          ))}
          <button
            className="chip !h-9 !px-4"
            data-active={filter === "unread"}
            onClick={() => setFilter(filter === "unread" ? "all" : "unread")}
          >
            Unread ({category === "all" ? unreadCount : (unreadCounts[category] ?? 0)})
          </button>
        </div>

        <AdminPanelBody className="p-0">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
              >
                <Inbox className="size-7" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No notifications</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Đơn hàng, báo cáo và yêu cầu hỗ trợ mới sẽ xuất hiện tại đây
              </p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              <CalendarClock className="size-8 mx-auto mb-2 opacity-30" />
              No notifications match this filter
            </div>
          ) : isSectionedView ? (
            <div className="px-4 py-5 space-y-7">
              {sections.map((section) => {
                const unreadInSection = section.items.filter((n) => !n.read).length;
                const preview = section.items.slice(0, SECTION_PREVIEW);
                const hidden = section.items.length - preview.length;

                return (
                  <section key={section.category}>
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
            <div className="px-4 py-5 space-y-6">
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

              {NOTIFICATION_DATE_GROUPS.filter(
                (group) => groupedNotifications[group]?.length,
              ).map((group) => (
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
          )}
        </AdminPanelBody>
      </AdminPanel>
    </div>
  );
}
