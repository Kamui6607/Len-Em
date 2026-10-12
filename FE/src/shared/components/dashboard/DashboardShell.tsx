// ============================================================
// DashboardShell — khung chung cho Admin / Staff / Creator
// ------------------------------------------------------------
//  ┌ sidebar ┐┌ topbar (menu · breadcrumb · về cửa hàng) ┐
//  │         ││ nội dung trang                            │
// Mọi style dashboard được scope dưới `.admin-shell` (admin.css)
// nên không ảnh hưởng tới các trang mua sắm dùng chung class
// (.btn-primary, .input, ...).
// ============================================================

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "motion/react";
import { ArrowUpRight, ChevronRight, Menu } from "lucide-react";
import { cn } from "../ui/utils";
import { Sidebar, findActiveNav, type NavItem } from "./Sidebar";
import { Profile } from "../../../app/pages/Profile";
import "../../../styles/admin.css";

interface DashboardShellProps {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
  className?: string;
}

export function DashboardShell({ children, navItems, title, className }: DashboardShellProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const active = findActiveNav(navItems, location.pathname);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Chuyển trang thì thoát chế độ xem hồ sơ (trước đây hồ sơ "kẹt" lại)
  useEffect(() => {
    setShowProfile(false);
  }, [location.pathname]);

  return (
    <div className="admin-shell">
      <Sidebar
        navItems={navItems}
        title={title}
        onProfileClick={() => setShowProfile(true)}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
      />

      <div className="dash-main">
        {/* ── Topbar ── */}
        <header className="dash-topbar">
          <button
            type="button"
            className="dash-icon-btn dash-menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav className="dash-crumbs" aria-label="Breadcrumb">
            <span className="dash-crumb-root">{title}</span>
            {active?.group && (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                <span className="dash-crumb-group">{active.group}</span>
              </>
            )}
            {(active || showProfile) && (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                <span className="dash-crumb-current">
                  {showProfile ? "Hồ sơ" : active?.item.label}
                </span>
              </>
            )}
          </nav>

          <Link to="/" className="dash-store-link">
            <span className="hidden sm:inline">Xem cửa hàng</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </header>

        {/* ── Nội dung ── */}
        <motion.main
          key={showProfile ? "profile" : location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={cn("dash-content", className)}
        >
          {showProfile ? <Profile embedded /> : children}
        </motion.main>
      </div>
    </div>
  );
}
