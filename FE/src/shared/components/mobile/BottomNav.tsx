import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  LogIn,
  MessageCircleQuestion,
  Palette,
  ShoppingBag,
  User,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { UserMenu } from "../UserMenu";
import { ThemeToggle } from "../ThemeToggle";
import "../../../styles/nav.css";
import "../../../styles/user-menu.css";

const navItems: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/learn", icon: BookOpen, label: "Learn" },
  { href: "/shop", icon: ShoppingBag, label: "Shop" },
  { href: "/diy", icon: Palette, label: "DIY" },
];

const ACCOUNT_LABEL = "Tài khoản";

/** Routes that belong to the "Tài khoản" tab (highlight it while on them). */
const ACCOUNT_PATHS = [
  "/profile",
  "/notifications",
  "/addresses",
  "/purchased",
  "/love",
  "/orders",
  "/auth",
];

const startsWithPath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/** Sliding active pill shared by every tab (one layoutId → it glides). */
function ActivePill() {
  return (
    <motion.span
      layoutId="bottom-nav-patch"
      className="bottom-nav-patch"
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
    />
  );
}

export function BottomNav() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const accountActive = ACCOUNT_PATHS.some((p) => startsWithPath(location.pathname, p));

  return (
    <nav aria-label="Điều hướng chính" className="bottom-nav md:hidden">
      {/* Scrim: page content scrolling behind never shows below the pill */}
      <div className="bottom-nav-scrim" aria-hidden="true" />
      <div className="bottom-nav-bar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = startsWithPath(location.pathname, item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              aria-current={isActive ? "page" : undefined}
              className="bottom-nav-item"
            >
              {isActive && <ActivePill />}
              <Icon
                className="bottom-nav-icon"
                strokeWidth={isActive ? 2.3 : 2}
                fill={isActive ? "currentColor" : "none"}
                fillOpacity={isActive ? 0.28 : 0}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="bottom-nav-slot">
          {isLoading ? (
            <div className="bottom-nav-item opacity-50" aria-busy="true">
              <User className="bottom-nav-icon" aria-hidden="true" />
              <span>{ACCOUNT_LABEL}</span>
            </div>
          ) : isAuthenticated ? (
            <UserMenu
              position="bottom"
              label={ACCOUNT_LABEL}
              current={accountActive}
              activeIndicator={accountActive ? <ActivePill /> : null}
            />
          ) : (
            <GuestAccountTab active={accountActive} />
          )}
        </div>
      </div>
    </nav>
  );
}

/**
 * "Tài khoản" tab for signed-out visitors: a bottom sheet with sign in / sign up
 * and the secondary settings that used to live in the header ☰ drawer.
 */
function GuestAccountTab({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const sheet = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="guest-backdrop"
            className="um-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            key="guest-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={ACCOUNT_LABEL}
            className="um-panel is-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            <div className="um-grabber" aria-hidden="true" />
            <div className="um-head">
              <p className="um-hello">Chào bạn!</p>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                Đăng nhập để lưu khoá học và giỏ hàng
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 px-3 pb-2">
              <Link to="/auth/login" className="nav-drawer-tile">
                <LogIn className="size-4" aria-hidden="true" />
                Đăng nhập
              </Link>
              <Link to="/auth/register" className="nav-btn-primary min-h-12 rounded-2xl">
                <UserPlus className="size-4" aria-hidden="true" />
                Đăng ký
              </Link>
            </div>
            <div className="um-list">
              <div className="um-setting">
                <span>Giao diện sáng / tối</span>
                <ThemeToggle size="sm" />
              </div>
            </div>
            <Link to="/chatbot" className="um-foot">
              <MessageCircleQuestion className="size-4" aria-hidden="true" />
              Cần giúp? Hỏi trợ lý Len&amp;Em
            </Link>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        className="bottom-nav-item"
        aria-current={active ? "page" : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {active && <ActivePill />}
        <User
          className="bottom-nav-icon"
          strokeWidth={active ? 2.3 : 2}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.28 : 0}
          aria-hidden="true"
        />
        <span>{ACCOUNT_LABEL}</span>
      </button>
      {createPortal(sheet, document.body)}
    </>
  );
}
