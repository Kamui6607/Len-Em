// ============================================================
// Sidebar — điều hướng dùng chung cho Admin / Staff / Creator
// ------------------------------------------------------------
// - Desktop (≥ lg): cột cố định bên trái.
// - < lg: ngăn kéo (drawer) mở từ nút menu trên thanh topbar
//   của DashboardShell — trạng thái mở/đóng do DashboardShell giữ.
// - Mục có `children` hiển thị thành một NHÓM có nhãn (luôn mở),
//   không còn accordion phải bấm mới thấy.
// - Mục đang chọn = đường dẫn khớp DÀI NHẤT, nên /admin không
//   sáng cùng lúc với /admin/products.
// Style nằm ở src/styles/admin.css (.dash-side-*).
// ============================================================

import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { X, type LucideIcon } from "lucide-react";
import { UserMenu } from "../UserMenu";
import { ThemeToggle } from "../ThemeToggle";
import { cn } from "../ui/utils";
import { YarnBallIcon } from "../../../features/shop/shopMeta";

export interface NavItem {
  path?: string;
  label: string;
  icon: LucideIcon;
  children?: NavItem[];
  /** Giữ để tương thích — sidebar mới không còn nhãn "NEW" riêng. */
  highlighted?: boolean;
}

interface SidebarProps {
  navItems: NavItem[];
  title: string;
  onProfileClick?: () => void;
  /** Drawer < lg đang mở */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

/** Tất cả mục có đường dẫn (phẳng), để tìm mục đang chọn. */
export function flattenNav(items: NavItem[]): { item: NavItem; group?: string }[] {
  return items.flatMap((item) =>
    item.children?.length
      ? item.children.map((child) => ({ item: child, group: item.label }))
      : [{ item }],
  );
}

/** Mục khớp dài nhất với pathname (theo ranh giới "/"). */
export function findActiveNav(items: NavItem[], pathname: string) {
  let best: { item: NavItem; group?: string } | null = null;
  for (const entry of flattenNav(items)) {
    const path = entry.item.path;
    if (!path) continue;
    const matches = pathname === path || pathname.startsWith(`${path}/`);
    if (matches && (!best || path.length > (best.item.path?.length ?? 0))) best = entry;
  }
  return best;
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path!}
      onClick={onNavigate}
      className={cn("dash-side-link", active && "is-active")}
      aria-current={active ? "page" : undefined}
    >
      <span className="dash-side-link-icon">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SidebarContent({
  navItems,
  title,
  onProfileClick,
  onNavigate,
  onClose,
}: {
  navItems: NavItem[];
  title: string;
  onProfileClick?: () => void;
  onNavigate: () => void;
  onClose?: () => void;
}) {
  const location = useLocation();
  const activePath = findActiveNav(navItems, location.pathname)?.item.path;

  return (
    <>
      {/* Thương hiệu */}
      <div className="dash-side-brand">
        <Link to="/" className="dash-side-logo" aria-label="Về trang chủ Len&em">
          <YarnBallIcon size={20} strokeWidth={2} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="dash-side-name">Len&amp;em</p>
          <p className="dash-side-title">{title}</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="dash-icon-btn" aria-label="Đóng menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Điều hướng */}
      <nav className="dash-side-nav" aria-label={title}>
        {navItems.map((item) =>
          item.children?.length ? (
            <div key={item.label} className="dash-side-group">
              <p className="dash-side-group-label">{item.label}</p>
              {item.children.map((child) => (
                <NavLink
                  key={child.path}
                  item={child}
                  active={child.path === activePath}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          ) : (
            <NavLink
              key={item.path}
              item={item}
              active={item.path === activePath}
              onNavigate={onNavigate}
            />
          ),
        )}
      </nav>

      {/* Cuối: giao diện + tài khoản */}
      <div className="dash-side-foot">
        <ThemeToggle variant="row" />
        <UserMenu variant="sidebar" position="bottom" onProfileClick={onProfileClick} />
      </div>
    </>
  );
}

export function Sidebar({ navItems, title, onProfileClick, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();

  // Đổi trang thì đóng drawer
  useEffect(() => {
    onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Esc để đóng drawer
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onMobileClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      {/* Desktop */}
      <aside className="dash-side is-desktop">
        <SidebarContent
          navItems={navItems}
          title={title}
          onProfileClick={onProfileClick}
          onNavigate={() => undefined}
        />
      </aside>

      {/* < lg: drawer */}
      <div
        className={cn("dash-side-backdrop", mobileOpen && "is-open")}
        onClick={onMobileClose}
        aria-hidden
      />
      <aside
        className={cn("dash-side is-drawer", mobileOpen && "is-open")}
        aria-hidden={!mobileOpen}
        // React 18 chưa có kiểu cho `inert` — truyền dạng thuộc tính HTML thô
        // để drawer đóng không nhận focus bằng Tab.
        {...(!mobileOpen ? { inert: "" } : {})}
      >
        <SidebarContent
          navItems={navItems}
          title={title}
          onProfileClick={onProfileClick}
          onNavigate={onMobileClose}
          onClose={onMobileClose}
        />
      </aside>
    </>
  );
}
