import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  User,
  LogOut,
  ChevronDown,
  Shield,
  Users as UsersIcon,
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

  const DROPDOWN_WIDTH = 256;
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
    navigate("/auth/login");
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
        badge: "bg-destructive/10 text-destructive",
        avatar: "bg-destructive/10 text-destructive border-destructive/25",
      }
    : isStaff
      ? {
          badge: "bg-secondary/20 text-secondary-foreground",
          avatar:
            "bg-secondary/20 text-secondary-foreground border-secondary/30",
        }
      : {
          badge: "bg-primary/10 text-primary",
          avatar: "bg-primary/10 text-primary border-primary/25",
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
        initial={{ opacity: 0, y: position === "top" ? -6 : 6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: position === "top" ? -6 : 6, scale: 0.97 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        ref={dropdownRef}
        style={{ left: coords.left, top: coords.top, bottom: coords.bottom }}
        className="fixed w-64 bg-card rounded-2xl shadow-xl border border-border overflow-hidden z-[100]"
      >
        {/* User info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-sm font-semibold flex-shrink-0 ${roleStyle.avatar}`}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate text-sm">
                {user.fullName}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {user.email}
              </p>
              <span
                className={`inline-flex items-center gap-1 mt-1.5 text-[11px] px-2 py-0.5 rounded-full ${roleStyle.badge}`}
              >
                <RoleIcon className="w-3 h-3" />
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="py-1.5">
          {isDashboardUser && variant === "sidebar" ? (
            <button
              onClick={() => {
                setIsOpen(false);
                onProfileClick?.();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-foreground"
            >
              <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm">My Profile</span>
            </button>
          ) : (
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-foreground"
            >
              <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm">My Profile</span>
            </Link>
          )}

          {!isDashboardUser && (
            <Link
              to="/purchased"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-foreground"
            >
              <div className="w-7 h-7 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
                <UsersIcon className="w-3.5 h-3.5 text-secondary" />
              </div>
              <span className="text-sm">Purchased Orders</span>
            </Link>
          )}

          <div className="border-t border-border mx-3 mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-1 py-2.5 hover:bg-destructive/10 transition-colors text-foreground rounded-lg group"
            >
              <div className="w-7 h-7 bg-destructive/10 rounded-full flex items-center justify-center shrink-0 group-hover:bg-destructive/20 transition-colors">
                <LogOut className="w-3.5 h-3.5 text-destructive" />
              </div>
              <span className="text-sm text-destructive">Sign Out</span>
            </button>
          </div>
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
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted hover:border-border transition-all duration-200 text-left"
        >
          <div className="relative shrink-0">
            <div
              className={`w-8 h-8 rounded-full border-[1.5px] flex items-center justify-center text-[11px] font-semibold ${roleStyle.avatar}`}
            >
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border-2 border-card" />
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
            className={`w-3.5 h-3.5 text-muted-foreground/50 transition-transform shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      ) : (
        <button
          ref={buttonRef}
          onClick={toggleOpen}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <div
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-semibold ${roleStyle.avatar}`}
            >
              {initials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-card" />
          </div>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform hidden sm:block ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
