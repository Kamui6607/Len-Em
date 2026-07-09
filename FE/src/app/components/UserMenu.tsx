import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  User,
  LogOut,
  ChevronDown,
  Shield,
  Users as UsersIcon,
  HelpCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../hooks/useAuth";

interface UserMenuProps {
  position?: "top" | "bottom";
  variant?: "navbar" | "sidebar";
  onProfileClick?: () => void;
}

export function UserMenu({
  position = "top",
  variant = "navbar",
  onProfileClick,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    left: number;
    top?: number;
    bottom?: number;
  }>({ left: 16 });
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideMenu =
        menuRef.current && !menuRef.current.contains(target);
      const isOutsideDropdown =
        dropdownRef.current && !dropdownRef.current.contains(target);
      if (isOutsideMenu && isOutsideDropdown) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const DROPDOWN_WIDTH = 280;
  const GAP = 10;
  const MARGIN = 12;

  const updateCoords = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const preferredLeft =
      variant === "sidebar" ? rect.left : rect.right - DROPDOWN_WIDTH;
    const left = Math.min(
      Math.max(preferredLeft, MARGIN),
      window.innerWidth - DROPDOWN_WIDTH - MARGIN,
    );
    if (position === "top") {
      setCoords({ left, top: rect.bottom + GAP });
    } else {
      setCoords({ left, bottom: window.innerHeight - rect.top + GAP });
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    updateCoords();
    window.addEventListener("resize", updateCoords);
    return () => window.removeEventListener("resize", updateCoords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleOpen = () => {
    if (!isOpen) updateCoords();
    setIsOpen((p) => !p);
  };

  if (!user) return null;

  const handleLogout = () => {
    signOut();
    setIsOpen(false);
    navigate("/auth/login", { replace: true });
  };

  const isAdmin = user.roleId === "admin";
  const isStaff = user.roleId === "staff";
  const isDashboardUser = isAdmin || isStaff;

  const roleLabel = isAdmin
    ? "Administrator"
    : isStaff
      ? "Staff Member"
      : "Member";
  const RoleIcon = isAdmin ? Shield : isStaff ? UsersIcon : User;

  const roleStyle = isAdmin
    ? {
        badge: "bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)]",
        avatar: "bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)] border-[var(--primary)]/30",
      }
    : isStaff
      ? {
          badge: "bg-[var(--badge-pink-bg)] text-[var(--badge-pink-text)]",
          avatar: "bg-[var(--badge-pink-bg)] text-[var(--badge-pink-text)] border-[var(--badge-pink-text)]/30",
        }
      : {
          badge: "bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)]",
          avatar: "bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)] border-[var(--primary)]/20",
        };

  const initials =
    user.fullName
      ?.split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const dropdown = isOpen && (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === "top" ? -8 : 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: position === "top" ? -8 : 8, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        ref={dropdownRef}
        style={{
          position: "fixed",
          width: "280px",
          left: coords.left,
          top: coords.top,
          bottom: coords.bottom,
          background: "var(--card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "20px",
          boxShadow: "var(--shadow-float-lg)",
          overflow: "hidden",
          zIndex: 100,
        }}
      >
        {/* ── Decorative top accent stripe ── */}
        <div style={{
          height: "3px",
          background: "linear-gradient(90deg, var(--primary), var(--accent-pink), var(--accent-yellow))",
        }} />

        {/* ── User info header ── */}
        <div className="p-5 pb-4" style={{
          background: "var(--surface)",
        }}>
          <div className="flex items-center gap-3.5">
            {/* Avatar with premium ring */}
            <div className="relative shrink-0">
              <div
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold ${roleStyle.avatar}`}
                style={{ borderColor: "var(--primary)" }}
              >
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-[2.5px] shadow-sm" style={{
                borderColor: "var(--surface)"
              }} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--foreground)] truncate text-sm leading-tight">
                {user.fullName}
              </p>
              <p className="text-xs text-[var(--foreground-muted)] truncate mt-0.5">
                {user.email}
              </p>
              <span
                className={`inline-flex items-center gap-1 mt-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-semibold tracking-wide ${roleStyle.badge}`}
              >
                <RoleIcon className="w-3 h-3" />
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* ── Menu items ── */}
        <div className="py-2 px-2" style={{
          background: "var(--card)"
        }}>
          {/* Profile */}
          {isDashboardUser && variant === "sidebar" ? (
            <button
              onClick={() => {
                setIsOpen(false);
                onProfileClick?.();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
              style={{
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--chip-hover-bg)";
                e.currentTarget.style.transform = "translateX(2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
                background: "linear-gradient(135deg, var(--accent-blush), var(--accent-peach))",
                border: "1px solid var(--border-subtle)",
              }}>
                <User className="w-4.5 h-4.5 text-[var(--primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium block">My Profile</span>
                <span className="text-xs text-[var(--foreground-muted)] block">Manage your account</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--foreground-muted)", opacity: 0.5 }}>
                <path d="M4.5 2.5L9.5 7L4.5 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : (
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group no-underline"
              style={{
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--chip-hover-bg)";
                e.currentTarget.style.transform = "translateX(2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
                background: "linear-gradient(135deg, var(--accent-blush), var(--accent-peach))",
                border: "1px solid var(--border-subtle)",
              }}>
                <User className="w-4.5 h-4.5 text-[var(--primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium block">My Profile</span>
                <span className="text-xs text-[var(--foreground-muted)] block">Manage your account</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--foreground-muted)", opacity: 0.5 }}>
                <path d="M4.5 2.5L9.5 7L4.5 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          )}

          {/* Purchased Orders */}
          {!isDashboardUser && (
            <Link
              to="/purchased"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group no-underline"
              style={{
                color: "var(--foreground)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--chip-hover-bg)";
                e.currentTarget.style.transform = "translateX(2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
                background: "linear-gradient(135deg, var(--accent-butter), var(--accent-cream))",
                border: "1px solid var(--border-subtle)",
              }}>
                <UsersIcon className="w-4.5 h-4.5 text-[var(--primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium block">Purchased Orders</span>
                <span className="text-xs text-[var(--foreground-muted)] block">View your order history</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--foreground-muted)", opacity: 0.5 }}>
                <path d="M4.5 2.5L9.5 7L4.5 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          )}

          {/* ── Divider ── */}
          <div style={{
            height: "1px",
            background: "var(--divider)",
            margin: "6px 8px",
          }} />

          {/* ── Sign Out — Premium glass red style ── */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden"
            style={{
              background: "rgba(199,66,66,0.08)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(199,66,66,0.15)",
              color: "var(--error-text)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(199,66,66,0.15)";
              e.currentTarget.style.borderColor = "rgba(199,66,66,0.25)";
              e.currentTarget.style.transform = "translateX(2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(199,66,66,0.08)";
              e.currentTarget.style.borderColor = "rgba(199,66,66,0.15)";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            {/* Glass sheen overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)",
              borderRadius: "inherit",
            }} />
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative z-[1]" style={{
              background: "rgba(199,66,66,0.12)",
              border: "1px solid rgba(199,66,66,0.2)",
            }}>
              <LogOut className="w-4.5 h-4.5 text-[var(--error-text)]" />
            </div>
            <div className="flex-1 min-w-0 relative z-[1]">
              <span className="text-sm font-semibold block">Sign Out</span>
            </div>
            <div className="relative z-[1]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--error-text)", opacity: 0.6 }}>
                <path d="M9 3.5L12.5 7L9 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1.5 7H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
          </button>
        </div>

        {/* ── Footer hint ── */}
        <div style={{
          padding: "10px 16px",
          background: "var(--surface)",
          borderTop: "1px solid var(--divider)",
        }}>
          <p className="flex items-center gap-1.5" style={{
            fontFamily: "'Caveat', cursive",
            fontSize: "0.72rem",
            color: "var(--foreground-muted)",
          }}>
            <HelpCircle className="w-3 h-3" />
            Need help? Contact support
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className="relative" ref={menuRef}>
      {variant === "sidebar" ? (
        <button
          ref={buttonRef}
          onClick={toggleOpen}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border transition-all duration-200 text-left"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="relative shrink-0">
            <div
              className={`w-8 h-8 rounded-full border-[1.5px] flex items-center justify-center text-[11px] font-semibold ${roleStyle.avatar}`}
            >
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2" style={{
              borderColor: "var(--surface)"
            }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate leading-tight">
              {user.fullName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
              {roleLabel}
            </p>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
            style={{
              color: "var(--foreground-muted)"
            }}
          />
        </button>
      ) : (
        <button
          ref={buttonRef}
          onClick={toggleOpen}
          className="flex items-center gap-1 p-1 rounded-xl border transition-all duration-200"
          style={{
            background: "var(--surface-secondary)",
            borderColor: "var(--border)",
          }}
        >
          <div className="relative">
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${roleStyle.avatar}`}
            >
              {initials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2" style={{
              borderColor: "var(--card)"
            }} />
          </div>
        </button>
      )}

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}