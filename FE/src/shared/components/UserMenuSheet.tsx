import { useEffect, type ReactNode, type RefObject } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "react-router";
import { motion, useDragControls, type PanInfo } from "motion/react";
import {
  Bell,
  ChevronRight,
  Flag,
  Heart,
  LogOut,
  MapPin,
  MessageCircleQuestion,
  Moon,
  Package,
  PenLine,
  User,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useFavorites } from "../contexts/FavoritesContext";

interface UserMenuSheetProps {
  panelRef: RefObject<HTMLDivElement>;
  avatar: ReactNode;
  firstName: string;
  fullName: string;
  email: string;
  roleLabel: string;
  roleIcon: LucideIcon;
  isDashboardUser: boolean;
  notificationsPath: string;
  unreadCount: number;
  onClose: () => void;
  onLogout: () => void;
}

type Row = {
  key: string;
  label: string;
  icon: LucideIcon;
  to: string;
  count?: number;
};

const formatCount = (n: number) => (n > 99 ? "99+" : String(n));

/**
 * Mobile account sheet (opened from the "Tài khoản" tab).
 * Profile card → quick tiles (orders / favorites / notifications) → grouped
 * rows → settings → help → sign out. Drag the top area down to dismiss.
 */
export function UserMenuSheet({
  panelRef,
  avatar,
  firstName,
  fullName,
  email,
  roleLabel,
  roleIcon: RoleIcon,
  isDashboardUser,
  notificationsPath,
  unreadCount,
  onClose,
  onLogout,
}: UserMenuSheetProps) {
  const dragControls = useDragControls();
  const { favorites, favoriteKits } = useFavorites();
  const favoriteCount = favorites.length + favoriteKits.length;

  // The page behind must not scroll while the sheet is up.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  const startDrag = (e: ReactPointerEvent) => {
    // Let buttons/links inside the header keep their own taps.
    if ((e.target as HTMLElement).closest("a, button, input, label")) return;
    dragControls.start(e);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const tiles: Row[] = [
    { key: "orders", label: "Đơn hàng", icon: Package, to: "/purchased" },
    {
      key: "love",
      label: "Yêu thích",
      icon: Heart,
      to: "/love",
      count: favoriteCount,
    },
    {
      key: "notif",
      label: "Thông báo",
      icon: Bell,
      to: notificationsPath,
      count: unreadCount,
    },
  ];

  const accountRows: Row[] = isDashboardUser
    ? [
        {
          key: "notif",
          label: "Thông báo",
          icon: Bell,
          to: notificationsPath,
          count: unreadCount,
        },
        { key: "profile", label: "Hồ sơ của tôi", icon: User, to: "/profile" },
      ]
    : [
        { key: "profile", label: "Hồ sơ của tôi", icon: User, to: "/profile" },
        {
          key: "addresses",
          label: "Địa chỉ giao hàng",
          icon: MapPin,
          to: "/addresses",
        },
        {
          key: "reports",
          label: "Báo cáo của tôi",
          icon: Flag,
          to: "/orders/reports",
        },
      ];

  const renderRow = (row: Row) => {
    const Icon = row.icon;
    return (
      <Link key={row.key} to={row.to} className="ums-row" onClick={onClose}>
        <span className="ums-row-icon" aria-hidden="true">
          <Icon className="size-[18px]" />
        </span>
        <span className="ums-row-label">{row.label}</span>
        {row.count ? (
          <span className="ums-count" aria-label={`${row.count} chưa đọc`}>
            {formatCount(row.count)}
          </span>
        ) : null}
        <ChevronRight className="ums-chev" aria-hidden="true" />
      </Link>
    );
  };

  return (
    <>
      <motion.div
        key="um-backdrop"
        className="um-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        key="um-sheet"
        ref={panelRef}
        id="user-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Tài khoản"
        className="ums"
        onKeyDown={onKeyDown}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={onDragEnd}
      >
        {/* ── Profile (also the drag handle) ── */}
        <div className="ums-top" onPointerDown={startDrag}>
          <div className="ums-grabber" aria-hidden="true" />
          <div className="ums-hero">
            <button
              type="button"
              className="ums-close"
              onClick={onClose}
              aria-label="Đóng"
              data-autofocus
            >
              <X className="size-[18px]" />
            </button>

            <div className="ums-profile">
              <span className="ums-avatar">{avatar}</span>
              <div className="min-w-0 flex-1">
                <p className="um-hello">Xin chào, {firstName}!</p>
                <p className="ums-name">{fullName}</p>
                <p className="ums-email">{email}</p>
              </div>
            </div>
            <div className="ums-profile-foot">
              <span className="um-role !mt-0">
                <RoleIcon className="size-3" aria-hidden="true" />
                {roleLabel}
              </span>
              <Link to="/profile" className="ums-edit" onClick={onClose}>
                <PenLine className="size-3.5" aria-hidden="true" />
                Sửa hồ sơ
              </Link>
            </div>
          </div>
        </div>

        <div className="ums-body">
          {/* ── Quick tiles ── */}
          {!isDashboardUser && (
            <nav className="ums-tiles" aria-label="Lối tắt">
              {tiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <Link
                    key={tile.key}
                    to={tile.to}
                    className="ums-tile"
                    onClick={onClose}
                    aria-label={
                      tile.count ? `${tile.label}, ${tile.count}` : tile.label
                    }
                  >
                    <span className="ums-tile-icon" aria-hidden="true">
                      <Icon className="size-5" />
                      {tile.count ? (
                        <span className="ums-tile-badge">
                          {formatCount(tile.count)}
                        </span>
                      ) : null}
                    </span>
                    <span>{tile.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* ── Account ── */}
          <section aria-labelledby="ums-account">
            <h3 id="ums-account" className="ums-label">
              Tài khoản
            </h3>
            <div className="ums-card">{accountRows.map(renderRow)}</div>
          </section>

          {/* ── Settings ── */}
          <section aria-labelledby="ums-settings">
            <h3 id="ums-settings" className="ums-label">
              Cài đặt
            </h3>
            <div className="ums-card">
              <div className="ums-row is-static">
                <span className="ums-row-icon" aria-hidden="true">
                  <Moon className="size-[18px]" />
                </span>
                <span className="ums-row-label">Chế độ tối</span>
                <ThemeToggle size="sm" />
              </div>
            </div>
          </section>

          {/* ── Help ── */}
          {!isDashboardUser && (
            <Link to="/chatbot" className="ums-help" onClick={onClose}>
              <span className="ums-help-icon" aria-hidden="true">
                <MessageCircleQuestion className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="ums-help-title">Trò chuyện với trợ lý</span>
                <span className="ums-help-sub">
                  Hỏi về khoá học, đơn hàng, len…
                </span>
              </span>
              <ChevronRight className="ums-chev" aria-hidden="true" />
            </Link>
          )}

          <button type="button" className="ums-logout" onClick={onLogout}>
            <LogOut className="size-4" aria-hidden="true" />
            Đăng xuất
          </button>
        </div>
      </motion.div>
    </>
  );
}
