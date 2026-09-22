// ============================================================
// NotificationIcon — small shared badge for notification entries
// (bell dropdown, customer inbox, admin panel).
// ============================================================

import { Bell, Flag, Package, Palette, ShoppingCart, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getNotificationCategory,
  type NotificationCategory,
} from "../types/notification.types";

const CATEGORY_ICONS: Record<NotificationCategory, LucideIcon> = {
  ORDER: ShoppingCart,
  REPORT: Flag,
  SUPPORT: Wrench,
  DIY: Palette,
  SYSTEM: Bell,
};

/** Tailwind classes for the icon tint, per category. */
const CATEGORY_TINTS: Record<NotificationCategory, string> = {
  ORDER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  REPORT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  SUPPORT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  DIY: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  SYSTEM: "bg-muted text-muted-foreground",
};

/** Tint classes for a label pill of the given notification type. */
export function getNotificationCategoryTint(type: string): string {
  return CATEGORY_TINTS[getNotificationCategory(type)] ?? CATEGORY_TINTS.SYSTEM;
}

export function getNotificationIcon(type: string): LucideIcon {
  return CATEGORY_ICONS[getNotificationCategory(type)] ?? Package;
}

interface NotificationIconProps {
  type: string;
  /** Dimmed style for already-read notifications. */
  muted?: boolean;
  className?: string;
}

export function NotificationIcon({ type, muted = false, className = "" }: NotificationIconProps) {
  const category = getNotificationCategory(type);
  const Icon = CATEGORY_ICONS[category] ?? Package;

  return (
    <div
      className={
        className ||
        `shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
          muted ? "bg-muted text-muted-foreground" : CATEGORY_TINTS[category]
        }`
      }
      aria-hidden="true"
    >
      <Icon className="size-4" />
    </div>
  );
}
