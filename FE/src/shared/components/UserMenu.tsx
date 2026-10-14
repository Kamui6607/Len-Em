import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Flag,
  Heart,
  LogOut,
  MapPin,
  MessageCircleQuestion,
  Package,
  Shield,
  User,
  Users as UsersIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../hooks/useAuth";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useNotifications } from "../contexts/NotificationContext";
import { resolveAvatarUrl } from "../../lib/avatarUrl";
import { UserMenuSheet } from "./UserMenuSheet";
import { Counter } from "./navigation/shared";
import "../../styles/user-menu.css";

interface UserMenuProps {
  position?: "top" | "bottom";
  variant?: "navbar" | "sidebar";
  onProfileClick?: () => void;
  /** Text under the avatar — used when the menu sits in the mobile bottom nav. */
  label?: string;
  /** Bottom-nav tab only: the current page belongs to this tab. */
  current?: boolean;
  /** Bottom-nav tab only: the shared sliding active pill. */
  activeIndicator?: ReactNode;
}

type MenuEntry = {
  key: string;
  label: string;
  icon: LucideIcon;
  to?: string;
  onSelect?: () => void;
  count?: number;
};

const PANEL_WIDTH = 300;
const GAP = 10;
const MARGIN = 12;

export function UserMenu({
  position = "top",
  variant = "navbar",
  onProfileClick,
  label,
  current = false,
  activeIndicator,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  // URL of an avatar image that failed to load (→ show initials instead).
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ left: number; top?: number; bottom?: number }>({
    left: MARGIN,
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // From the mobile bottom nav the menu opens as a bottom sheet.
  const isSheet = isMobile && variant === "navbar" && position === "bottom";

  const close = useCallback((restoreFocus = false) => {
    setIsOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  const updateCoords = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const preferredLeft = variant === "sidebar" ? rect.left : rect.right - PANEL_WIDTH;
    const left = Math.min(
      Math.max(preferredLeft, MARGIN),
      window.innerWidth - PANEL_WIDTH - MARGIN,
    );
    setCoords(
      position === "top"
        ? { left, top: rect.bottom + GAP }
        : { left, bottom: window.innerHeight - rect.top + GAP },
    );
  }, [position, variant]);

  // Close when clicking anywhere outside the trigger and the panel.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isOpen]);

  // Keep the popover attached to its trigger while open.
  useEffect(() => {
    if (!isOpen || isSheet) return;
    updateCoords();
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [isOpen, isSheet, updateCoords]);

  // Move focus into the menu when it opens (keyboard + screen readers).
  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('[data-autofocus], [role="menuitem"]')
        ?.focus();
    }, 30);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  // Navigating anywhere closes the menu.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const isAdmin = user.roleId === "admin";
  const isStaff = user.roleId === "staff";
  const isDashboardUser = isAdmin || isStaff;

  // Admin có trang notifications riêng trong admin panel (nhận mọi loại thông báo),
  // KHÔNG chuyển sang trang notifications của user.
  const notificationsPath = isAdmin ? "/admin/notifications" : "/notifications";

  const roleLabel = isAdmin ? "Administrator" : isStaff ? "Staff member" : "Member";
  const roleLabelVi = isAdmin ? "Quản trị viên" : isStaff ? "Nhân viên" : "Thành viên";
  const RoleIcon = isAdmin ? Shield : isStaff ? UsersIcon : User;

  // First + last initial ("Nguyễn Văn An" → "NA"); Vietnamese given name is the last word.
  const nameParts = user.fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials =
    (nameParts.length > 1
      ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
      : nameParts[0]?.slice(0, 2) ?? "?"
    ).toUpperCase();
  const firstName = nameParts[nameParts.length - 1] || user.username;

  const handleLogout = () => {
    signOut();
    setIsOpen(false);
    navigate("/auth/login", { replace: true });
  };

  const profileEntry: MenuEntry =
    isDashboardUser && variant === "sidebar"
      ? { key: "profile", label: "My profile", icon: User, onSelect: onProfileClick }
      : { key: "profile", label: "My profile", icon: User, to: "/profile" };

  const groups: { label?: string; items: MenuEntry[] }[] = isDashboardUser
    ? [
        {
          items: [
            { key: "notif", label: "Notifications", icon: Bell, to: notificationsPath, count: unreadCount },
            profileEntry,
          ],
        },
      ]
    : [
        {
          label: "Tài khoản",
          items: [
            { key: "notif", label: "Notifications", icon: Bell, to: notificationsPath, count: unreadCount },
            profileEntry,
            { key: "addresses", label: "Addresses", icon: MapPin, to: "/addresses" },
          ],
        },
        {
          label: "Mua sắm",
          items: [
            { key: "orders", label: "Purchased orders", icon: Package, to: "/purchased" },
            { key: "love", label: "Favorites", icon: Heart, to: "/love" },
            { key: "reports", label: "My reports", icon: Flag, to: "/orders/reports" },
          ],
        },
      ];

  // Arrow keys move between items; Escape/Tab close and return focus.
  const onPanelKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "Tab") {
      close(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  // Broken or missing photo → initials on the purple avatar.
  const avatarSrc = resolveAvatarUrl(user.avatar);
  const avatar = (
    <span className="um-avatar" data-role={user.roleId} aria-hidden="true">
      {avatarSrc && failedAvatar !== avatarSrc ? (
        <img src={avatarSrc} alt="" onError={() => setFailedAvatar(avatarSrc)} />
      ) : (
        initials
      )}
    </span>
  );

  const renderEntry = (entry: MenuEntry) => {
    const Icon = entry.icon;
    const content = (
      <>
        <span className="um-item-icon">
          <Icon className="size-4" />
        </span>
        <span className="um-item-label">{entry.label}</span>
        {entry.count ? (
          <span className="um-count" aria-label={`${entry.count} unread`}>
            {entry.count > 99 ? "99+" : entry.count}
          </span>
        ) : (
          <ChevronRight className="um-item-chev size-4" aria-hidden="true" />
        )}
      </>
    );
    return entry.to ? (
      <Link
        key={entry.key}
        to={entry.to}
        role="menuitem"
        tabIndex={-1}
        className="um-item"
        onClick={() => setIsOpen(false)}
      >
        {content}
      </Link>
    ) : (
      <button
        key={entry.key}
        type="button"
        role="menuitem"
        tabIndex={-1}
        className="um-item"
        onClick={() => {
          setIsOpen(false);
          entry.onSelect?.();
        }}
      >
        {content}
      </button>
    );
  };

  const panelMotion = {
    initial: { opacity: 0, y: position === "top" ? -8 : 8, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: position === "top" ? -8 : 8, scale: 0.96 },
  };

  const panel = (
    <AnimatePresence>
      {isOpen && isSheet && (
        <UserMenuSheet
          panelRef={panelRef}
          avatar={avatar}
          firstName={firstName}
          fullName={user.fullName}
          email={user.email}
          roleLabel={roleLabelVi}
          roleIcon={RoleIcon}
          isDashboardUser={isDashboardUser}
          notificationsPath={notificationsPath}
          unreadCount={unreadCount}
          onClose={() => close(true)}
          onLogout={handleLogout}
        />
      )}
      {isOpen && !isSheet && (
        <>
          <motion.div
            key="um-panel"
            ref={panelRef}
            id="user-menu-panel"
            role="menu"
            aria-label="Account menu"
            onKeyDown={onPanelKeyDown}
            className="um-panel"
            style={{
              left: coords.left,
              top: coords.top,
              bottom: coords.bottom,
              transformOrigin: position === "top" ? "top right" : "bottom left",
            }}
            {...panelMotion}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >

            {/* ── Who's signed in ── */}
            <div className="um-head">
              <div className="flex items-center gap-3.5">
                {avatar}
                <div className="min-w-0 flex-1">
                  <p className="um-hello">Xin chào, {firstName}!</p>
                  <p className="um-name">{user.fullName}</p>
                  <p className="um-email">{user.email}</p>
                </div>
              </div>
              <span className="um-role">
                <RoleIcon className="size-3" />
                {roleLabel}
              </span>
            </div>

            {/* ── Links ── */}
            <div className="um-list">
              {groups.map((group, i) => (
                <div key={group.label ?? i} role="group" aria-label={group.label}>
                  {group.label && (
                    <p className="um-group-label" aria-hidden="true">
                      {group.label}
                    </p>
                  )}
                  {group.items.map(renderEntry)}
                </div>
              ))}

              <div className="um-sep" role="separator" />

              <button type="button" role="menuitem" tabIndex={-1} className="um-item is-danger" onClick={handleLogout}>
                <span className="um-item-icon">
                  <LogOut className="size-4" />
                </span>
                <span className="um-item-label font-semibold">Sign out</span>
              </button>
            </div>

            {!isDashboardUser && (
              <Link to="/chatbot" role="menuitem" tabIndex={-1} className="um-foot" onClick={() => setIsOpen(false)}>
                <MessageCircleQuestion className="size-4" />
                Cần giúp? Hỏi trợ lý Len&amp;Em
              </Link>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const toggle = () => {
    if (!isOpen && !isSheet) updateCoords();
    setIsOpen((open) => !open);
  };

  const onTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !isOpen) {
      e.preventDefault();
      toggle();
    }
  };

  const triggerProps = {
    ref: buttonRef,
    type: "button" as const,
    onClick: toggle,
    onKeyDown: onTriggerKeyDown,
    "aria-haspopup": "menu" as const,
    "aria-expanded": isOpen,
    "aria-controls": isOpen ? "user-menu-panel" : undefined,
  };

  const badge =
    unreadCount > 0 ? (
      <span className="um-badge" aria-hidden="true">
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    ) : null;

  return (
    <div className={variant === "sidebar" || label ? "relative w-full" : "relative"} ref={menuRef}>
      {variant === "sidebar" ? (
        <button {...triggerProps} className="um-trigger is-sidebar">
          {avatar}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold leading-tight text-foreground">
              {user.fullName}
            </span>
            <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted-foreground">
              {roleLabel}
            </span>
          </span>
          <ChevronDown
            className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      ) : label ? (
        <button
          {...triggerProps}
          className="um-trigger is-tab"
          aria-current={current ? "page" : undefined}
          aria-label={
            unreadCount > 0 ? `${label}, ${unreadCount} thông báo chưa đọc` : label
          }
        >
          {activeIndicator}
          {/* Same badge as the header cart: unread notifications */}
          <span className="relative flex">
            {avatar}
            {unreadCount > 0 && (
              <Counter className="um-tab-badge">{unreadCount > 99 ? "99+" : unreadCount}</Counter>
            )}
          </span>
          <span>{label}</span>
        </button>
      ) : (
        <button {...triggerProps} className="um-trigger" aria-label={`Account menu for ${user.fullName}`}>
          {avatar}
          {badge}
        </button>
      )}

      {typeof document !== "undefined" && createPortal(panel, document.body)}
    </div>
  );
}
