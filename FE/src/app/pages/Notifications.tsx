import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Bell, BellDot, Check, CheckCheck, Inbox, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useNotifications } from "../../shared/contexts/NotificationContext";
import { getNotificationCategoryTint, getNotificationIcon } from "../../shared/components/NotificationIcon";
import { useHoldToDelete } from "../../shared/hooks/useHoldToDelete";
import { useAuthStore } from "../../shared/store/auth.store";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_LABELS,
  getNotificationCategory,
  isHighPriority,
  resolveNotificationPath,
  type Notification,
  type NotificationCategory,
} from "../../shared/types/notification.types";
import { NOTIFICATION_DATE_GROUPS, formatRelativeTime, getDateGroup } from "../../lib/notificationTime";
import "../../styles/craft.css";
import "../../styles/notifications.css";

/** How many notifications a section shows before "View all" takes over. */
const SECTION_PREVIEW = 4;

/** Hold-to-delete (2s) action with a progress ring. */
function DeleteAction({ id, onDelete }: { id: string; onDelete: (id: string) => void }) {
  const { isHolding, holdProgress, startHold, cancelHold, cancelHoldOnLeave } = useHoldToDelete({
    onDelete: () => onDelete(id),
  });
  return (
    <button
      type="button"
      className="ntf-act is-delete"
      data-holding={isHolding}
      onClick={(e) => e.stopPropagation()}
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
      aria-label="Hold to dismiss"
      title="Hold 2s to dismiss"
    >
      <Trash2 className="size-4" />
      {isHolding && (
        <svg className="ntf-ring" width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
          <circle
            cx="17"
            cy="17"
            r="15"
            fill="none"
            stroke="var(--destructive)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${holdProgress * 94.2} 94.2`}
          />
        </svg>
      )}
    </button>
  );
}

function NotificationItem({
  notification,
  showCategory,
  onOpen,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  showCategory: boolean;
  onOpen: (n: Notification) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = getNotificationIcon(notification.type);
  const unread = !notification.read;
  const tint = unread ? getNotificationCategoryTint(notification.type) : "bg-muted text-muted-foreground";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        role="link"
        tabIndex={0}
        onClick={() => onOpen(notification)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(notification);
          }
        }}
        className={`ntf-row${unread ? " is-unread" : ""}`}
      >
        <span className={`ntf-icon ${tint}`} aria-hidden="true">
          <Icon className="size-[18px]" />
        </span>

        <div className="ntf-body">
          <div className="ntf-title-row">
            {unread && <span className="ntf-dot" aria-label="Unread" />}
            {isHighPriority(notification.priority) && <span className="ntf-urgent">Urgent</span>}
            <h3 className="ntf-title">{notification.title}</h3>
          </div>
          <p className="ntf-msg">{notification.message}</p>
          <div className="ntf-meta">
            {showCategory && (
              <span className="craft-tag">
                {NOTIFICATION_CATEGORY_LABELS[getNotificationCategory(notification.type)]}
              </span>
            )}
            <time dateTime={notification.createdAt}>{formatRelativeTime(notification.createdAt)}</time>
          </div>
        </div>

        <div className="ntf-row-actions">
          {unread && (
            <button
              type="button"
              className="ntf-act"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification._id);
              }}
              aria-label="Mark as read"
              title="Mark as read"
            >
              <Check className="size-4" />
            </button>
          )}
          <DeleteAction id={notification._id} onDelete={onDelete} />
        </div>
      </div>
    </motion.li>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotifications();
  const role = useAuthStore((s) => s.user?.roleId);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [category, setCategory] = useState<"all" | NotificationCategory>("all");
  // "Delete all" needs a second click within 3s — it can't be undone.
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  useEffect(() => {
    if (!confirmDeleteAll) return;
    const id = window.setTimeout(() => setConfirmDeleteAll(false), 3000);
    return () => window.clearTimeout(id);
  }, [confirmDeleteAll]);

  /** How many notifications per category — shown on the filter tabs. */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const notif of notifications) {
      const key = getNotificationCategory(notif.type);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [notifications]);

  /** Unread per category so the Unread switch can respect the selected tab. */
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
    if (!confirmDeleteAll) {
      setConfirmDeleteAll(true);
      return;
    }
    setConfirmDeleteAll(false);
    clearAllNotifications();
    toast.success("All notifications deleted");
  };

  const selectCategory = (next: "all" | NotificationCategory) => {
    setCategory(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const tabs: { key: "all" | NotificationCategory; label: string; count: number }[] = [
    { key: "all", label: "All", count: notifications.length },
    ...NOTIFICATION_CATEGORIES.filter((cat) => categoryCounts[cat]).map((cat) => ({
      key: cat,
      label: NOTIFICATION_CATEGORY_LABELS[cat],
      count: categoryCounts[cat],
    })),
  ];
  const visibleUnread = category === "all" ? unreadCount : (unreadCounts[category] ?? 0);

  const itemProps = {
    onOpen: handleNotificationClick,
    onMarkRead: markAsRead,
    onDelete: handleDelete,
  };

  return (
    <div className="ntf-page">
      <div className="ntf-wrap">
        {/* ── Hero ── */}
        <section className="craft-hero craft-rise ntf-hero">
          <div className="ntf-hero-row">
            <div>
              <span className="craft-eyebrow">Hộp thư của bạn</span>
              <h1 className="craft-title">
                Your <em>notifications</em>
              </h1>
              <div className="craft-stitch" aria-hidden="true" />
              <div className="craft-stats">
                <div className="craft-stat">
                  <span className="craft-stat-icon">
                    <BellDot className="size-4" />
                  </span>
                  <div>
                    <p className="craft-stat-num">{unreadCount}</p>
                    <p className="craft-stat-label">{unreadCount > 0 ? "unread" : "all caught up"}</p>
                  </div>
                </div>
                <div className="craft-stat">
                  <span className="craft-stat-icon">
                    <Bell className="size-4" />
                  </span>
                  <div>
                    <p className="craft-stat-num">{notifications.length}</p>
                    <p className="craft-stat-label">total</p>
                  </div>
                </div>
              </div>
            </div>

            {notifications.length > 0 && (
              <div className="ntf-actions">
                {unreadCount > 0 && (
                  <button type="button" onClick={handleMarkAllRead} className="craft-btn">
                    <CheckCheck className="size-4" />
                    Mark all as read
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  className="ntf-btn-danger"
                  data-armed={confirmDeleteAll}
                  aria-live="polite"
                >
                  <Trash2 className="size-4" />
                  {confirmDeleteAll ? "Tap again to delete" : "Delete all"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Filters: category tabs + Unread switch ── */}
        {notifications.length > 0 && (
          <div className="ntf-toolbar">
            <div className="ntf-tabs" role="tablist" aria-label="Notification type">
              {tabs.map((tab) => {
                const active = category === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className="ntf-tab"
                    onClick={() => selectCategory(tab.key)}
                  >
                    {active && (
                      <motion.span
                        layoutId="ntf-tab-patch"
                        className="ntf-tab-patch"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    {tab.label}
                    <span className="ntf-tab-count">{tab.count}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={filter === "unread"}
              className="ntf-switch"
              onClick={() => setFilter(filter === "unread" ? "all" : "unread")}
            >
              <span className="ntf-switch-label">Unread ({visibleUnread})</span>
              <span className="ntf-switch-track" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* ── List / empty state ── */}
        {filteredNotifications.length === 0 ? (
          <div className="craft-empty ntf-empty craft-rise">
            <img src="/mascot.png" alt="" aria-hidden="true" className="ntf-empty-mascot" draggable={false} />
            <p className="craft-empty-title">
              {filter === "unread"
                ? "No unread notifications"
                : category === "all"
                  ? "Nothing here yet"
                  : `No ${NOTIFICATION_CATEGORY_LABELS[category].toLowerCase()} notifications`}
            </p>
            <p className="craft-empty-desc">
              {filter === "unread"
                ? "You're all caught up — switch Unread off to see everything you've received."
                : category === "all"
                  ? "Order updates, replies and news will show up here."
                  : "Những thông báo thuộc loại khác vẫn còn ở tab All."}
            </p>
            {(filter === "unread" || category !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setFilter("all");
                  setCategory("all");
                }}
                className="craft-btn-ghost"
              >
                <Inbox className="size-4" />
                View all notifications
              </button>
            )}
          </div>
        ) : isSectionedView ? (
          <div className="ntf-sections">
            {sections.map((section) => {
              const unreadInSection = section.items.filter((n) => !n.read).length;
              const preview = section.items.slice(0, SECTION_PREVIEW);
              const hidden = section.items.length - preview.length;
              const SectionIcon = getNotificationIcon(section.category);

              return (
                <section key={section.category} className="ntf-card craft-rise">
                  <header className="ntf-card-head">
                    <span className="craft-section-icon">
                      <SectionIcon className="size-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="ntf-card-title">{NOTIFICATION_CATEGORY_LABELS[section.category]}</h2>
                      <p className="ntf-card-sub">
                        {section.items.length} total
                        {unreadInSection > 0 && (
                          <>
                            {" · "}
                            <b>{unreadInSection} new</b>
                          </>
                        )}
                      </p>
                    </div>
                    {hidden > 0 && (
                      <button type="button" className="ntf-link" onClick={() => selectCategory(section.category)}>
                        View all <ArrowRight className="size-3.5" />
                      </button>
                    )}
                  </header>

                  <ul className="ntf-list">
                    <AnimatePresence initial={false}>
                      {preview.map((notification) => (
                        <NotificationItem
                          key={notification._id}
                          notification={notification}
                          showCategory={false}
                          {...itemProps}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>

                  {hidden > 0 && (
                    <button type="button" className="ntf-more" onClick={() => selectCategory(section.category)}>
                      +{hidden} more {NOTIFICATION_CATEGORY_LABELS[section.category].toLowerCase()}
                      <ArrowRight className="size-3.5" />
                    </button>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <div>
            {NOTIFICATION_DATE_GROUPS.filter((group) => groupedNotifications[group]?.length).map((group) => (
              <section key={group} className="ntf-day craft-rise">
                <div className="ntf-day-head">
                  <h2 className="ntf-day-label">{group}</h2>
                  <span className="craft-section-thread" aria-hidden="true" />
                </div>
                <div className="ntf-card">
                  <ul className="ntf-list">
                    <AnimatePresence initial={false}>
                      {groupedNotifications[group].map((notification) => (
                        <NotificationItem
                          key={notification._id}
                          notification={notification}
                          showCategory={category === "all"}
                          {...itemProps}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
