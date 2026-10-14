// ============================================================
// AdminNotifications — route /admin/notifications
// Trang notifications riêng cho Admin, nằm bên trong admin panel.
// Admin nhận TẤT CẢ loại thông báo: đơn hàng (thanh toán / COD / huỷ đơn),
// Support DIY, bài DIY, Report và System.
// Thẻ "Tất cả" chia thành từng phần theo loại; chọn thẻ loại để xem riêng.
// ============================================================

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  CheckCheck,
  Flag,
  Inbox,
  LifeBuoy,
  Layers,
  Scissors,
  Settings,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { useNotifications } from "../../../shared/contexts/NotificationContext";
import {
  NotificationRow,
  NotificationSectionHeader,
} from "../../../shared/components/NotificationRow";
import {
  NOTIFICATION_CATEGORIES,
  getNotificationCategory,
  resolveNotificationPath,
  type Notification,
  type NotificationCategory,
} from "../../../shared/types/notification.types";
import {
  NOTIFICATION_DATE_GROUPS,
  getDateGroup,
} from "../../../lib/notificationTime";
import { AdminPageHeader } from "../../../shared/components/admin/AdminPageHeader";
import { AdminPanel } from "../../../shared/components/admin/AdminPanel";
import {
  AdminStatusTabs,
  useAdminConfirm,
  type AdminTone,
} from "../../../shared/components/admin/AdminDataGrid";

/** How many notifications a section shows before "Xem tất cả" takes over. */
const SECTION_PREVIEW = 5;

const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: LucideIcon; tone: AdminTone }
> = {
  ORDER: { label: "Đơn hàng", icon: ShoppingBag, tone: "blue" },
  REPORT: { label: "Báo cáo", icon: Flag, tone: "amber" },
  SUPPORT: { label: "Support DIY", icon: LifeBuoy, tone: "cyan" },
  DIY: { label: "Bài DIY", icon: Scissors, tone: "violet" },
  SYSTEM: { label: "Hệ thống", icon: Settings, tone: "neutral" },
};

const DATE_GROUP_LABELS: Record<string, string> = {
  Today: "Hôm nay",
  Yesterday: "Hôm qua",
  "This week": "Tuần này",
  Earlier: "Trước đó",
  Older: "Cũ hơn",
};

export function AdminNotifications() {
  const navigate = useNavigate();
  const { confirm, dialog: confirmDialog } = useAdminConfirm();
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
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [notifications],
  );

  /** Counters per category — drive the tabs and the section headers. */
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
    if (category !== "all" && getNotificationCategory(notif.type) !== category)
      return false;
    return filter === "unread" ? !notif.read : true;
  });

  /** Thẻ "Tất cả" (không lọc chưa đọc) → chia thành từng phần theo loại. */
  const isSectionedView = category === "all" && filter === "all";

  const sections = useMemo(
    () =>
      NOTIFICATION_CATEGORIES.map((cat) => ({
        category: cat,
        items: sortedNotifications.filter(
          (n) => getNotificationCategory(n.type) === cat,
        ),
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
    toast.success("Đã đánh dấu tất cả là đã đọc");
  };
  const handleDelete = (notificationId: string) => {
    clearNotification(notificationId);
    toast.success("Đã xoá thông báo");
  };
  const handleDeleteAll = async () => {
    const ok = await confirm({
      title: `Xoá ${notifications.length} thông báo?`,
      description: "Toàn bộ thông báo sẽ bị xoá khỏi danh sách của bạn.",
      confirmLabel: "Xoá tất cả",
      danger: true,
      icon: Trash2,
    });
    if (!ok) return;
    clearAllNotifications();
    toast.success("Đã xoá tất cả thông báo");
  };

  const unreadInScope =
    category === "all" ? unreadCount : (unreadCounts[category] ?? 0);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow="Hộp thư"
        title="Thông báo"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} thông báo chưa đọc — đơn hàng, thanh toán, báo cáo, Support DIY và bài DIY`
            : "Đơn hàng, thanh toán, báo cáo, Support DIY và bài DIY"
        }
        actions={
          <>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="btn-secondary"
              >
                <CheckCheck className="size-4" />
                Đánh dấu đã đọc
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => void handleDeleteAll()}
                className="btn-secondary adm-gbtn-danger"
              >
                <Trash2 className="size-4" />
                Xoá tất cả
              </button>
            )}
            <Link to="/admin/reports" className="btn-secondary">
              <Flag className="size-4" />
              Quản lý báo cáo
            </Link>
          </>
        }
      />

      {notifications.length > 0 && (
        <AdminStatusTabs<"all" | NotificationCategory>
          ariaLabel="Lọc theo loại thông báo"
          value={category}
          onChange={setCategory}
          tabs={[
            {
              value: "all",
              label: "Tất cả",
              icon: Layers,
              count: notifications.length,
            },
            ...NOTIFICATION_CATEGORIES.filter((cat) => categoryCounts[cat]).map(
              (cat) => ({
                value: cat,
                label: CATEGORY_META[cat].label,
                icon: CATEGORY_META[cat].icon,
                tone: CATEGORY_META[cat].tone,
                count: categoryCounts[cat],
              }),
            ),
          ]}
        />
      )}

      <AdminPanel hover={false} className="adm-gpanel">
        <div className="admin-toolbar adm-gtoolbar">
          <div
            className="adm-gseg"
            role="group"
            aria-label="Lọc theo trạng thái đọc"
          >
            <button
              type="button"
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              Tất cả
            </button>
            <button
              type="button"
              aria-pressed={filter === "unread"}
              onClick={() => setFilter("unread")}
            >
              Chưa đọc
              {unreadInScope > 0 && (
                <span className="adm-gseg-count">{unreadInScope}</span>
              )}
            </button>
          </div>
          <span className="adm-gsecondary ml-auto">
            {filteredNotifications.length} thông báo
            {category !== "all" ? ` · ${CATEGORY_META[category].label}` : ""}
          </span>
        </div>

        {notifications.length === 0 ? (
          <div className="admin-empty-state adm-gempty">
            <Inbox size={40} />
            <p>Chưa có thông báo</p>
            <p className="text-sm">
              Đơn hàng, báo cáo và yêu cầu hỗ trợ mới sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="admin-empty-state adm-gempty">
            {filter === "unread" ? (
              <CheckCheck size={40} />
            ) : (
              <CalendarClock size={40} />
            )}
            <p>
              {filter === "unread"
                ? "Đã đọc hết"
                : "Không có thông báo phù hợp"}
            </p>
            <div className="mt-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setFilter("all");
                  setCategory("all");
                }}
              >
                Xem tất cả thông báo
              </button>
            </div>
          </div>
        ) : isSectionedView ? (
          <div className="px-4 py-5 space-y-7">
            {sections.map((section) => {
              const unreadInSection = section.items.filter(
                (n) => !n.read,
              ).length;
              const preview = section.items.slice(0, SECTION_PREVIEW);
              const hidden = section.items.length - preview.length;

              return (
                <section key={section.category}>
                  <NotificationSectionHeader
                    category={section.category}
                    label={CATEGORY_META[section.category].label}
                    newLabel="mới"
                    count={section.items.length}
                    unreadCount={unreadInSection}
                    actionLabel={
                      hidden > 0
                        ? `Xem tất cả (${section.items.length})`
                        : undefined
                    }
                    onAction={
                      hidden > 0
                        ? () => setCategory(section.category)
                        : undefined
                    }
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
                        type="button"
                        onClick={() => setCategory(section.category)}
                        className="w-full rounded-xl border border-dashed border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                      >
                        +{hidden}{" "}
                        {CATEGORY_META[section.category].label.toLowerCase()}{" "}
                        khác
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
                label={CATEGORY_META[category].label}
                newLabel="mới"
                count={filteredNotifications.length}
                unreadCount={unreadCounts[category] ?? 0}
                actionLabel="Xem mọi loại"
                onAction={() => setCategory("all")}
              />
            )}

            {NOTIFICATION_DATE_GROUPS.filter(
              (group) => groupedNotifications[group]?.length,
            ).map((group) => (
              <div key={group} className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
                  {DATE_GROUP_LABELS[group] ?? group}
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
      </AdminPanel>

      {confirmDialog}
    </div>
  );
}
