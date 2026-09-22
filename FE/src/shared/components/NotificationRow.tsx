// ============================================================
// NotificationRow — shared presentational pieces for every
// notification list (customer inbox + admin notifications).
//   · NotificationDeleteButton  — hold 2s to delete
//   · NotificationRow           — one notification entry
//   · NotificationSectionHeader — header of a notification-type section
// ============================================================

import { Check, Trash2 } from "lucide-react";
import { useHoldToDelete } from "../hooks/useHoldToDelete";
import { NotificationIcon, getNotificationCategoryTint } from "./NotificationIcon";
import { formatRelativeTime } from "../../lib/notificationTime";
import {
  NOTIFICATION_CATEGORY_LABELS,
  getNotificationCategory,
  isHighPriority,
  type Notification,
  type NotificationCategory,
} from "../types/notification.types";

/** Hold-to-delete button (2s) with a circular progress ring. */
export function NotificationDeleteButton({
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
      className={`admin-action-btn delete relative ${
        isHolding ? "bg-destructive/20 text-destructive" : ""
      }`}
      style={{ width: 28, height: 28 }}
      aria-label="Hold to dismiss"
      title="Hold 2s to dismiss"
    >
      <Trash2 className="size-3.5" />
      {isHolding && (
        <svg className="absolute inset-0 -rotate-90" width="28" height="28" viewBox="0 0 28 28">
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

interface NotificationRowProps {
  notification: Notification;
  /** Position in the list — drives the staggered fade-in delay. */
  index: number;
  onClick: (notification: Notification) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  /** Hide the type pill when the row already sits inside a type section. */
  showCategory?: boolean;
}

/** One notification entry — click to open, actions visible on hover (desktop). */
export function NotificationRow({
  notification,
  index,
  onClick,
  onMarkRead,
  onDelete,
  showCategory = true,
}: NotificationRowProps) {
  return (
    <div
      onClick={() => onClick(notification)}
      className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors animate-fade-in ${
        !notification.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted"
      }`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {!notification.read && (
        <span className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-full" />
      )}

      <NotificationIcon
        type={notification.type}
        muted={notification.read}
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center ml-1"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isHighPriority(notification.priority) && (
                <span className="shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                  Urgent
                </span>
              )}
              <h3 className="text-sm font-semibold text-foreground">{notification.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1.5 flex items-center gap-2">
              {showCategory && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getNotificationCategoryTint(notification.type)}`}
                >
                  {NOTIFICATION_CATEGORY_LABELS[getNotificationCategory(notification.type)]}
                </span>
              )}
              {formatRelativeTime(notification.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
            {!notification.read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification._id);
                }}
                className="admin-action-btn view"
                style={{ width: 28, height: 28 }}
                aria-label="Mark as read"
                title="Mark as read"
              >
                <Check className="size-3.5" />
              </button>
            )}
            <NotificationDeleteButton notificationId={notification._id} onDelete={onDelete} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface NotificationSectionHeaderProps {
  category: NotificationCategory;
  count: number;
  unreadCount?: number;
  /** Right-hand action label (e.g. "View all (7)" or "Show all"). */
  actionLabel?: string;
  onAction?: () => void;
}

/** Header of one notification-type section (icon + name + counters). */
export function NotificationSectionHeader({
  category,
  count,
  unreadCount = 0,
  actionLabel,
  onAction,
}: NotificationSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-2 mb-2">
      <div className="flex items-center gap-2 min-w-0">
        <NotificationIcon
          type={category}
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
        />
        <h2 className="text-sm font-semibold text-foreground truncate">
          {NOTIFICATION_CATEGORY_LABELS[category]}
        </h2>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {count}
        </span>
        {unreadCount > 0 && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {unreadCount} new
          </span>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
